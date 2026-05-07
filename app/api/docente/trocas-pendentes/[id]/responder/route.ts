import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TROCA_PRISMA_STALE_MESSAGE,
  TrocaPrismaStaleError,
  trocaProfessorPropostaDelegate,
} from "@/lib/prisma/troca-professor-proposta";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { applyProfessorTrocaInTransaction } from "@/lib/turmas/apply-professor-troca";
import { mensagemConflitoHorarioProfessor } from "@/lib/turmas/professor-horario-conflito";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const ctx = requireProfessorContext(user);
    if (ctx instanceof NextResponse) return ctx;
    const { schoolId, professorId } = ctx;

    const trocaTx = trocaProfessorPropostaDelegate(prisma);
    if (!trocaTx) {
      return NextResponse.json({ error: TROCA_PRISMA_STALE_MESSAGE }, { status: 503 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      aceitar?: boolean;
    };
    const aceitar = body.aceitar === true;

    const proposta = await trocaTx.findFirst({
      where: {
        id,
        schoolId,
        professorAlvoId: professorId,
        status: "PENDENTE",
      },
      include: {
        turma: {
          include: {
            horarios: true,
            curso: { select: { nome: true } },
          },
        },
      },
    });

    if (!proposta) {
      return NextResponse.json(
        { error: "Solicitação não encontrada ou já respondida." },
        { status: 404 }
      );
    }

    if (proposta.turma.professorId !== proposta.professorAnteriorId) {
      await trocaTx.update({
        where: { id },
        data: { status: "CANCELADA", respondidoEm: new Date() },
      });
      return NextResponse.json(
        {
          error:
            "Esta turma já teve o titular alterado. A solicitação foi encerrada.",
        },
        { status: 409 }
      );
    }

    if (!aceitar) {
      await trocaTx.update({
        where: { id },
        data: { status: "RECUSADA", respondidoEm: new Date() },
      });
      return NextResponse.json({
        success: true,
        message: "Você recusou esta solicitação.",
      });
    }

    const outrasTurmas = await prisma.turma.findMany({
      where: {
        schoolId,
        professorId,
        ativo: true,
        id: { not: proposta.turmaId },
      },
      include: {
        curso: { select: { nome: true } },
        horarios: true,
      },
    });

    const conflito = mensagemConflitoHorarioProfessor(
      proposta.turma.horarios,
      outrasTurmas
    );
    if (conflito) {
      return NextResponse.json({ error: conflito }, { status: 400 });
    }

    const novoProf = await prisma.professor.findFirst({
      where: { id: professorId, schoolId },
      select: { nome: true },
    });
    if (!novoProf) {
      return NextResponse.json(
        { error: "Professor não encontrado." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await applyProfessorTrocaInTransaction(tx, {
        schoolId,
        turmaId: proposta.turmaId,
        professorAnteriorId: proposta.professorAnteriorId,
        novoProfessorId: professorId,
        novoProfessorNome: novoProf.nome,
        turmaNome: proposta.turma.nome,
        inicio: proposta.dataInicioPrevista,
        motivoTroca: proposta.motivoTroca,
        observacoes: proposta.observacoes,
        criarNotificacaoAlteracao: true,
      });

      const innerTroca = trocaProfessorPropostaDelegate(tx as unknown as typeof prisma);
      if (!innerTroca) throw new TrocaPrismaStaleError();
      await innerTroca.update({
        where: { id },
        data: { status: "ACEITA", respondidoEm: new Date() },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Troca confirmada. Você já aparece como titular da turma.",
    });
  } catch (e) {
    console.error("POST docente/trocas-pendentes/responder:", e);
    if (e instanceof TrocaPrismaStaleError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Não foi possível registrar a resposta." },
      { status: 500 }
    );
  }
}
