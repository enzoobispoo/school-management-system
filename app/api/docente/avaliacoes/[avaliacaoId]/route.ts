import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { avaliacaoPodeSerEditada } from "@/lib/avaliacoes/avaliacao-edit-policy";
import {
  parseQuestoesInput,
  validateQuestoesParaFormato,
} from "@/lib/avaliacoes/avaliacao-questoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ avaliacaoId: string }>;
}

function tipoQuestaoParaCliente(alternativasLen: number): "OBJETIVA" | "DISSERTATIVA" {
  return alternativasLen === 0 ? "DISSERTATIVA" : "OBJETIVA";
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const { avaliacaoId } = await context.params;

    const avaliacao = await prisma.avaliacao.findFirst({
      where: { id: avaliacaoId, schoolId, professorId },
      include: {
        turma: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
        questoes: {
          include: { alternativas: { orderBy: { ordem: "asc" } } },
          orderBy: { ordem: "asc" },
        },
      },
    });

    if (!avaliacao) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    const denied = await guardProfessorTitularTurma(user, schoolId, avaliacao.turmaId);
    if (denied) return denied;

    const editPolicy = await avaliacaoPodeSerEditada(avaliacaoId);
    const naLixeira = Boolean(avaliacao.deletedAt);

    return NextResponse.json({
      id: avaliacao.id,
      turmaId: avaliacao.turmaId,
      disciplinaId: avaliacao.disciplinaId,
      formato: avaliacao.formato,
      titulo: avaliacao.titulo,
      descricao: avaliacao.descricao,
      peso: avaliacao.peso ? Number(avaliacao.peso) : null,
      dataAvaliacao: avaliacao.dataAvaliacao.toISOString(),
      turma: avaliacao.turma,
      disciplina: avaliacao.disciplina,
      naLixeira,
      deletedAt: avaliacao.deletedAt ? avaliacao.deletedAt.toISOString() : null,
      podeEditar: editPolicy.podeEditar && !naLixeira,
      motivoBloqueioEdicao:
        naLixeira ? "Esta prova está na lixeira." : editPolicy.motivoBloqueio,
      questoes: avaliacao.questoes.map((q) => ({
        id: q.id,
        tipo: tipoQuestaoParaCliente(q.alternativas.length),
        enunciado: q.enunciado,
        explicacao: q.explicacao,
        pontos: q.pontos ? Number(q.pontos) : null,
        alternativas: q.alternativas.map((a) => ({
          texto: a.texto,
          correta: a.correta,
        })),
      })),
    });
  } catch (e) {
    console.error("GET docente avaliacao:", e);
    return NextResponse.json({ error: "Erro ao carregar avaliação." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const { avaliacaoId } = await context.params;

    const existing = await prisma.avaliacao.findFirst({
      where: { id: avaliacaoId, schoolId, professorId },
      select: { turmaId: true, disciplinaId: true, deletedAt: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    const denied = await guardProfessorTitularTurma(user, schoolId, existing.turmaId);
    if (denied) return denied;

    if (existing.deletedAt) {
      return NextResponse.json(
        { error: "Esta prova está na lixeira. Restaure-a para editar." },
        { status: 400 }
      );
    }

    const editPolicy = await avaliacaoPodeSerEditada(avaliacaoId);
    if (!editPolicy.podeEditar) {
      return NextResponse.json(
        { error: editPolicy.motivoBloqueio ?? "Edição não permitida." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const formato = body?.formato === "JOGO" ? "JOGO" : "CLASSICA";
    const titulo = String(body?.titulo || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const peso =
      body?.peso !== undefined && body?.peso !== null ? Number(body.peso) : null;
    const dataAvaliacao = body?.dataAvaliacao ? new Date(body.dataAvaliacao) : null;
    const questoesInput = Array.isArray(body?.questoes) ? body.questoes : [];

    if (!titulo || !dataAvaliacao || Number.isNaN(dataAvaliacao.getTime())) {
      return NextResponse.json(
        { error: "titulo e dataAvaliacao válidos são obrigatórios." },
        { status: 400 }
      );
    }

    const questoes = parseQuestoesInput(questoesInput);
    const questoesErro = validateQuestoesParaFormato(questoes, formato);
    if (questoesErro) {
      return NextResponse.json({ error: questoesErro }, { status: 400 });
    }

    const hasDisciplina = await prisma.turmaDisciplina.findFirst({
      where: {
        schoolId,
        turmaId: existing.turmaId,
        disciplinaId: existing.disciplinaId,
      },
      select: { id: true },
    });
    if (!hasDisciplina) {
      return NextResponse.json(
        { error: "Disciplina não vinculada à turma." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.jogoSessao.deleteMany({ where: { avaliacaoId } });
      await tx.avaliacaoQuestao.deleteMany({ where: { avaliacaoId } });

      await tx.avaliacao.update({
        where: { id: avaliacaoId },
        data: {
          formato,
          titulo,
          descricao,
          peso,
          dataAvaliacao,
          questoes:
            questoes.length > 0 ?
              {
                create: questoes.map((q) => ({
                  schoolId,
                  ordem: q.ordem,
                  enunciado: q.enunciado,
                  explicacao: q.explicacao,
                  pontos: q.pontos,
                  alternativas:
                    q.alternativas.length > 0 ?
                      {
                        create: q.alternativas.map((a, idx) => ({
                          schoolId,
                          ordem: idx + 1,
                          texto: a.texto,
                          correta: a.correta,
                        })),
                      }
                    : undefined,
                })),
              }
            : undefined,
        },
      });
    });

    const atualizada = await prisma.avaliacao.findFirst({
      where: { id: avaliacaoId, schoolId },
      include: {
        questoes: {
          include: { alternativas: { orderBy: { ordem: "asc" } } },
          orderBy: { ordem: "asc" },
        },
      },
    });

    return NextResponse.json({
      id: atualizada?.id,
      titulo: atualizada?.titulo,
      formato: atualizada?.formato,
      questoes: atualizada?.questoes.map((q) => ({
        ...q,
        pontos: q.pontos ? Number(q.pontos) : null,
      })),
    });
  } catch (e) {
    console.error("PATCH docente avaliacao:", e);
    return NextResponse.json({ error: "Erro ao atualizar avaliação." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = await requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const { avaliacaoId } = await context.params;

    const existing = await prisma.avaliacao.findFirst({
      where: { id: avaliacaoId, schoolId, professorId },
      select: { turmaId: true, deletedAt: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    const denied = await guardProfessorTitularTurma(user, schoolId, existing.turmaId);
    if (denied) return denied;

    if (existing.deletedAt) {
      return NextResponse.json({ error: "Esta prova já está na lixeira." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.jogoSessao.deleteMany({ where: { avaliacaoId } }),
      prisma.avaliacao.update({
        where: { id: avaliacaoId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE docente avaliacao (lixeira):", e);
    return NextResponse.json({ error: "Erro ao mover para a lixeira." }, { status: 500 });
  }
}
