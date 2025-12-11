import { buildApiUrl } from "./api";

export type InstagramPublishPayload = {
  caption: string;
  imageUrl: string;
};

export type InstagramPublishResponse = {
  id: number;
  articleId: number;
  externalId: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("news_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function publishArticleToInstagram(
  articleId: number,
  payload: InstagramPublishPayload,
): Promise<InstagramPublishResponse> {
  const url = buildApiUrl(`/internal/instagram/publish/${articleId}`);

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
