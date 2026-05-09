import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { requireProfessorContext } from "@/lib/docente/require-professor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Envie uma imagem." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Imagem muito grande (máx. 5MB)." }, { status: 400 });
    }
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { error: "Use JPG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }
    const safe = file.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 120);
    const path = `slide-assets/${schoolId}/${professorId}/${Date.now()}-${safe}`;
    const blob = await put(path, file, { access: "public", contentType: mime });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("POST slide-asset:", e);
    return NextResponse.json({ error: "Erro ao enviar imagem." }, { status: 500 });
  }
}
