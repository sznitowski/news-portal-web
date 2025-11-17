// app/login/page.tsx
"use client";

import { useState } from "react";
import { buildApiUrl } from "../lib/api"; // <- relativo a app/lib/api.ts

const LOGIN_URL = buildApiUrl("/auth/login");
const ME_URL = buildApiUrl("/auth/me");

export default function LoginPage() {
  const [email, setEmail] = useState("valentin@example.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Error ${res.status}`);
      }

      const accessToken = data?.accessToken as string | undefined;
      if (!accessToken) {
        throw new Error("El backend no devolvió accessToken");
      }

      const meRes = await fetch(ME_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const meData = await meRes.json().catch(() => null);

      if (!meRes.ok) {
        throw new Error(
          meData?.message || `Error en /auth/me (${meRes.status})`
        );
      }

      if (meData?.role !== "ADMIN") {
        throw new Error("Tu usuario no tiene rol ADMIN");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("news_access_token", accessToken);
        localStorage.setItem("news_user", JSON.stringify(meData));

        // Cookie para que el middleware deje pasar a /admin
        const maxAge = 60 * 60 * 8; // 8 horas
        document.cookie = `editor_auth=1; path=/; max-age=${maxAge}`;
      }

      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)", // deja el header arriba
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#e5e7eb",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360, // más chico
          background:
            "radial-gradient(circle at top, rgba(56,189,248,0.16), transparent 60%), #020617",
          borderRadius: "0.9rem",
          padding: "1.25rem 1.4rem",
          border: "1px solid rgba(31,41,55,0.9)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.75)",
        }}
      >
        <h1
          style={{
            fontSize: "1.2rem",
            marginBottom: "0.35rem",
            fontWeight: 600,
          }}
        >
          Iniciar sesión
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#9ca3af",
            marginBottom: "0.9rem",
          }}
        >
          Acceso al panel de administración del portal.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "0.65rem" }}
        >
          <div style={{ display: "grid", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.85rem" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "0.45rem 0.55rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.85rem" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "0.45rem 0.55rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.9rem",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: "0.8rem",
                color: "#fecaca",
                background: "#7f1d1d",
                borderRadius: "0.5rem",
                padding: "0.45rem 0.65rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.4rem",
              padding: "0.48rem 0.75rem",
              borderRadius: "999px",
              border: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: loading ? "default" : "pointer",
              background: loading ? "#4b5563" : "#22c55e",
              color: "#020617",
              transition: "background 0.15s ease, transform 0.1s ease",
            }}
          >
            {loading ? "Autenticando..." : "Entrar al panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
