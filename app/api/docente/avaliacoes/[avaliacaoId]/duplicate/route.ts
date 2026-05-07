import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { requireProfessorContext } from "@/lib/docente/require-professor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ avaliacaoId: string }>;
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

    const { avaliacaoId } = await context.params;

    const origem = await prisma.avaliacao.findFirst({
      where: { id: avaliacaoId, schoolId, professorId },
      include: {
        questoes: {
          orderBy: { ordem: "asc" },
          include: { alternativas: { orderBy: { ordem: "asc" } } },
        },
      },
    });

    if (!origem) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    if (origem.deletedAt) {
      return NextResponse.json(
        { error: "Não é possível duplicar uma prova na lixeira." },
        { status: 400 }
      );
    }

    const deniedOrigem = await guardProfessorTitularTurma(user, schoolId, origem.turmaId);
    if (deniedOrigem) return deniedOrigem;

    const body = await request.json().catch(() => ({}));
    const turmaIdDest = typeof body?.turmaId === "string" && body.turmaId ? body.turmaId : origem.turmaId;
    const disciplinaIdDest =
      typeof body?.disciplinaId === "string" && body.disciplinaId ?
        body.disciplinaId
      : origem.disciplinaId;

    const denied = await guardProfessorTitularTurma(user, schoolId, turmaIdDest);
    if (denied) return denied;

    const hasDisciplina = await prisma.turmaDisciplina.findFirst({
      where: { schoolId, turmaId: turmaIdDest, disciplinaId: disciplinaIdDest },
      select: { id: true },
    });
    if (!hasDisciplina) {
      return NextResponse.json(
        { error: "Disciplina não vinculada à turma de destino." },
        { status: 400 }
      );
    }

    const tituloNovo =
      typeof body?.titulo === "string" && body.titulo.trim() ?
        body.titulo.trim()
      : `${origem.titulo} (cópia)`;

    const dataAvaliacao =
      body?.dataAvaliacao ? new Date(body.dataAvaliacao) : origem.dataAvaliacao;
    if (Number.isNaN(dataAvaliacao.getTime())) {
      return NextResponse.json({ error: "dataAvaliacao inválida." }, { status: 400 });
    }

    const nova = await prisma.avaliacao.create({
      data: {
        schoolId,
        turmaId: turmaIdDest,
        disciplinaId: disciplinaIdDest,
        professorId,
        formato: origem.formato,
        titulo: tituloNovo,
        descricao: origem.descricao,
        peso: origem.peso,
        dataAvaliacao,
        questoes:
          origem.questoes.length > 0 ?
            {
              create: origem.questoes.map((q) => ({
                schoolId,
                ordem: q.ordem,
                enunciado: q.enunciado,
                explicacao: q.explicacao,
                pontos: q.pontos,
                alternativas:
                  q.alternativas.length > 0 ?
                    {
                      create: q.alternativas.map((a) => ({
                        schoolId,
                        ordem: a.ordem,
                        texto: a.texto,
                        correta: a.correta,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      select: { id: true, turmaId: true, titulo: true },
    });

    return NextResponse.json(
      {
        id: nova.id,
        turmaId: nova.turmaId,
        titulo: nova.titulo,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST duplicate avaliacao:", e);
    return NextResponse.json({ error: "Erro ao duplicar avaliação." }, { status: 500 });
  }
}
