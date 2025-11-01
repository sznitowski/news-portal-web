const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5001";

export async function fetchArticles() {
  const res = await fetch(`${API_BASE}/articles`, {
    // Esto fuerza render en el server cada request (sin cache)
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Error al obtener artículos");
  }

  // El backend devuelve un array de artículos planos
  return res.json();
}

export async function fetchArticle(slug: string) {
  const res = await fetch(`${API_BASE}/articles/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Artículo no encontrado");
  }

  return res.json();
}
