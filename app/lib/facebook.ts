// app/lib/facebook.ts
import { buildApiUrl } from "./api";

export type FacebookPublishPayload = {
  customTitle?: string;
  customSummary?: string;
  imageUrlOverride?: string;
};

export type FacebookPublishResponse = {
  id: number;
  articleId: number;
  externalId: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

// Leemos el token del localStorage (igual que en otros módulos admin)
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("news_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function publishArticleToFacebook(
  articleId: number,
  payload: FacebookPublishPayload,
): Promise<FacebookPublishResponse> {
  const url = buildApiUrl(`/internal/facebook/publish/${articleId}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {
      // ignoramos errores al parsear
    }
    throw new Error(msg);
  }

  return res.json();
}
