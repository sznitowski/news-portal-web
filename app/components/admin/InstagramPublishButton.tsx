"use client";

import { useState } from "react";
import { publishArticleToInstagram } from "../../lib/instagram";

type Props = {
  articleId: number;
  title: string;
  summary?: string | null;
  coverImageUrl?: string | null;
};

export function InstagramPublishButton(props: Props) {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setLastResult(null);

    try {
      if (!props.coverImageUrl) {
        throw new Error("No hay imagen de portada para Instagram");
      }

      const captionParts: string[] = [];
      if (props.title?.trim()) captionParts.push(props.title.trim());
      if (props.summary?.trim()) {
        captionParts.push("");
        captionParts.push(props.summary.trim());
      }
      const caption = captionParts.join("\n");

      const res = await publishArticleToInstagram(props.articleId, {
        caption,
        imageUrl: props.coverImageUrl,
      });

      setLastResult(
        `Publicado en IG (simulado) con estado ${res.status}, externalId=${res.externalId ?? "null"}`,
      );
    } catch (err: any) {
      setError(err?.message || "Error al publicar en Instagram");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-3 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
      >
        {loading
          ? "Publicando en Instagram..."
          : "Publicar en Instagram (simulado)"}
      </button>

      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}

      {lastResult && (
        <p className="text-xs text-emerald-400">
          {lastResult}
        </p>
      )}
    </div>
  );
}
