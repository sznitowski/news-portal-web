// app/api/news-inbox/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/app/lib/api";

// usa el mismo criterio que venís usando en otros routes
const INTERNAL_KEY =
    process.env.INTERNAL_INGEST_KEY ??
    process.env.INGEST_KEY ??
    "supersecreto123";

function buildHeaders(req: NextRequest) {
    const h: Record<string, string> = { "content-type": "application/json" };

    const tokenFromCookie = req.cookies.get("editor_auth")?.value;
    if (tokenFromCookie) h["authorization"] = `Bearer ${tokenFromCookie}`;

    const authHeader = req.headers.get("authorization");
    if (authHeader) h["authorization"] = authHeader;

    if (INTERNAL_KEY) h["x-ingest-key"] = INTERNAL_KEY;

    return h;
}


/**
 * GET /api/news-inbox?status=new&topic=politica&q=...&page=1&limit=30
 * -> proxy a /internal/inbox
 */
export async function GET(req: NextRequest) {
    try {
        const u = req.nextUrl;
        const qs = u.searchParams.toString();

        const res = await fetch(buildApiUrl(`/internal/inbox${qs ? `?${qs}` : ""}`), {
            method: "GET",
            headers: buildHeaders(req),
            cache: "no-store",
        });

        const text = await res.text().catch(() => "");
        if (!res.ok) {
            return NextResponse.json(
                { message: "Error listando inbox", statusCode: res.status, backend: text },
                { status: 502 },
            );
        }

        const json = text ? JSON.parse(text) : { items: [], meta: null };
        return NextResponse.json(json, { status: 200 });
    } catch (err) {
        console.error("[news-inbox][GET] error:", err);
        return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
    }
}

/**
 * PATCH /api/news-inbox
 * Body:
 *  { action: "news-batch", payload: { items: [...] } }
 *  { action: "queue"|"discard"|"processed", id: 123 }
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => null)) as any;
        if (!body) return NextResponse.json({ message: "JSON inválido" }, { status: 400 });

        const headers = buildHeaders(req);

        // batch ingest
        if (body.action === "news-batch") {
            const res = await fetch(buildApiUrl("/internal/inbox/news-batch"), {
                method: "PATCH",
                headers,
                body: JSON.stringify(body.payload ?? {}),
            });

            const text = await res.text().catch(() => "");
            if (!res.ok) {
                return NextResponse.json(
                    { message: "Error ingestando batch", statusCode: res.status, backend: text },
                    { status: 502 },
                );
            }

            return NextResponse.json(text ? JSON.parse(text) : { ok: true }, { status: 200 });
        }

        // single status change
        const id = Number(body.id);
        const action = String(body.action || "");
        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json({ message: "id inválido" }, { status: 400 });
        }
        if (!["queue", "discard", "processed"].includes(action)) {
            return NextResponse.json({ message: "action inválida" }, { status: 400 });
        }

        const res = await fetch(buildApiUrl(`/internal/inbox/${id}/${action}`), {
            method: "PATCH",
            headers,
            body: JSON.stringify({}), // por si tu server espera body (no hace daño)
        });

        const text = await res.text().catch(() => "");
        if (!res.ok) {
            return NextResponse.json(
                { message: "Error actualizando estado", statusCode: res.status, backend: text },
                { status: 502 },
            );
        }

        return NextResponse.json(text ? JSON.parse(text) : { ok: true }, { status: 200 });
    } catch (err) {
        console.error("[news-inbox][PATCH] error:", err);
        return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
    }
}
