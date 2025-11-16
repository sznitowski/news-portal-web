// app/admin/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Clave incorrecta");
      }

      // OK: redirigimos al panel
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Acceso al panel editorial
      </h1>
      <p style={{ marginBottom: 24, color: "#4b5563" }}>
        Esta sección es sólo para editores. Ingresá la clave de acceso.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Clave de acceso
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5f5",
              background: "#020617",
              color: "#f9fafb",
            }}
          />
        </label>

        {error && (
          <div
            style={{
              marginTop: 4,
              padding: "8px 10px",
              borderRadius: 6,
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            marginTop: 8,
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            fontWeight: 600,
            cursor: loading || !password ? "default" : "pointer",
            background: loading || !password ? "#9ca3af" : "#0b1120",
            color: "#f9fafb",
          }}
        >
          {loading ? "Entrando..." : "Entrar al panel"}
        </button>

        <a
          href="/"
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "#2563eb",
            textDecoration: "none",
          }}
        >
          ← Volver a la portada
        </a>
      </form>
    </main>
  );
}
