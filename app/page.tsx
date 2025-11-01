import { Article } from "./types/article";

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

async function getArticles(): Promise<Article[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  const res = await fetch(`${base}/articles`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Error al pedir /articles", res.status);
    return [];
  }

  return res.json();
}

export default async function HomePage() {
  const articles = await getArticles();

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100 px-4 py-8">
      <header className="max-w-5xl mx-auto mb-8 border-b border-neutral-700 pb-4">
        <h1 className="text-2xl font-semibold">Mi Portal de Noticias</h1>
        <p className="text-sm text-neutral-400">
          Últimas publicaciones (limpiadas + etiquetadas con sesgo "RIGHT")
        </p>
      </header>

      <section className="max-w-5xl mx-auto space-y-4">
        {articles.length === 0 && (
          <div className="text-neutral-400 text-sm">
            No hay artículos publicados todavía.
          </div>
        )}

        {articles.map((a) => (
          <article
            key={a.id}
            className="bg-neutral-800/60 border border-neutral-700 rounded-lg p-4 hover:bg-neutral-800 transition"
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center text-xs gap-2 text-neutral-400">
                <span className="uppercase tracking-wide font-medium text-emerald-400/80">
                  {a.category || "sin categoría"}
                </span>

                <span className="text-[10px] px-2 py-[2px] rounded bg-neutral-700 text-neutral-300 border border-neutral-600">
                  {a.ideology || "NEUTRAL"}
                </span>

                <span className="text-neutral-500">
                  {formatDate(a.publishedAt || a.createdAt)}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-neutral-100 leading-snug">
                <a className="hover:underline" href={`/article/${a.slug}`}>
                  {a.title}
                </a>
              </h2>

              {a.summary && (
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {a.summary}
                </p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
