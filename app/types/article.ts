// app/types/article.ts

// Lo que devuelve GET /articles
export type ArticleListItem = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  ideology: string | null;         // ahora permitimos null
  sourceIdeology: string | null;   
  publishedAt: string; // ISO string
  createdAt: string;   // ISO string
  updatedAt: string;   // ISO string
};

export type ArticleRow = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body_html: string;
  category: string;
  ideology: string | null;
  source_ideology: string | null;   // <--- NUEVO
  image_url: string | null;
  published_at: Date;
  // ...
};

// Lo que devuelve GET /articles/:slug
// Incluye bodyHtml (el cuerpo limpio listo para render)
export type ArticleFull = ArticleListItem & {
  bodyHtml: string;
};
