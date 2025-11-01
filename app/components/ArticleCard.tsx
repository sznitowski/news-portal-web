// components/ArticleCard.tsx
import Link from "next/link";
import { ArticleListItem } from "@/app/types/article";
import { formatDate } from "@/app/lib/formatDate";

export default function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <article className="border-b border-neutral-700 pb-4 mb-4">
      <header className="text-xs text-neutral-400 flex flex-wrap gap-2">
        <span className="uppercase font-bold text-blue-400">{article.category}</span>
        <span>{formatDate(article.publishedAt)}</span>
        <span className="text-neutral-500">({article.ideology})</span>
      </header>

      <h3 className="text-lg font-semibold text-neutral-100 leading-snug mt-2">
        <Link
          href={`/article/${article.slug}`}
          className="hover:text-blue-300 hover:underline"
        >
          {article.title}
        </Link>
      </h3>

      <p className="text-sm italic text-neutral-500 mt-1">
        {article.summary ?? "(sin resumen)"}
      </p>
    </article>
  );
}
