import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { labelDiaSemana } from "@/lib/docente/dia-semana";
import { applyProfessorTrocaInTransaction } from "@/lib/turmas/apply-professor-troca";
import { mensagemConflitoHorarioProfessor } from "@/lib/turmas/professor-horario-conflito";
import {
  TROCA_PRISMA_STALE_MESSAGE,
  TrocaPrismaStaleError,
  trocaProfessorPropostaDelegate,
} from "@/lib/prisma/troca-professor-proposta";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const ROLES_DESCOBERTOS = new Set(["ADMIN", "SECRETARIA", "SUPER_ADMIN"]);

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const { id: turmaId } = await params;
    const body = await request.json();

    const {
      professorId: novoProfessorId,
      motivoTroca,
      observacoes,
      dataInicio,
      aplicarImediato,
    } = body;

    if (!novoProfessorId) {
      return NextResponse.json(
        { error: "Novo professor é obrigatório." },
        { status: 400 }
      );
    }

    if (!dataInicio) {
      return NextResponse.json(
        { error: "Data de início é obrigatória." },
        { status: 400 }
      );
    }

    const inicio = new Date(dataInicio);

    if (Number.isNaN(inicio.getTime())) {
      return NextResponse.json(
        { error: "Data de início inválida." },
        { status: 400 }
      );
    }

    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const turma = await prisma.turma.findFirst({
      where: { id: turmaId, schoolId },
      include: {
        horarios: true,
        curso: { select: { nome: true } },
        professor: { select: { id: true, nome: true } },
      },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Turma não encontrada." },
        { status: 404 }
      );
    }

    if (!turma.horarios.length) {
      return NextResponse.json(
        { error: "A turma não possui horários cadastrados." },
        { status: 400 }
      );
    }

    if (turma.professorId === novoProfessorId) {
      return NextResponse.json(
        { error: "Selecione um professor diferente do atual." },
        { status: 400 }
      );
    }

    const novoProfessor = await prisma.professor.findFirst({
      where: { id: novoProfessorId, schoolId },
      select: {
        id: true,
        nome: true,
        ativo: true,
      },
    });

    if (!novoProfessor) {
      return NextResponse.json(
        { error: "Professor não encontrado." },
        { status: 404 }
      );
    }

    if (!novoProfessor.ativo) {
      return NextResponse.json(
        { error: "O professor selecionado está inativo." },
        { status: 400 }
      );
    }

    const outrasTurmasDoProfessor = await prisma.turma.findMany({
      where: {
        schoolId,
        professorId: novoProfessorId,
        ativo: true,
        id: { not: turmaId },
      },
      include: {
        curso: { select: { nome: true } },
        horarios: true,
      },
    });

    const msgConflito = mensagemConflitoHorarioProfessor(
      turma.horarios,
      outrasTurmasDoProfessor
    );
    if (msgConflito) {
      return NextResponse.json({ error: msgConflito }, { status: 400 });
    }

    const alvoTemContaProfessor = await prisma.user.findFirst({
      where: {
        professorId: novoProfessorId,
        role: "PROFESSOR",
        ativo: true,
      },
      select: { id: true },
    });

    const forcarImediato =
      aplicarImediato === true &&
      user.role &&
      ROLES_DESCOBERTOS.has(user.role);

    if (alvoTemContaProfessor && !forcarImediato) {
      const trocaTx = trocaProfessorPropostaDelegate(prisma);
      if (!trocaTx) {
        return NextResponse.json({ error: TROCA_PRISMA_STALE_MESSAGE }, { status: 503 });
      }

      await trocaTx.updateMany({
        where: {
          turmaId,
          professorAlvoId: novoProfessorId,
          status: "PENDENTE",
        },
        data: { status: "CANCELADA" },
      });

      const resumoHorarios = turma.horarios
        .map(
          (h) =>
            `${labelDiaSemana(h.diaSemana)} ${h.horaInicio}–${h.horaFim}`
        )
        .join(" · ");

      const resumoTurma = `${turma.nome} — ${turma.curso.nome}`;
      const anteriorNome = turma.professor?.nome ?? "Titular atual";

      const proposta = await prisma.$transaction(async (tx) => {
        const innerTroca = trocaProfessorPropostaDelegate(tx as unknown as typeof prisma);
        if (!innerTroca) throw new TrocaPrismaStaleError();

        const p = await innerTroca.create({
          data: {
            schoolId,
            turmaId,
            professorAnteriorId: turma.professorId,
            professorAlvoId: novoProfessorId,
            motivoTroca: motivoTroca ? String(motivoTroca) : null,
            observacoes: observacoes ? String(observacoes) : null,
            dataInicioPrevista: inicio,
            resumoTurma,
            resumoHorarios,
            status: "PENDENTE",
          },
        });

        const linhas = [
          `Turma: ${resumoTurma}`,
          `Horários: ${resumoHorarios}`,
          `Titular atual: ${anteriorNome}`,
          `Início previsto: ${inicio.toLocaleDateString("pt-BR")}`,
          motivoTroca ? `Motivo informado pela escola: ${String(motivoTroca)}` : null,
          observacoes ? `Observações: ${String(observacoes)}` : null,
          "",
          "Abra as solicitações em /docente/trocas para aceitar ou recusar.",
        ].filter(Boolean);

        await tx.notificacao.create({
          data: {
            schoolId,
            tipo: "TROCA_PROFESSOR_SOLICITADA",
            titulo: "Nova solicitação para assumir uma turma",
            mensagem: linhas.join("\n").slice(0, 2000),
            entidadeTipo: "SISTEMA",
            entidadeId: p.id,
            destinatarioProfessorId: novoProfessorId,
          },
        });

        return p;
      });

      return NextResponse.json({
        success: true,
        pendenteConfirmacao: true,
        propostaId: proposta.id,
        message:
          "Solicitação enviada ao professor. A troca só será aplicada após a confirmação no painel do docente.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await applyProfessorTrocaInTransaction(tx, {
        schoolId,
        turmaId,
        professorAnteriorId: turma.professorId,
        novoProfessorId,
        novoProfessorNome: novoProfessor.nome,
        turmaNome: turma.nome,
        inicio,
        motivoTroca,
        observacoes,
        criarNotificacaoAlteracao: true,
      });
    });

    return NextResponse.json({
      success: true,
      pendenteConfirmacao: false,
      message: "Professor alterado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao trocar professor:", error);

    if (error instanceof TrocaPrismaStaleError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: "Erro interno ao trocar professor." },
      { status: 500 }
    );
  }
}
