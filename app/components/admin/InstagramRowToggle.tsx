//app/components/admin/InstagramRowToggle.tsx
"use client";

import { useState } from "react";
import {
  publishArticleToInstagram,
  buildInstagramCaptionFromSummary,
} from "../../lib/instagram";

type Props = {
  articleId: number;
  title: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  disabled?: boolean;
};

export function InstagramRowToggle(props: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDisabled = loading || props.disabled;

  async function handleChange() {
    if (isDisabled) return;

    const next = !checked;

    if (!next) {
      setChecked(false);
      return;
    }

    if (!props.coverImageUrl) {
      console.warn("No hay imagen de portada para publicar en Instagram");
      return;
    }

    setLoading(true);
    try {
      const caption = buildInstagramCaptionFromSummary(
        props.title,
        props.summary,
        2200,
      );

      await publishArticleToInstagram(props.articleId, {
        caption,
        imageUrl: props.coverImageUrl,
      });

      setChecked(true);
    } catch (err) {
      console.error("Error al publicar en Instagram", err);
      setChecked(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="inline-flex items-center gap-1 text-[11px] text-slate-200">
      <input
        type="checkbox"
        className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-900 text-pink-500 focus:ring-pink-500 disabled:opacity-40"
        checked={checked}
        disabled={isDisabled}
        onChange={handleChange}
      />
      <span className="select-none">IG{loading ? "…" : ""}</span>
    </label>
  );
}
