import type { EntidadeNotificacao } from "@prisma/client";

/**
 * Destino na área logada para uma notificação com contexto de entidade.
 * Matrículas são resolvidas para o perfil do aluno via `matriculaIdToAlunoId`.
 */
export function notificationLinkHref(
  entidadeTipo: EntidadeNotificacao,
  entidadeId: string | null,
  matriculaIdToAlunoId?: Map<string, string>
): string | null {
  if (!entidadeId) return null;

  switch (entidadeTipo) {
    case "ALUNO":
      return `/alunos/${entidadeId}`;
    case "TURMA":
      return `/turmas/${entidadeId}`;
    case "PROFESSOR":
      return `/professores/${entidadeId}`;
    case "PAGAMENTO":
      return `/financeiro?paymentId=${encodeURIComponent(entidadeId)}`;
    case "MATRICULA": {
      const alunoId = matriculaIdToAlunoId?.get(entidadeId);
      return alunoId ? `/alunos/${alunoId}` : null;
    }
    case "CURSO":
      return `/cursos/${entidadeId}`;
    case "SISTEMA":
      return null;
    case "CHAT_THREAD":
      return `/mensagens?thread=${encodeURIComponent(entidadeId)}`;
  }
}
