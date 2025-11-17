// app/admin/editor/page.tsx
"use client";

import EditorialArticlesTable from "../../api/editor/articles/EditorialArticlesTable";

export default function AdminEditorPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-2xl bg-white text-neutral-900 p-6 shadow-xl shadow-slate-900/15">
        <h1 className="text-xl font-semibold mb-2">Edición de notas</h1>
        <p className="text-sm text-neutral-600 mb-4">
          Acá podés ver y cambiar el estado de las notas (publicadas,
          borradores, archivadas) del portal.
        </p>

        <div className="mt-4">
          <EditorialArticlesTable />
        </div>
      </section>
    </main>
  );
}
