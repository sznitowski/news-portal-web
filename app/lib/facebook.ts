// app/lib/facebook.ts
"use client";

import { buildApiUrl } from "./api";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("news_access_token");
  if (!token) return {};
  return { Authorization: `Bearer $token` };
}

export type FacebookPublishOverrides = {
  customTitle?: string;
  customSummary?: string;
  imageUrlOverride?: string;
};

export async function publishArticleToFacebook(
  articleId: number,
  overrides: FacebookPublishOverrides = {},
) {
  const url = buildApiUrl(`/internal/facebook/publish/${articleId}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(overrides),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      (data as any)?.message ||
      (data as any)?.error ||
      `Error Facebook (${res.status})`;
    throw new Error(msg);
  }

  return data as {
    id: number;
    articleId: number;
    status: "success" | "error" | "pending";
    externalId: string | null;
    errorMessage: string | null;
    createdAt: string;
  };
}
