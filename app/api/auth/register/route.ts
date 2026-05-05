import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const exists = await prisma.school.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    attempt++;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const nomeEscola = String(body?.nomeEscola ?? "").trim();
    const nome = String(body?.nome ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!nomeEscola) return NextResponse.json({ error: "Nome da escola é obrigatório." }, { status: 400 });
    if (!nome) return NextResponse.json({ error: "Seu nome é obrigatório." }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Já existe uma conta com esse e-mail." }, { status: 409 });
    }

    const slug = await uniqueSlug(nomeEscola);
    const passwordHash = await bcrypt.hash(password, 12);

    const { school, user } = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: { nome: nomeEscola, slug },
      });

      await tx.escolaSettings.create({
        data: { id: school.id, schoolId: school.id, nomeEscola },
      });

      const user = await tx.user.create({
        data: { nome, email, passwordHash, role: "ADMIN", schoolId: school.id, ativo: true },
      });

      return { school, user };
    });

    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: school.id,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
      school: { id: school.id, nome: school.nome, slug: school.slug },
    }, { status: 201 });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Erro ao registrar escola:", error);
    return NextResponse.json({ error: "Não foi possível criar a conta." }, { status: 500 });
  }
}
