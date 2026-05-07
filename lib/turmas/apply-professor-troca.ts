import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

export async function applyProfessorTrocaInTransaction(
  tx: Tx,
  params: {
    schoolId: string;
    turmaId: string;
    professorAnteriorId: string | null;
    novoProfessorId: string;
    novoProfessorNome: string;
    turmaNome: string;
    inicio: Date;
    motivoTroca?: string | null;
    observacoes?: string | null;
    /** Notificação após troca efetivada (broadcast escola) */
    criarNotificacaoAlteracao?: boolean;
  }
) {
  const {
    turmaId,
    professorAnteriorId,
    novoProfessorId,
    novoProfessorNome,
    turmaNome,
    schoolId,
    inicio,
    motivoTroca,
    observacoes,
    criarNotificacaoAlteracao = true,
  } = params;

  if (professorAnteriorId) {
    await tx.turmaProfessorHistorico.updateMany({
      where: {
        turmaId,
        professorId: professorAnteriorId,
        dataFim: null,
      },
      data: {
        dataFim: inicio,
      },
    });
  }

  await tx.turmaProfessorHistorico.create({
    data: {
      turmaId,
      professorId: novoProfessorId,
      dataInicio: inicio,
      dataFim: null,
      motivoTroca: motivoTroca || null,
      observacoes: observacoes || null,
    },
  });

  await tx.turma.update({
    where: { id: turmaId },
    data: {
      professorId: novoProfessorId,
    },
  });

  if (criarNotificacaoAlteracao) {
    await tx.notificacao.create({
      data: {
        schoolId,
        tipo: "SISTEMA",
        titulo: "Professor alterado na turma",
        mensagem: `A turma ${turmaNome} agora está vinculada ao professor ${novoProfessorNome}.`,
        entidadeTipo: "TURMA",
        entidadeId: turmaId,
        destinatarioProfessorId: null,
      },
    });
  }
}

export async function applyProfessorTroca(
  params: Parameters<typeof applyProfessorTrocaInTransaction>[1]
) {
  return prisma.$transaction((tx) => applyProfessorTrocaInTransaction(tx, params));
}
