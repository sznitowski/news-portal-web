// app/lib/formatDate.ts

export function formatDate(iso: string): string {
  // "2025-11-01T11:33:00.000Z" -> "01 nov 2025 - 11:33"
  const d = new Date(iso);

  const dia = d.getDate().toString().padStart(2, "0");
  const mes = d
    .toLocaleString("es-AR", { month: "short" })
    .replace(".", ""); // "nov."
  const año = d.getFullYear();

  const hora = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");

  return `${dia} ${mes} ${año} - ${hora}:${min}`;
}
