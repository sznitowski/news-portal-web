export default function Loader({
  label = "Cargando...",
}: {
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-neutral-400 text-sm">
      <div className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-500 border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
