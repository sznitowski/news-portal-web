export default function EmptyState({
  message = "Sin resultados.",
}: {
  message?: string;
}) {
  return (
    <div className="text-neutral-500 text-sm italic">{message}</div>
  );
}
