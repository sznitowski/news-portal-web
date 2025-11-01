import { Article } from "./../../types/article";

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function sanitize(html: string) {
  if (!html) return "";

  // eliminar <script>...</script>
  let cleaned = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

  // eliminar atributos tipo onclick=, onload=, etc
  cleaned = cleaned.replace(/\son\w+="[^"]*"/gi, "");
  cleaned = cleaned.replace(/\son\w+='[^']*'/gi, "");

  return cleaned;
}

async function getArticle(slug: string): Promise<Article | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  const res = await fetch(`${base}/articles/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("No se pudo cargar articulo", slug, res.status);
    return null;
  }

  return res.json();
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <main className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-8 flex items-center justify-center">
        <div className="text-center text-neutral-400">
          Artículo no encontrado.
        </div>
      </main>
    );
  }

  const safeHtml = sanitize(article.bodyHtml || "");

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-8">
      <article className="max-w-3xl mx-auto">
        {/* meta */}
        <div className="text-xs text-neutral-400 flex flex-wrap gap-2 mb-3">
          <span className="uppercase tracking-wide font-medium text-emerald-400/80">
            {article.category || "sin categoría"}
          </span>

          <span className="text-[10px] px-2 py-[2px] rounded bg-neutral-700 text-neutral-300 border border-neutral-600">
            {article.ideology || "NEUTRAL"}
          </span>

          <span className="text-neutral-500">
            {formatDate(article.publishedAt || article.createdAt)}
          </span>
        </div>

        {/* título */}
        <h1 className="text-2xl font-semibold text-neutral-100 leading-tight mb-4">
          {article.title}
        </h1>

        {/* resumen */}
        {article.summary && (
          <p className="text-neutral-300 text-lg leading-relaxed mb-6">
            {article.summary}
          </p>
        )}

        {/* cuerpo limpio */}
        <div
          className="prose prose-invert prose-neutral max-w-none text-neutral-200 text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </article>
    </main>
  );
}
