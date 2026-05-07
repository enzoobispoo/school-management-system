import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
const AVATAR_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function normalizeTelefone(raw: string | null | undefined): string | null {
  const t = String(raw ?? "").trim();
  return t.length === 0 ? null : t;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        nome: true,
        email: true,
        telefone: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json(currentUser);
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar conta." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const ct = request.headers.get("content-type") || "";
    let nome: string;
    let email: string;
    let telefone: string | null;
    let avatarUrlUpdate: string | null | undefined;

    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      nome = String(form.get("nome") ?? "").trim();
      email = String(form.get("email") ?? "").trim().toLowerCase();
      telefone = normalizeTelefone(String(form.get("telefone") ?? ""));

      const clearAvatar = form.get("avatarClear") === "1" || form.get("avatarClear") === "true";
      const file = form.get("avatar");
      const urlField = String(form.get("avatarUrl") ?? "").trim();

      if (clearAvatar) {
        avatarUrlUpdate = null;
      } else if (file instanceof File && file.size > 0) {
        if (file.size > AVATAR_MAX_BYTES) {
          return NextResponse.json(
            { error: "Imagem muito grande (máx. 4MB)." },
            { status: 400 }
          );
        }
        const mime = file.type || "application/octet-stream";
        if (!AVATAR_MIME.has(mime)) {
          return NextResponse.json(
            { error: "Use JPG, PNG, WebP ou GIF para a foto." },
            { status: 400 }
          );
        }
        const path = `avatars/${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_").slice(0, 80)}`;
        const blob = await put(path, file, { access: "public", contentType: mime });
        avatarUrlUpdate = blob.url;
      } else if (urlField.length === 0) {
        avatarUrlUpdate = undefined;
      } else {
        try {
          const u = new URL(urlField);
          if (u.protocol !== "https:" && u.protocol !== "http:") {
            throw new Error("invalid");
          }
          avatarUrlUpdate = urlField.slice(0, 2048);
        } catch {
          return NextResponse.json({ error: "URL da foto inválida." }, { status: 400 });
        }
      }
    } else {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      nome = String(body.nome ?? "").trim();
      email = String(body.email ?? "").trim().toLowerCase();
      telefone = normalizeTelefone(body.telefone as string | undefined);

      const au = body.avatarUrl;
      if (au === "" || au === null) {
        avatarUrlUpdate = null;
      } else if (typeof au === "string" && au.trim().length > 0) {
        try {
          const u = new URL(au.trim());
          if (u.protocol !== "https:" && u.protocol !== "http:") {
            throw new Error("invalid");
          }
          avatarUrlUpdate = au.trim().slice(0, 2048);
        } catch {
          return NextResponse.json({ error: "URL da foto inválida." }, { status: 400 });
        }
      } else {
        avatarUrlUpdate = undefined;
      }
    }

    if (nome.length < 2 || nome.length > 120) {
      return NextResponse.json({ error: "Nome entre 2 e 120 caracteres." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const emailTaken = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso por outra conta." },
        { status: 409 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        nome,
        email,
        telefone,
        ...(avatarUrlUpdate !== undefined ? { avatarUrl: avatarUrlUpdate } : {}),
      },
      select: {
        nome: true,
        email: true,
        telefone: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT settings/me:", error);
    return NextResponse.json(
      { error: "Erro ao salvar conta." },
      { status: 500 }
    );
  }
}
