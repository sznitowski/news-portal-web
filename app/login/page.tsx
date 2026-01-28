// app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { buildApiUrl } from "../lib/api";

const LOGIN_URL = buildApiUrl("/auth/login");
const ME_URL = buildApiUrl("/auth/me");

export default function LoginPage() {
  const [email, setEmail] = useState("vsznitowski@gmail.com");
  const [password, setPassword] = useState("123456");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

        const baseMaxAge = 60 * 60 * 8; // 8 hs
        const maxAge = remember ? baseMaxAge * 3 : baseMaxAge;

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
    // Ocupa casi todo el alto debajo del header, pero anclado arriba
    <div className="min-h-[calc(100vh-80px)] flex justify-center items-start pt-10 lg:pt-16">
      {/* Card principal */}
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-[0_28px_80px_rgba(15,23,42,0.16)] flex flex-col lg:flex-row">
        {/* COLUMNA IZQUIERDA – branding más sobrio */}
        <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 text-slate-50 px-10 py-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center font-bold text-lg">
                CL
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-300">
                  Canallibertario · Panel editorial
                </span>
                <span className="text-[11px] text-slate-400">
                  Acceso interno para el equipo de noticias.
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">
                Controlá tu línea editorial con un único panel.
              </h2>
              <p className="text-sm text-slate-200/80 max-w-sm">
                Administrá notas, titulares y la portada del sitio desde un
                panel pensado para editores, con foco en la performance.
              </p>
            </div>

            {/* “Tarjeta” aclaratoria */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-300">
              <div className="text-slate-100 font-semibold">
                Solo equipo editorial
              </div>
              <div className="mt-1 normal-case tracking-normal text-slate-300/90">
                Usá este acceso solo si trabajás en el panel de noticias del
                portal.
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA – formulario en blanco */}
        <div className="w-full lg:w-[54%] bg-white px-8 py-8 sm:px-10 sm:py-10 flex flex-col">
          {/* Header del formulario */}
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-slate-900">
              Iniciar sesión en el panel
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Acceso para editores de Canallibertario.
            </p>
          </div>

          {/* Banner con tip de demo */}
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] sm:text-xs text-slate-800 flex gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-slate-50 shrink-0">
              i
            </div>
            <div>
              <div className="font-medium text-slate-900">Tip de demo</div>
              <div className="mt-1 space-y-0.5">
                <div>
                  <span className="text-slate-500">Email:&nbsp;</span>
                  <code className="font-mono text-slate-900">
                    vsznitowski@gmail.com
                  </code>
                </div>
                <div>
                  <span className="text-slate-500">Password:&nbsp;</span>
                  <code className="font-mono text-slate-900">123456</code>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-xl border border-slate-300
                  bg-white
                  px-3 py-2.5 text-sm
                  text-slate-900
                  outline-none
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                "
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full rounded-xl border border-slate-300
                  bg-white
                  px-3 py-2.5 text-sm
                  text-slate-900
                  outline-none
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                "
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Recordar este dispositivo</span>
              </label>

              <button
                type="button"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                mt-3 w-full rounded-xl
                bg-slate-900 hover:bg-slate-800
                px-4 py-2.5 text-sm font-semibold
                text-slate-50
                transition
                disabled:bg-slate-400 disabled:text-slate-100
              "
            >
              {loading ? "Autenticando..." : "Entrar al panel"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
