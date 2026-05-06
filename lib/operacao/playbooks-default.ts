import type { PlaybookDefinitionV1 } from "@/lib/operacao/types";

export interface PlaybookSeedRow {
  code: string;
  name: string;
  definition: PlaybookDefinitionV1;
}

export const DEFAULT_OPERATIONAL_PLAYBOOKS: PlaybookSeedRow[] = [
  {
    code: "fin_overdue_summary",
    name: "Resumo de pagamentos atrasados",
    definition: {
      version: 1,
      detect: { handler: "fin_overdue_summary" },
      actions: [
        {
          type: "notificacao_sistema",
          titulo: "Financeiro: pagamentos em atraso",
          mensagem:
            "O sistema detectou {{count}} pagamento(s) em atraso (total R$ {{totalValor}}). Abra a Central operacional ou o Financeiro para agir.",
          notifyEveryHours: 24,
        },
      ],
    },
  },
  {
    code: "acad_turmas_over_capacity",
    name: "Turmas lotadas",
    definition: {
      version: 1,
      detect: { handler: "acad_turmas_over_capacity" },
      actions: [
        {
          type: "notificacao_sistema",
          titulo: "Acadêmico: turmas no limite de vagas",
          mensagem:
            "{{impactHint}}. Veja detalhes na Central operacional para planejar novas turmas.",
          notifyEveryHours: 48,
        },
      ],
    },
  },
  {
    code: "enroll_active_without_matricula",
    name: "Alunos ativos sem matrícula ativa",
    definition: {
      version: 1,
      detect: { handler: "enroll_active_without_matricula" },
      actions: [
        {
          type: "notificacao_sistema",
          titulo: "Secretaria: inconsistência de matrícula",
          mensagem:
            "{{count}} aluno(s) ativo(s) sem matrícula ATIVA. Central operacional lista nomes e próximos passos.",
          notifyEveryHours: 24,
        },
      ],
    },
  },
  {
    code: "sys_finance_audit_failures",
    name: "Falhas em auditoria financeira (24h)",
    definition: {
      version: 1,
      detect: { handler: "sys_finance_audit_failures" },
      actions: [
        {
          type: "notificacao_sistema",
          titulo: "Sistema: falhas em rotinas financeiras",
          mensagem:
            "Foram registradas falhas na auditoria financeira nas últimas 24h. Revise integrações e crons.",
          notifyEveryHours: 12,
        },
      ],
    },
  },
];
