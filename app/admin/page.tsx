// app/admin/page.tsx
"use client";

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-2xl bg-white text-neutral-900 p-6 shadow-xl shadow-slate-900/15">
        <h1 className="text-xl font-semibold mb-3">
          Bienvenido al panel editorial
        </h1>

        <p className="text-sm text-neutral-600 mb-4">
          Usá el menú superior <strong>“Panel editorial”</strong> para acceder a
          las distintas acciones: edición de notas, publicación manual o
          publicación desde imagen (IA).
        </p>

        <ul className="text-sm text-neutral-700 space-y-2 list-disc list-inside">
          <li>
            <strong>Edición de notas:</strong> administrás las notas ya creadas
            (publicadas, borradores, archivadas).
          </li>
          <li>
            <strong>Publicar nota manual:</strong> cargás título, resumen y
            cuerpo HTML directamente.
          </li>
          <li>
            <strong>Publicar desde imagen (IA):</strong> subís una captura y la
            IA sugiere título, resumen y cuerpo, e inserta la imagen en la nota.
          </li>
        </ul>

        <p className="text-xs text-neutral-500 mt-5">
          Más adelante acá podemos sumar estadísticas rápidas (cantidad de
          visitas, últimas notas, errores de scraping, etc.).
        </p>
      </section>
    </main>
  );
}
