import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { buildAvaliacaoPdf } from "@/lib/avaliacoes/build-avaliacao-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ avaliacaoId: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const prof = await requireProfessorContext(user);
  if (prof instanceof NextResponse) return prof;
  const { schoolId, professorId } = prof;
  const { avaliacaoId } = await context.params;

  const avaliacao = await prisma.avaliacao.findFirst({
    where: {
      id: avaliacaoId,
      schoolId,
      professorId,
    },
    include: {
      turma: { select: { nome: true } },
      disciplina: { select: { nome: true } },
      school: { select: { nome: true } },
      questoes: {
        orderBy: { ordem: "asc" },
        include: { alternativas: { orderBy: { ordem: "asc" } } },
      },
    },
  });
  if (!avaliacao) {
    return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
  }

  const pdf = await buildAvaliacaoPdf({
    escolaNome: avaliacao.school.nome,
    turmaNome: avaliacao.turma.nome,
    disciplinaNome: avaliacao.disciplina.nome,
    titulo: avaliacao.titulo,
    dataAvaliacao: avaliacao.dataAvaliacao,
    formato: avaliacao.formato,
    questoes: avaliacao.questoes.map((q) => ({
      ordem: q.ordem,
      enunciado: q.enunciado,
      pontos: q.pontos ? Number(q.pontos) : null,
      alternativas: q.alternativas.map((a) => ({ ordem: a.ordem, texto: a.texto })),
    })),
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="avaliacao-${avaliacao.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
