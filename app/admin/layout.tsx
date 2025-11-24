// app/admin/layout.tsx
import React from "react";
import Navbar from "../components/navbar/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Más espacio en blanco entre header y título del panel
    <div className="space-y-4 pt-8">
      {/* Sub-navbar sólo para /admin/... */}
      <Navbar />

      {/* Contenido de cada página /admin/... */}
      {children}
    </div>
  );
}
