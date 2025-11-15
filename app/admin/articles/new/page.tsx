// app/admin/articles/new/page.tsx
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import ImageUploader from "../../../components/ImageUploader";

export default function NewArticlePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("politica");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg("El título es obligatorio");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/manual-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body, // el route.ts lo mapea a bodyHtml si hace falta
          category,
          imageUrl,
        }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // puede venir texto plano
      }

      if (!res.ok) {
        throw new Error(
          `Error al guardar nota (${res.status}) ${text || ""}`.trim()
        );
      }

      console.log("Artículo creado:", json);

      setSuccessMsg("Nota creada correctamente");
      setTitle("");
      setBody("");
      setCategory("politica");
      setImageUrl(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message ?? "Error inesperado al crear la nota");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Crear nueva nota</h1>

      <p style={{ marginBottom: 8, color: "#555" }}>
        Carga rápida de una nota con título, categoría, cuerpo de texto e
        imagen principal.
      </p>

      <p
        style={{
          marginBottom: 24,
          fontSize: "0.9rem",
          color: "#666",
        }}
      >
        Si preferís generar la nota a partir de una captura con IA, usá la
        opción{" "}
        <Link
          href="/admin/manual"
          style={{
            fontWeight: 600,
            textDecoration: "underline",
            textDecorationStyle: "dotted",
          }}
        >
          Cargar desde imagen (IA)
        </Link>{" "}
        en el panel de administración.
      </p>

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
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
            placeholder="Ingresá el título de la nota"
          />
        </div>

        {/* Categoría */}
        <div>
          <label
            htmlFor="category"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Categoría
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          >
            <option value="politica">Política</option>
            <option value="economia">Economía</option>
            <option value="internacional">Internacional</option>
          </select>
        </div>

        {/* Imagen principal */}
        <section
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px dashed #ccc",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Imagen principal
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: 12 }}>
            Subí la imagen que se va a usar como portada de la nota. Se aloja en
            el backend y se sirve desde <code>/uploads</code>.
          </p>

          <ImageUploader onUploaded={(url) => setImageUrl(url)} />

          {imageUrl && (
            <div style={{ marginTop: 12 }}>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#444",
                  marginBottom: 4,
                }}
              >
                Vista previa de la imagen subida:
              </p>
              <img
                src={imageUrl}
                alt="Portada de la nota"
                style={{
                  maxWidth: "100%",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
              <p
                style={{
                  marginTop: 4,
                  fontSize: "0.8rem",
                  color: "#666",
                  wordBreak: "break-all",
                }}
              >
                <code>{imageUrl}</code>
              </p>
            </div>
          )}
        </section>

        {/* Cuerpo */}
        <div>
          <label
            htmlFor="body"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Cuerpo
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
            placeholder="Escribí el texto de la nota aquí…"
          />
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
            justifySelf: "flex-start",
          }}
        >
          {loading ? "Guardando..." : "Guardar artículo"}
        </button>
      </form>
    </main>
  );
}
