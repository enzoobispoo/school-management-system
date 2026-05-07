import type { Prisma } from "@prisma/client";
import type { TipoNotificacao } from "@prisma/client";

/** Tipos que não devem aparecer para professores (financeiro + gestão matrícula/aluno global). */
const PROFESSOR_HIDDEN_TIPOS: TipoNotificacao[] = [
  "PAGAMENTO_CONFIRMADO",
  "PAGAMENTO_ATRASADO",
  "PAGAMENTO",
  "NOVA_MATRICULA",
  "NOVO_ALUNO",
  "MATRICULA_CANCELADA",
];

/**
 * Escopo de notificações por papel: professores não veem financeiro nem pagamentos.
 * Com `destinatarioProfessorId`, o alerta é apenas para aquele professor (ex.: troca de turma).
 * Com `destinatarioUserId`, só esse usuário vê (mensagens do chat); `null` = broadcast no escopo da escola+papel.
 */
export function notificacaoWhereForUser(params: {
  schoolId: string;
  role: string;
  professorId?: string | null;
  userId: string;
}): Prisma.NotificacaoWhereInput {
  const { schoolId, role, professorId, userId } = params;

  const destinatarioUsuario: Prisma.NotificacaoWhereInput = {
    OR: [{ destinatarioUserId: null }, { destinatarioUserId: userId }],
  };

  if (role === "PROFESSOR") {
    return {
      AND: [
        { schoolId },
        destinatarioUsuario,
        { tipo: { notIn: PROFESSOR_HIDDEN_TIPOS } },
        { NOT: { entidadeTipo: "PAGAMENTO" } },
        {
          OR: [
            { destinatarioProfessorId: null },
            ...(professorId ? [{ destinatarioProfessorId: professorId }] : []),
          ],
        },
      ],
    };
  }

  return {
    AND: [{ schoolId }, destinatarioUsuario],
  };
}
