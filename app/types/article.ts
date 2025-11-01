// /types/article.ts
export type Article = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  bodyHtml?: string; 
  category: string;
  ideology: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};
