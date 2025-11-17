// app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { buildApiUrl } from "../lib/api";

const LOGIN_URL = buildApiUrl("/auth/login");
const ME_URL = buildApiUrl("/auth/me");

export default function LoginPage() {
  const [email, setEmail] = useState("valentin@example.com");
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
    // Ocupa casi todo el alto disponible debajo del header
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
      {/* “Card” grande tipo Aurora */}
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 shadow-[0_32px_90px_rgba(15,23,42,0.85)] flex flex-col lg:flex-row">
        {/* COLUMNA IZQUIERDA – ilustración / branding */}
        <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center bg-slate-950">
          {/* Degradados detrás del dibujo */}
          <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.35),_transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.8),_transparent_55%)]" />

          {/* “Ilustración” simple geométrica modo placeholder */}
          <div className="relative z-10 flex flex-col gap-6 px-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-lg">
                IL
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-300">
                  Info libertario
                </span>
                <span className="text-xs text-slate-400">
                  Panel editorial interno
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">
                Controlá tu línea editorial con datos.
              </h2>
              <p className="text-sm text-slate-300/80 max-w-sm">
                Gestioná notas, titulares y experimentos de portada desde un
                único panel pensado para editores obsesionados con la
                performance.
              </p>
            </div>

            {/* “Muñequitos” minimalistas con Tailwind */}
            <div className="mt-4 flex items-end gap-4">
              <div className="h-20 w-16 rounded-2xl bg-emerald-500/90 flex items-center justify-center text-slate-950 font-semibold text-lg shadow-lg shadow-emerald-500/30">
                🙂
              </div>
              <div className="h-24 w-20 rounded-2xl bg-sky-500/90 flex items-center justify-center text-slate-950 font-semibold text-lg shadow-lg shadow-sky-500/30">
                📈
              </div>
              <div className="h-16 w-14 rounded-2xl bg-emerald-400/90 flex items-center justify-center text-slate-950 font-semibold text-lg shadow-lg shadow-emerald-400/40">
                📰
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA – formulario */}
        <div className="w-full lg:w-[48%] bg-slate-950 px-7 py-8 sm:px-9 sm:py-10 flex flex-col">
          {/* Top row: “¿No tenés cuenta?” (solo visual) */}
          <div className="mb-6 flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-100 text-base">
              Log in
            </span>
            <span>
              ¿No tenés cuenta?{" "}
              <button
                type="button"
                className="text-sky-400 hover:text-sky-300 font-medium"
              >
                Pedir acceso
              </button>
            </span>
          </div>

          {/* Botones sociales de adorno */}
          <div className="space-y-3 mb-5">
            <button
              type="button"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800/80 transition"
            >
              <span className="h-4 w-4 rounded-full bg-sky-400" />
              <span>Sign in with Google</span>
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800/80 transition"
            >
              <span className="h-4 w-4 rounded-full bg-indigo-400" />
              <span>Sign in with Microsoft</span>
            </button>
          </div>

          {/* Separador “or use email” */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4">
            <div className="h-[1px] flex-1 bg-slate-800" />
            <span>o usá email</span>
            <div className="h-[1px] flex-1 bg-slate-800" />
          </div>

          {/* Banner con tip de demo */}
          <div className="mb-4 rounded-xl border border-sky-900/60 bg-slate-900/90 px-4 py-3 text-[11px] sm:text-xs text-slate-100 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/90 text-[11px] font-bold text-slate-950">
                i
              </div>
              <span className="font-medium">Tip de demo</span>
            </div>
            <div className="pl-7">
              <div>
                <span className="text-slate-400">Email:&nbsp;</span>
                <code className="font-mono text-sky-300">
                  valentin@example.com
                </code>
              </div>
              <div>
                <span className="text-slate-400">Password:&nbsp;</span>
                <code className="font-mono text-sky-300">123456</code>
              </div>
            </div>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-xl border border-slate-700
                  bg-slate-900/90
                  px-3 py-2.5 text-sm
                  text-slate-100
                  outline-none
                  focus:border-sky-400 focus:ring-1 focus:ring-sky-500
                "
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full rounded-xl border border-slate-700
                  bg-slate-900/90
                  px-3 py-2.5 text-sm
                  text-slate-100
                  outline-none
                  focus:border-sky-400 focus:ring-1 focus:ring-sky-500
                "
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-900 bg-rose-950/80 px-3 py-2 text-xs text-rose-100">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-sky-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Recordar este dispositivo</span>
              </label>

              <button
                type="button"
                className="text-sky-400 hover:text-sky-300 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                mt-3 w-full rounded-xl
                bg-sky-500 hover:bg-sky-400
                px-4 py-2.5 text-sm font-semibold
                text-slate-950
                transition
                disabled:bg-slate-600 disabled:text-slate-300
              "
            >
              {loading ? "Autenticando..." : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
