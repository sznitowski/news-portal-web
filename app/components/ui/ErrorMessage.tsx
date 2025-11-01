export default function ErrorMessage({
  message = "Ocurrió un error.",
}: {
  message?: string;
}) {
  return (
    <div className="rounded border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
      {message}
    </div>
  );
}
