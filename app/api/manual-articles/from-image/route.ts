// app/api/manual-articles/from-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "../../../lib/api";

const DEFAULT_CATEGORY = "Noticias";
const DEFAULT_IDEOLOGY = "neutral";

type FormSnapshot = {
    title?: string;
    summary?: string;
    bodyHtml?: string;
    category?: string;
    ideology?: string;
    sourceIdeology?: string;   // <-- NUEVO
    publishedAt?: string;
    imageUrl?: string;
};

type AiSuggestion = {
    title?: string;
    summary?: string;
    bodyHtml?: string;
    category?: string;
    ideology?: string;
    sourceIdeology?: string;
};

// Helper: escapa comillas y & para usar en atributos HTML (alt="")
function escapeHtmlAttr(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Si el valor existente tiene texto, se respeta;
// si está vacío, se usa el de la IA.
function preferExisting(existing?: unknown, ai?: unknown): string | undefined {
    const ex =
        typeof existing === "string"
            ? existing.trim()
            : existing == null
                ? ""
                : String(existing).trim();

    if (ex.length > 0) {
        return typeof existing === "string" ? existing : String(existing);
    }

    const aiStr =
        typeof ai === "string"
            ? ai.trim()
            : ai == null
                ? ""
                : String(ai).trim();

    return aiStr.length > 0 ? aiStr : undefined;
}

// Si el usuario dejó la categoría vacía o en el default,
// usamos la sugerida por la IA. Si eligió algo distinto, lo respetamos.
function mergeCategory(userCat?: string, aiCat?: string): string {
    const u = (userCat ?? "").trim();
    const a = (aiCat ?? "").trim();

    if (!u || u === DEFAULT_CATEGORY) {
        return a || u || DEFAULT_CATEGORY;
    }
    return u;
}

// Igual que arriba pero para ideología.
function mergeIdeology(userIde?: string, aiIde?: string): string {
    const u = (userIde ?? "").trim();
    const a = (aiIde ?? "").trim();

    if (!u || u === DEFAULT_IDEOLOGY) {
        return a || u || DEFAULT_IDEOLOGY;
    }
    return u;
}

const INTERNAL_KEY = process.env.INTERNAL_INGEST_KEY ?? "supersecreto123";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image");
        const formJson = formData.get("formJson") as string | null;

        let form: FormSnapshot = {};
        if (formJson) {
            try {
                form = JSON.parse(formJson) as FormSnapshot;
            } catch (err) {
                console.error("No se pudo parsear formJson:", err);
            }
        }

        if (!(file instanceof File)) {
            return NextResponse.json(
                { message: "No se recibió ninguna imagen" },
                { status: 400 }
            );
        }

        // 1) Subir imagen al backend (/internal/uploads/image)
        const uploadBody = new FormData();
        uploadBody.set("image", file);

        const uploadRes = await fetch(buildApiUrl("/internal/uploads/image"), {
            method: "POST",
            body: uploadBody,
        });

        if (!uploadRes.ok) {
            const text = await uploadRes.text().catch(() => "");
            console.error(
                "Error al subir imagen:",
                uploadRes.status,
                uploadRes.statusText,
                text
            );
            return NextResponse.json(
                { message: "Error al subir la imagen al backend" },
                { status: 502 }
            );
        }

        const uploadJson = (await uploadRes.json()) as {
            url?: string;
            imageUrl?: string;
        };

        // Puede venir como /uploads/... o como http://localhost:5001/uploads/...
        const rawImageUrl = uploadJson.url ?? uploadJson.imageUrl;
        if (!rawImageUrl) {
            return NextResponse.json(
                { message: "El backend no devolvió URL de imagen" },
                { status: 502 }
            );
        }

        // URL pública que va a consumir tanto el front como el bodyHtml
        const publicImageUrl = buildApiUrl(rawImageUrl);

        // 2) Pedir sugerencias a la IA (/internal/articles/from-image-ai)
        const aiRes = await fetch(buildApiUrl("/internal/articles/from-image-ai"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-ingest-key": INTERNAL_KEY,
            },
            body: JSON.stringify({ imageUrl: rawImageUrl }),
        });

        if (!aiRes.ok) {
            const text = await aiRes.text().catch(() => "");
            console.error(
                "Error al llamar a /internal/articles/from-image-ai:",
                aiRes.status,
                aiRes.statusText,
                text
            );
            return NextResponse.json(
                { message: "Error al procesar la captura con IA" },
                { status: 502 }
            );
        }

        const ai = (await aiRes.json()) as AiSuggestion;

        // 3) Merge de campos de texto
        const finalTitle = preferExisting(form.title, ai.title);
        const finalSummary = preferExisting(form.summary, ai.summary);
        const baseBodyHtml = preferExisting(form.bodyHtml, ai.bodyHtml);

        // 4) Armamos el bodyHtml final:
        //    - Si el usuario YA tenía bodyHtml, lo respetamos tal cual.
        //    - Si estaba vacío y la IA dio texto, agregamos la imagen al inicio.
        let finalBodyHtml = baseBodyHtml;

        const shouldInjectImage = !form.bodyHtml && !!baseBodyHtml;

        if (shouldInjectImage) {
            const altText =
                finalTitle ??
                "Captura de pantalla de la publicación original";

            const imgTag = `<p><img src="${publicImageUrl}" alt="${escapeHtmlAttr(
                altText
            )}" /></p>\n`;

            finalBodyHtml = imgTag + (baseBodyHtml ?? "");
        }

        const merged = {
            title: finalTitle,
            summary: finalSummary,
            bodyHtml: finalBodyHtml,
            category: mergeCategory(form.category, ai.category),
            ideology: mergeIdeology(form.ideology, ai.ideology),
            sourceIdeology: preferExisting(           // <-- NUEVO
                form.sourceIdeology,
                ai.sourceIdeology
            ),
            imageUrl: publicImageUrl,
        };

        return NextResponse.json(merged);
    } catch (err) {
        console.error("Error inesperado en /api/manual-articles/from-image:", err);
        return NextResponse.json(
            { message: "Error inesperado al procesar la captura con IA" },
            { status: 500 }
        );
    }
}
