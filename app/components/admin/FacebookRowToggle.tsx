// app/components/admin/FacebookRowToggle.tsx
"use client";

import { useState } from "react";
import { publishArticleToFacebook } from "../../lib/facebook";

type Props = {
  articleId: number;
  title: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  disabled?: boolean; // <- NUEVO
};

export function FacebookRowToggle(props: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDisabled = loading || props.disabled;

  async function handleChange() {
    // Si está deshabilitado, no hacemos nada
    if (isDisabled) return;

    const next = !checked;

    // Si destildás, por ahora sólo cambiamos el estado visual
    if (!next) {
      setChecked(false);
      return;
    }

    setLoading(true);
    try {
      await publishArticleToFacebook(props.articleId, {
        customTitle: props.title,
        customSummary: props.summary ?? undefined,
        imageUrlOverride: props.coverImageUrl ?? undefined,
      });
      setChecked(true);
    } catch (err) {
      console.error("Error al publicar en Facebook", err);
      setChecked(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="inline-flex items-center gap-1 text-[11px] text-slate-200">
      <input
        type="checkbox"
        className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-900 text-fuchsia-500 focus:ring-fuchsia-500 disabled:opacity-40"
        checked={checked}
        disabled={isDisabled}
        onChange={handleChange}
      />
      <span className="select-none">
        FB{loading ? "…" : ""}
      </span>
    </label>
  );
}
