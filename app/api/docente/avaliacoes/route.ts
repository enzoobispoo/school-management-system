import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireProfessorContext } from "@/lib/docente/require-professor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const lixeira = request.nextUrl.searchParams.get("lixeira") === "1";

    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        schoolId,
        professorId,
        deletedAt: lixeira ? { not: null } : null,
        OR:
          query.length >= 2
            ? [
                { titulo: { contains: query, mode: "insensitive" } },
                { descricao: { contains: query, mode: "insensitive" } },
                {
                  questoes: {
                    some: { enunciado: { contains: query, mode: "insensitive" } },
                  },
                },
                {
                  notas: {
                    some: {
                      matricula: {
                        aluno: { nome: { contains: query, mode: "insensitive" } },
                      },
                    },
                  },
                },
              ]
            : undefined,
      },
      include: {
        turma: { select: { id: true, nome: true } },
        disciplina: { select: { id: true, nome: true } },
        questoes: {
          orderBy: { ordem: "asc" },
          select: { id: true, enunciado: true, alternativas: { select: { id: true } } },
        },
        notas: {
          select: {
            id: true,
            matricula: { select: { aluno: { select: { nome: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    });

    const ids = avaliacoes.map((a) => a.id);
    const [avaliacoesComNota, avaliacoesComJogo] =
      ids.length === 0 ?
        [[], []]
      : await Promise.all([
          prisma.notaAvaliacao.findMany({
            where: { avaliacaoId: { in: ids } },
            select: { avaliacaoId: true },
            distinct: ["avaliacaoId"],
          }),
          prisma.jogoSessao.findMany({
            where: {
              avaliacaoId: { in: ids },
              participants: { some: {} },
            },
            select: { avaliacaoId: true },
            distinct: ["avaliacaoId"],
          }),
        ]);

    const comNota = new Set(avaliacoesComNota.map((x) => x.avaliacaoId));
    const comJogo = new Set(avaliacoesComJogo.map((x) => x.avaliacaoId));

    return NextResponse.json(
      avaliacoes.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        formato: a.formato,
        dataAvaliacao: a.dataAvaliacao,
        createdAt: a.createdAt,
        turma: a.turma,
        disciplina: a.disciplina,
        questoesCount: a.questoes.length,
        questoesObjetivasCount: a.questoes.filter((q) => q.alternativas.length > 0).length,
        questaoPreview: a.questoes[0]?.enunciado ?? null,
        alunosComNotaCount: a.notas.length,
        alunosPreview: [...new Set(a.notas.map((n) => n.matricula.aluno.nome))].slice(0, 3),
        naLixeira: Boolean(a.deletedAt),
        deletedAt: a.deletedAt ? a.deletedAt.toISOString() : null,
        podeEditar:
          !a.deletedAt && !comNota.has(a.id) && !comJogo.has(a.id),
      }))
    );
  } catch (e) {
    console.error("GET docente avaliacoes list:", e);
    return NextResponse.json(
      { error: "Erro ao listar provas da docente." },
      { status: 500 }
    );
  }
}
