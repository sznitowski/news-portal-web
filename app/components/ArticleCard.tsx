// app/components/ArticleCard.tsx

import Link from "next/link";
import { ArticleListItem } from "../types/article";
import { formatDate } from "../lib/formatDate";

type Props = {
  article: ArticleListItem;
};

export default function ArticleCard({ article }: Props) {
  return (
    <article className="border-b border-neutral-700 py-4">
      <div className="flex flex-col gap-1">
        {/* categoría + fecha + ideología */}
        <div className="text-xs text-neutral-400 flex flex-wrap gap-2">
          <span className="uppercase font-semibold text-[10px] tracking-wide text-blue-300">
            {article.category || "sin categoría"}
          </span>

          <span className="text-neutral-500">
            {article.publishedAt
              ? formatDate(article.publishedAt)
              : "sin fecha"}
          </span>

          {article.ideology ? (
            <span className="text-neutral-500">
              ({article.ideology})
            </span>
          ) : null}
        </div>

        {/* título */}
        <Link
          href={`/article/${article.slug}`}
          className="text-lg font-semibold text-neutral-100 hover:text-white hover:underline"
        >
          {article.title}
        </Link>

        {/* resumen */}
        {article.summary ? (
          <p className="text-sm text-neutral-400 leading-snug">
            {article.summary}
          </p>
        ) : (
          <p className="text-sm text-neutral-600 italic">
            (sin resumen)
          </p>
        )}
      </div>
    </article>
  );
}
