import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import type { TipoAlunoRegistro } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ turmaId: string }>;
}

const TIPOS: TipoAlunoRegistro[] = ["OBSERVACAO", "OCORRENCIA", "ADVERTENCIA"];

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId } = ctx;

    const { turmaId } = await context.params;
    const denied = await guardProfessorTitularTurma(user, schoolId, turmaId);
    if (denied) return denied;

    const matriculas = await prisma.matricula.findMany({
      where: { schoolId, turmaId, status: "ATIVA" },
      select: { alunoId: true },
    });
    const alunoIds = [...new Set(matriculas.map((m) => m.alunoId))];
    if (alunoIds.length === 0) {
      return NextResponse.json([]);
    }

    const registros = await prisma.alunoRegistro.findMany({
      where: { schoolId, alunoId: { in: alunoIds } },
      include: {
        aluno: { select: { id: true, nome: true } },
        professor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    });

    return NextResponse.json(registros);
  } catch (e) {
    console.error("GET registros-aluno docente:", e);
    return NextResponse.json({ error: "Erro ao listar registros." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const { turmaId } = await context.params;
    const denied = await guardProfessorTitularTurma(user, schoolId, turmaId);
    if (denied) return denied;

    const body = await request.json();
    const alunoId = String(body?.alunoId || "").trim();
    const tipoRaw = String(body?.tipo || "").toUpperCase();
    const titulo = String(body?.titulo || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const gravidade = body?.gravidade ? String(body.gravidade).trim() : null;

    if (!alunoId || !titulo) {
      return NextResponse.json(
        { error: "alunoId e titulo são obrigatórios." },
        { status: 400 }
      );
    }

    const tipo = TIPOS.includes(tipoRaw as TipoAlunoRegistro)
      ? (tipoRaw as TipoAlunoRegistro)
      : ("OBSERVACAO" as const);

    const matricula = await prisma.matricula.findFirst({
      where: {
        schoolId,
        turmaId,
        status: "ATIVA",
        alunoId,
      },
      select: { id: true },
    });
    if (!matricula) {
      return NextResponse.json(
        { error: "Aluno não está ativo nesta turma." },
        { status: 400 }
      );
    }

    const row = await prisma.alunoRegistro.create({
      data: {
        schoolId,
        alunoId,
        professorId,
        tipo,
        titulo,
        descricao,
        gravidade,
      },
      include: {
        aluno: { select: { id: true, nome: true } },
        professor: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST registros-aluno docente:", e);
    return NextResponse.json({ error: "Erro ao registrar." }, { status: 500 });
  }
}
