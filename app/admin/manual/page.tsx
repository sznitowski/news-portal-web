// app/admin/manual/page.tsx
"use client";

import { FormEvent, useState, ClipboardEvent } from "react";

type FormState = {
  title: string;
  summary: string;
  bodyHtml: string;
  category: string;
  ideology: string;
  publishedAt: string;
  imageUrl?: string; // URL de la imagen en el backend (/uploads/...)
};

export default function ManualArticlePage() {
  const [form, setForm] = useState<FormState>({
    title: "",
    summary: "",
    bodyHtml: "",
    category: "Noticias",
    ideology: "oficialismo",
    publishedAt: new Date().toISOString().slice(0, 19) + "Z",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // estado para imagen y su procesamiento
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ÚNICO lugar donde seteamos la imagen seleccionada/pegada
  const handleScreenshotFile = (file: File) => {
    setImageFile(file);
    setErrorMsg(null);
    setSuccessMsg(
      'Imagen lista para procesar. Ahora hacé clic en "Procesar captura con IA".'
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      handleScreenshotFile(file);
    }
  };

  // Permitir pegar una captura de pantalla (Ctrl+V)
  const handlePasteImage = (e: ClipboardEvent<HTMLElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleScreenshotFile(file);
          // Evitamos que intente pegar binario en algún textarea
          e.preventDefault();
        }
        break;
      }
    }
  };

  // Atajos para programar la publicación (ahora, +15min, +1h)
  const setDelay = (minutes: number) => {
    setForm((prev) => {
      const d = new Date();
      d.setMinutes(d.getMinutes() + minutes);
      const iso = d.toISOString(); // ya viene con Z
      return { ...prev, publishedAt: iso };
    });
  };

  const handleProcessImage = async () => {
    if (!imageFile) {
      setErrorMsg("Subí o pegá una imagen antes de procesarla.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setImageLoading(true);

    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      // Enviamos también el formulario actual para que la IA
      // sólo complete lo que falte.
      fd.append("formJson", JSON.stringify(form));

      const res = await fetch("/api/manual-articles/from-image", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }

      const suggested = await res.json();

      setForm((prev) => {
        // El backend ya hizo el merge respetando lo que estaba completo.
        const next: FormState = {
          ...prev,
          ...suggested,
        };

        const imgUrl: string | undefined =
          suggested.imageUrl ?? next.imageUrl ?? undefined;

        let finalBody: string = next.bodyHtml ?? prev.bodyHtml;

        // Si tenemos imagen, la inyectamos al principio evitando duplicados
        if (imgUrl) {
          const imgTag = `<p><img src="${imgUrl}" alt="${
            next.title || "Imagen de la captura"
          }" /></p>`;

          if (!finalBody || !finalBody.includes(imgTag)) {
            finalBody = imgTag + "\n\n" + (finalBody || "");
          }
        }

        next.bodyHtml = finalBody;

        return next;
      });

      setSuccessMsg("Campos rellenados a partir de la captura (dummy IA).");
    } catch (err: any) {
      setErrorMsg(
        err.message ?? "Error al procesar la captura con la IA (dummy)."
      );
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/manual-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // mandamos todo el form; el backend va a usar title/summary/bodyHtml/etc.
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error HTTP ${res.status}`);
      }

      const article = await res.json();

      setSuccessMsg(
        `Nota creada correctamente: "${article.title}" (slug: ${article.slug})`
      );

      setForm((prev) => ({
        ...prev,
        title: "",
        summary: "",
        bodyHtml: "",
        imageUrl: "",
      }));
      setImageFile(null);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Error inesperado al crear la nota");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 24 }}>
        Cargar artículo desde imagen (IA)
      </h1>

      <p style={{ marginBottom: 24, color: "#555" }}>
        Subí una captura de una publicación (Twitter, Facebook, portal de
        noticias, etc.) o una imagen de portada. La IA sugiere título, resumen,
        cuerpo e inserta la imagen en la nota. Después podés ajustar todo antes
        de publicar.
      </p>

      {/* Bloque para subir captura */}
      <section
        onPaste={handlePasteImage} // soporta Ctrl+V
        style={{
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px dashed #ccc",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Procesar captura de pantalla
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: 12 }}>
          Subí una captura de una publicación oficial (ej. captura de Twitter /
          Facebook). Al hacer clic en{" "}
          <strong>“Procesar captura con IA”</strong>, se sube la imagen al
          backend, se genera texto sugerido y se inserta la imagen en el cuerpo
          de la nota. Ahora mismo devuelve datos de prueba; después se conecta a
          una IA real.
        </p>
        <p style={{ fontSize: "0.85rem", color: "#444", marginBottom: 12 }}>
          También podés <strong>copiar una captura</strong> y pegarla con{" "}
          <code>Ctrl+V</code> en esta caja: se cargará automáticamente como
          imagen a procesar.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ maxWidth: 260 }}
          />

          <button
            type="button"
            onClick={handleProcessImage}
            disabled={imageLoading || !imageFile}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "none",
              background: imageLoading ? "#999" : "#222",
              color: "#fff",
              fontWeight: 600,
              cursor: imageLoading || !imageFile ? "default" : "pointer",
            }}
          >
            {imageLoading
              ? "Procesando captura..."
              : "Procesar captura con IA"}
          </button>
        </div>

        {/* Preview de imagen si tenemos URL */}
        {form.imageUrl && (
          <div style={{ marginTop: 16 }}>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#444",
                marginBottom: 8,
              }}
            >
              Vista previa de la imagen subida:
            </p>
            <img
              src={form.imageUrl}
              alt="Preview captura"
              style={{
                maxWidth: "100%",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        {/* Título */}
        <div>
          <label
            htmlFor="title"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Título *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Resumen */}
        <div>
          <label
            htmlFor="summary"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Resumen *
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            rows={3}
            value={form.summary}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Cuerpo HTML */}
        <div>
          <label
            htmlFor="bodyHtml"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Cuerpo (HTML limpio) *
          </label>
          <textarea
            id="bodyHtml"
            name="bodyHtml"
            required
            rows={6}
            value={form.bodyHtml}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              fontFamily: "monospace",
              fontSize: "0.9rem",
            }}
          />
          <small style={{ color: "#777" }}>
            Ejemplo:{" "}
            {"<p>Texto principal procesado por IA desde una captura.</p>"}
          </small>
        </div>

        {/* Categoría + Ideología */}
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          <div>
            <label
              htmlFor="category"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Categoría *
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="Noticias">Noticias</option>
              <option value="economia">Economía</option>
              <option value="politica">Política</option>
              <option value="internacional">Internacional</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="ideology"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Línea editorial / etiqueta
            </label>
            <select
              id="ideology"
              name="ideology"
              value={form.ideology}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="oficialismo">oficialismo</option>
              <option value="oposicion">oposicion</option>
              <option value="neutral">neutral</option>
              <option value="RIGHT">RIGHT</option>
              <option value="LEFT">LEFT</option>
            </select>
          </div>
        </div>

        {/* Fecha publicada */}
        <div>
          <label
            htmlFor="publishedAt"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Fecha/hora publicada (ISO) *
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="text"
            required
            value={form.publishedAt}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              fontFamily: "monospace",
              fontSize: "0.9rem",
            }}
          />
          <small style={{ color: "#777" }}>
            Formato: 2025-11-15T12:00:00Z (después lo cambiamos por un
            datepicker).
          </small>

          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              fontSize: "0.85rem",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#555" }}>Atajos rápidos:</span>
            <button
              type="button"
              onClick={() => setDelay(0)}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                background: "#f3f4f6",
                cursor: "pointer",
              }}
            >
              Ahora
            </button>
            <button
              type="button"
              onClick={() => setDelay(15)}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                background: "#f3f4f6",
                cursor: "pointer",
              }}
            >
              +15 min
            </button>
            <button
              type="button"
              onClick={() => setDelay(60)}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #ccc",
                background: "#f3f4f6",
                cursor: "pointer",
              }}
            >
              +1 hora
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {errorMsg && (
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              background: "#ffe5e5",
              color: "#a00",
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              background: "#e5ffe8",
              color: "#0a6b1a",
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Botón guardar */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            background: loading ? "#999" : "#111",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Guardando..." : "Crear artículo"}
        </button>
      </form>
    </main>
  );
}
