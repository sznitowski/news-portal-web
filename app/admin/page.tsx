// app/admin/page.tsx
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "32px auto",
        padding: "0 16px",
      }}
    >
      {/* Cabecera del panel */}
      <section
        style={{
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: 0,
          marginBottom: 24,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Panel editorial
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#d1d5db",
              maxWidth: 520,
            }}
          >
            Desde acá podés crear nuevas notas manuales o generar artículos a
            partir de capturas procesadas con IA. Esta sección es sólo para uso
            interno.
          </p>
        </div>
      </section>

      {/* Layout 2 columnas: menú lateral + contenido */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Menú lateral izquierdo */}
        <aside
          style={{
            borderRadius: 16,
            backgroundColor: "#020617",
            color: "#e5e7eb",
            padding: 16,
            boxShadow: "0 18px 35px -20px rgba(15,23,42,0.55)",
            border: "1px solid #111827",
          }}
        >
          <h2
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#9ca3af",
              marginBottom: 10,
            }}
          >
            Acciones rápidas
          </h2>

          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Link
              href="/admin/articles/new"
              style={{
                display: "block",
                padding: "8px 12px",
                borderRadius: 9999,
                border: "1px solid #f9fafb",
                backgroundColor: "#f9fafb",
                color: "#020617",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Publicar nota manual
            </Link>

            <Link
              href="/admin/manual"
              style={{
                display: "block",
                padding: "8px 12px",
                borderRadius: 9999,
                border: "1px solid #4b5563",
                backgroundColor: "transparent",
                color: "#e5e7eb",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Imagen (IA)
            </Link>

            <Link
              href="/"
              style={{
                display: "block",
                padding: "6px 10px",
                borderRadius: 9999,
                border: "1px solid #374151",
                backgroundColor: "transparent",
                color: "#9ca3af",
                fontSize: 12,
                textDecoration: "none",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              Ver portada pública
            </Link>

            {/* Cuando quieras sumar más secciones (métricas, logs, etc.),
                podés ir agregando más <Link> o botones acá. */}
          </nav>
        </aside>

        {/* Contenido principal del panel */}
        <section
          style={{
            borderRadius: 16,
            backgroundColor: "#f9fafb",
            padding: 24,
            boxShadow: "0 22px 45px -22px rgba(15,23,42,0.35)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 8,
              color: "#111827",
            }}
          >
            Bienvenido al panel editorial
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#4b5563",
              marginBottom: 12,
            }}
          >
            Elegí una opción del menú de la izquierda:
          </p>

          <ul
            style={{
              fontSize: 13,
              color: "#6b7280",
              paddingLeft: 18,
              listStyle: "disc",
              display: "grid",
              gap: 4,
            }}
          >
            <li>
              <strong>Publicar nota manual</strong>: cargás título, resumen y
              cuerpo HTML directamente. Ideal para editoriales o notas
              especiales.
            </li>
            <li>
              <strong>Imagen (IA)</strong>: subís una captura (tweet, post,
              captura de portal, etc.) y la IA sugiere título, resumen y cuerpo,
              e inserta la imagen en la nota.
            </li>
            <li>
              Después de publicar, la nota aparece automáticamente en la
              portada según la categoría y la fecha/hora de publicación.
            </li>
          </ul>

          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 18,
            }}
          >
            Más adelante acá podemos sumar estadísticas rápidas (cantidad de
            visitas, últimos errores, estado de los scrapers, etc.).
          </p>
        </section>
      </section>
    </main>
  );
}
