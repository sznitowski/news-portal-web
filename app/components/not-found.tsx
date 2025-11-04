// app/not-found.tsx
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <p className="text-sm text-neutral-500 mb-2">404</p>
      <h1 className="text-2xl font-semibold mb-2 text-slate-900">
        No encontramos esa página
      </h1>
      <p className="text-neutral-600 mb-6 text-center max-w-md">
        Es posible que la nota haya sido eliminada, esté despublicada
        o que el enlace sea incorrecto.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-full border border-neutral-300 text-sm hover:bg-neutral-100"
      >
        Volver a la portada
      </Link>
    </main>
  );
}
