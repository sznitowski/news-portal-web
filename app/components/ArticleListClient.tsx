"use client";

import { useEffect, useState } from "react";
import Loader from "./ui/Loader";
import ErrorMessage from "./ui/ErrorMessage";
import EmptyState from "./ui/EmptyState";
import Link from "next/link";
import { ArticleListItem } from "../types/article";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";

function formatDateHuman(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shouldShowIdeology(category?: string | null, ideology?: string | null) {
  if (!category || !ideology) return false;
  const cat = category.toLowerCase();
  const ide = ideology.toLowerCase();
  if (ide === "neutral") return false;
  if (cat !== "politica") return false;
  return true;
}

export default function ArticleListClient({ category }: { category?: string }) {
  const [data, setData] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErr(null);

        const url = category
          ? `${API_BASE}/articles?category=${encodeURIComponent(category)}`
          : `${API_BASE}/articles`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setErr(e.message || "Error al cargar artículos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category]);

  if (loading) {
    return <Loader label="Cargando artículos..." />;
  }

  if (err) {
    return <ErrorMessage message={err} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState message="(Todavía no hay artículos publicados en esta categoría)" />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((a) => (
        <article
          key={a.id}
          className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 hover:bg-neutral-800/60 transition"
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 mb-2">
            <span className="uppercase tracking-wide text-amber-400 font-semibold">
              {a.category || "sin categoría"}
            </span>
            <span>•</span>
            <span>{formatDateHuman(a.publishedAt)}</span>
            {shouldShowIdeology(a.category, a.ideology) && (
              <>
                <span>•</span>
                <span className="uppercase tracking-wide text-violet-300 font-semibold">
                  {a.ideology}
                </span>
              </>
            )}
          </div>

          <h2 className="text-lg font-semibold text-white leading-snug">
            <Link
              href={`/article/${a.slug}`}
              className="hover:underline text-white"
            >
              {a.title}
            </Link>
          </h2>

          {a.summary ? (
            <p className="mt-2 text-sm text-neutral-300">{a.summary}</p>
          ) : (
            <p className="mt-2 text-sm text-neutral-500 italic">
              (sin resumen)
            </p>
          )}

          <div className="mt-3">
            <Link
              href={`/article/${a.slug}`}
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              Leer nota completa →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
