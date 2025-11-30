// app/components/admin/FacebookPublishButton.tsx
"use client";

import { useState } from "react";
import { publishArticleToFacebook } from "../../lib/facebook";

type Props = {
  articleId: number;
  title: string;
  summary?: string | null;
  coverImageUrl?: string | null;
};

export function FacebookPublishButton(props: Props) {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setLastResult(null);

    try {
      const res = await publishArticleToFacebook(props.articleId, {
        customTitle: props.title,
        customSummary: props.summary ?? undefined,
        imageUrlOverride: props.coverImageUrl ?? undefined,
      });

      setLastResult(
        `Publicado (simulado) con estado ${res.status}, externalId=${res.externalId ?? "null"}`,
      );
    } catch (err: any) {
      setError(err?.message || "Error al publicar en Facebook");
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
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Publicando en Facebook..." : "Publicar en Facebook (simulado)"}
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
