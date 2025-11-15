'use client';

import { useState } from "react";
import { uploadImage } from "../lib/api";

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    setUploadedUrl(null);

    if (f) {
      const objectUrl = URL.createObjectURL(f);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Seleccioná un archivo primero.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const url = await uploadImage(file); // viene de app/lib/api.ts
      setUploadedUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Test de subida de imagen</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        style={{ marginLeft: 8 }}
      >
        {isUploading ? "Subiendo..." : "Subir"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 8 }}>
          {error}
        </p>
      )}

      {previewUrl && (
        <div style={{ marginTop: 12 }}>
          <div>Preview local:</div>
          <img
            src={previewUrl}
            alt="preview"
            style={{ maxWidth: 200, maxHeight: 200, objectFit: "cover" }}
          />
        </div>
      )}

      {uploadedUrl && (
        <div style={{ marginTop: 12 }}>
          <div>Imagen subida (URL pública):</div>
          <a href={uploadedUrl} target="_blank" rel="noreferrer">
            {uploadedUrl}
          </a>
          <div style={{ marginTop: 8 }}>
            <img
              src={uploadedUrl}
              alt="uploaded"
              style={{ maxWidth: 200, maxHeight: 200, objectFit: "cover" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
