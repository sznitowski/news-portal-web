// app/page.tsx
import { getLatestArticles } from "./lib/api";
import ArticleCard from "./components/ArticleCard";

export default async function HomePage() {
  const articles = await getLatestArticles();

  return (
    <main className="flex flex-col items-center py-8">
      <section className="w-full max-w-3xl bg-neutral-900 text-neutral-100 border border-neutral-700 rounded-sm shadow-sm p-6">
        {/* header */}
        <header className="mb-4">
          <h1 className="text-xl font-bold text-white">
            Mi Portal de Noticias
          </h1>
          <p className="text-sm text-neutral-400">
            Últimas publicaciones (scrapeadas → limpiadas → etiquetadas
            &quot;RIGHT&quot;)
          </p>
        </header>

        <hr className="border-neutral-700 mb-4" />

        {/* listado / vacío */}
        {articles.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">
            (Todavía no hay artículos publicados)
          </p>
        ) : (
          <div className="flex flex-col">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}

        <hr className="border-neutral-700 mt-6 mb-2" />

        {/* footer chico */}
        <footer className="text-center text-[11px] text-neutral-500">
          v0.1 - interno / demo
        </footer>
      </section>
    </main>
  );
}
