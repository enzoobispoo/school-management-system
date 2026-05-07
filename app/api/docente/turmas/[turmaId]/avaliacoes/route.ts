import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { guardProfessorTitularTurma } from "@/lib/docente/guard-professor-turma";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import {
  parseQuestoesInput,
  validateQuestoesParaFormato,
} from "@/lib/avaliacoes/avaliacao-questoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ turmaId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
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

    const disciplinaId = request.nextUrl.searchParams.get("disciplinaId") || undefined;

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { schoolId, turmaId, disciplinaId, deletedAt: null },
      include: {
        disciplina: { select: { id: true, nome: true } },
        professor: { select: { id: true, nome: true } },
        notas: {
          include: {
            matricula: {
              include: { aluno: { select: { id: true, nome: true } } },
            },
          },
        },
        questoes: {
          include: {
            alternativas: {
              orderBy: { ordem: "asc" },
            },
          },
          orderBy: { ordem: "asc" },
        },
      },
      orderBy: { dataAvaliacao: "desc" },
    });

    return NextResponse.json(
      avaliacoes.map((a) => ({
        ...a,
        peso: a.peso ? Number(a.peso) : null,
        notas: a.notas.map((n) => ({ ...n, nota: Number(n.nota) })),
        questoes: a.questoes.map((q) => ({
          ...q,
          pontos: q.pontos ? Number(q.pontos) : null,
        })),
      }))
    );
  } catch (e) {
    console.error("GET docente avaliacoes:", e);
    return NextResponse.json({ error: "Erro ao listar avaliações." }, { status: 500 });
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
    const disciplinaId = String(body?.disciplinaId || "");
    const formato = body?.formato === "JOGO" ? "JOGO" : "CLASSICA";
    const titulo = String(body?.titulo || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const peso =
      body?.peso !== undefined && body?.peso !== null ? Number(body.peso) : null;
    const dataAvaliacao = body?.dataAvaliacao ? new Date(body.dataAvaliacao) : null;
    const questoesInput = Array.isArray(body?.questoes) ? body.questoes : [];
    const aiReviewScore = body?.aiReviewScore !== undefined ? Number(body.aiReviewScore) : null;

    if (!disciplinaId || !titulo || !dataAvaliacao || Number.isNaN(dataAvaliacao.getTime())) {
      return NextResponse.json(
        {
          error:
            "disciplinaId, titulo e dataAvaliacao válidos são obrigatórios.",
        },
        { status: 400 }
      );
    }
    const questoes = parseQuestoesInput(questoesInput);
    const questoesErro = validateQuestoesParaFormato(questoes, formato);
    if (questoesErro) {
      return NextResponse.json({ error: questoesErro }, { status: 400 });
    }

    const hasDisciplina = await prisma.turmaDisciplina.findFirst({
      where: { schoolId, turmaId, disciplinaId },
      select: { id: true },
    });
    if (!hasDisciplina) {
      return NextResponse.json(
        { error: "Disciplina não vinculada à turma." },
        { status: 400 }
      );
    }

    const schoolSettings = await prisma.escolaSettings.findUnique({
      where: { schoolId },
      select: { aiEvalReviewEnforced: true, aiEvalReviewMinScore: true },
    });
    if (schoolSettings?.aiEvalReviewEnforced) {
      if (aiReviewScore === null || Number.isNaN(aiReviewScore)) {
        return NextResponse.json(
          { error: "Esta escola exige revisão IA antes de criar avaliação." },
          { status: 400 }
        );
      }
      if (aiReviewScore < schoolSettings.aiEvalReviewMinScore) {
        return NextResponse.json(
          {
            error: `Qualidade mínima não atingida (${Math.floor(aiReviewScore)}/${schoolSettings.aiEvalReviewMinScore}). Ajuste a prova e revise novamente com IA.`,
          },
          { status: 400 }
        );
      }
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        schoolId,
        turmaId,
        disciplinaId,
        professorId,
        formato,
        titulo,
        descricao,
        peso,
        dataAvaliacao,
        questoes: questoes.length > 0 ? {
          create: questoes.map((q: {
            ordem: number;
            enunciado: string;
            explicacao: string | null;
            pontos: number | null;
            alternativas: { texto: string; correta: boolean }[];
          }) => ({
            schoolId,
            ordem: q.ordem,
            enunciado: q.enunciado,
            explicacao: q.explicacao,
            pontos: q.pontos,
            alternativas: q.alternativas.length > 0 ? {
              create: q.alternativas.map((a: { texto: string; correta: boolean }, idx: number) => ({
                schoolId,
                ordem: idx + 1,
                texto: a.texto,
                correta: a.correta,
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        questoes: {
          include: { alternativas: { orderBy: { ordem: "asc" } } },
          orderBy: { ordem: "asc" },
        },
      },
    });

    return NextResponse.json(
      {
        ...avaliacao,
        peso: avaliacao.peso ? Number(avaliacao.peso) : null,
        questoes: avaliacao.questoes.map((q) => ({
          ...q,
          pontos: q.pontos ? Number(q.pontos) : null,
        })),
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST docente avaliacoes:", e);
    return NextResponse.json({ error: "Erro ao criar avaliação." }, { status: 500 });
  }
}
