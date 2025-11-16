// app/admin/layout.tsx
import React from "react";
import Navbar from "../components/navbar/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // -mt-4 “sube” un poco el bloque para que quede más pegado al header negro
    <div className="-mt-4 space-y-4">
      {/* Sub-navbar sólo para /admin/... */}
      <Navbar />

      {/* Contenido de cada página /admin/... */}
      {children}
    </div>
  );
}
