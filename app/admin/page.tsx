// app/admin/page.tsx
"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  const handleLogout = async () => {
    try {
      await fetch("/admin/logout", { method: "POST" });
      // Después de cerrar sesión, te mando a la portada pública
      window.location.href = "/";
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Cabecera negra del panel */}
      <section className="rounded-xl bg-black text-white px-6 py-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="text-sm tracking-[0.18em] uppercase text-neutral-400">
          Panel editorial
        </div>
        <p className="text-xs md:text-[13px] text-neutral-400">
          Desde acá podés crear nuevas notas manuales o generar artículos a partir
          de capturas procesadas con IA. Esta sección es sólo para uso interno.
        </p>
      </section>

      {/* Layout principal: menú lateral + contenido */}
      <section className="grid gap-6 md:grid-cols-[260px,1fr] items-start">
        {/* Lado izquierdo: acciones rápidas */}
        <aside className="rounded-2xl bg-neutral-950 text-neutral-50 p-5 shadow-xl shadow-black/40 border border-neutral-800 space-y-4">
          <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-neutral-400">
            Acciones rápidas
          </h2>

          <div className="space-y-3">
            <Link
              href="/admin/articles/new"
              className="block w-full text-center rounded-full bg-white text-neutral-900 text-sm font-semibold py-2 hover:bg-neutral-100 transition-colors"
            >
              Publicar nota manual
            </Link>

            <Link
              href="/admin/manual"
              className="block w-full text-center rounded-full border border-neutral-600 text-sm font-semibold py-2 hover:bg-neutral-900 transition-colors"
            >
              Imagen (IA)
            </Link>

            <Link
              href="/"
              className="block w-full text-center rounded-full border border-neutral-700 text-xs font-medium py-2 text-neutral-300 hover:bg-neutral-900 transition-colors"
            >
              Ver portada pública
            </Link>
          </div>

          {/* Separador */}
          <div className="h-px bg-neutral-800 my-3" />

          {/* Cerrar sesión */}
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full text-center rounded-full border border-red-500/70 text-xs font-semibold py-2 text-red-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </aside>

        {/* Lado derecho: texto de bienvenida / futuro dashboard */}
        <section className="rounded-2xl bg-white text-neutral-900 p-6 shadow-xl shadow-slate-900/15">
          <h1 className="text-xl font-semibold mb-3">
            Bienvenido al panel editorial
          </h1>
          <p className="text-sm text-neutral-600 mb-4">
            Elegí una opción del menú de la izquierda:
          </p>

          <ul className="text-sm text-neutral-700 space-y-2 list-disc list-inside">
            <li>
              <strong>Publicar nota manual:</strong> cargás título, resumen y
              cuerpo HTML directamente. Ideal para editoriales o notas especiales.
            </li>
            <li>
              <strong>Imagen (IA):</strong> subís una captura (tweet, post, captura
              de portal, etc.) y la IA sugiere título, resumen y cuerpo, e inserta
              la imagen en la nota.
            </li>
            <li>
              Después de publicar, la nota aparece automáticamente en la portada
              según la categoría y la fecha/hora de publicación.
            </li>
          </ul>

          <p className="text-xs text-neutral-500 mt-5">
            Más adelante acá podemos sumar estadísticas rápidas (cantidad de
            visitas, últimas notas, errores de scraping, etc.).
          </p>
        </section>
      </section>
    </main>
  );
}
