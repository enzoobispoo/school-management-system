import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import type { TipoMaterialDidatico } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 15 * 1024 * 1024;

const TIPOS: TipoMaterialDidatico[] = [
  "SLIDE",
  "ATIVIDADE_IMPRESSAO",
  "PROVA_IMPRESSAO",
  "PLANO_AULA",
  "REFERENCIA",
  "OUTRO",
];

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const turmaId = request.nextUrl.searchParams.get("turmaId") || undefined;
    const tipoParam = request.nextUrl.searchParams.get("tipo")?.toUpperCase();
    const tipoFiltrado =
      tipoParam && TIPOS.includes(tipoParam as TipoMaterialDidatico)
        ? (tipoParam as TipoMaterialDidatico)
        : undefined;

    const rows = await prisma.materialDidatico.findMany({
      where: {
        schoolId,
        professorId,
        ...(turmaId ? { turmaId } : {}),
        ...(tipoFiltrado ? { tipo: tipoFiltrado } : {}),
      },
      include: {
        turma: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET docente materiais:", e);
    return NextResponse.json({ error: "Erro ao listar materiais." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const titulo = String(formData.get("titulo") || "").trim();
    const tipoRaw = String(formData.get("tipo") || "OUTRO").toUpperCase();
    const descricao = formData.get("descricao")
      ? String(formData.get("descricao")).trim()
      : null;
    const turmaId = formData.get("turmaId")
      ? String(formData.get("turmaId")).trim()
      : null;
    const disciplinaId = formData.get("disciplinaId")
      ? String(formData.get("disciplinaId")).trim()
      : null;

    if (!file || !titulo) {
      return NextResponse.json(
        { error: "Arquivo e título são obrigatórios." },
        { status: 400 }
      );
    }

    const tipo = (TIPOS.includes(tipoRaw as TipoMaterialDidatico) ?
      tipoRaw
    : "OUTRO") as TipoMaterialDidatico;

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande (máx. 15MB)." }, { status: 400 });
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não permitido para envio." },
        { status: 400 }
      );
    }

    if (turmaId) {
      const denied = await guardProfessorTitularTurma(user, schoolId, turmaId);
      if (denied) return denied;
    }

    if (disciplinaId && turmaId) {
      const link = await prisma.turmaDisciplina.findFirst({
        where: { schoolId, turmaId, disciplinaId },
        select: { id: true },
      });
      if (!link) {
        return NextResponse.json(
          { error: "Disciplina não pertence a esta turma." },
          { status: 400 }
        );
      }
    } else if (disciplinaId && !turmaId) {
      const d = await prisma.disciplina.findFirst({
        where: { id: disciplinaId, schoolId },
        select: { id: true },
      });
      if (!d) {
        return NextResponse.json({ error: "Disciplina inválida." }, { status: 400 });
      }
    }

    const safeName = file.name.replace(/[^\w.\-()\s]/g, "_").slice(0, 180);
    const path = `docente/${schoolId}/${professorId}/${Date.now()}-${safeName}`;
    const blob = await put(path, file, { access: "public", contentType: mime });

    const row = await prisma.materialDidatico.create({
      data: {
        schoolId,
        professorId,
        turmaId: turmaId || null,
        disciplinaId: disciplinaId || null,
        tipo,
        titulo,
        descricao,
        arquivoUrl: blob.url,
        arquivoNome: file.name,
        mimeType: mime,
        tamanhoBytes: file.size,
      },
      include: {
        turma: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST docente materiais:", e);
    return NextResponse.json({ error: "Erro ao enviar material." }, { status: 500 });
  }
}
