/**
 * Texto curto para quem envia convites: o que o perfil enxerga e faz no produto.
 * (Não descreve permissões técnicas de API — só a experiência no painel.)
 */
export const INVITE_ROLE_GUIDE: Record<
  string,
  { headline: string; body: string }
> = {
  ADMIN: {
    headline: "Administrador da escola",
    body:
      "Acesso amplo à gestão: configurações da escola, convites da equipe, visão executiva com indicadores financeiros e atalhos de operação (incluindo ações de cobrança quando existirem no painel).",
  },
  FINANCEIRO: {
    headline: "Financeiro",
    body:
      "Acesso concentrado em /financeiro: cobranças, mensalidades, boletos e relatórios de receita — sem dashboard executivo da escola, sem EduIA global e sem telas acadêmicas (alunos, turmas e operação ficam com outros perfis).",
  },
  SECRETARIA: {
    headline: "Secretaria (acadêmica)",
    body:
      "Matrículas, alunos, turmas, calendário e comunicação. O painel prioriza a operação pedagógica: sem gráficos de receita e sem atalhos de cobrança em massa; a EduIA não sugere consultas financeiras agregadas.",
  },
  SECRETARIA_FINANCEIRA: {
    headline: "Secretaria (com financeiro no painel)",
    body:
      "Mesma rotina acadêmica da secretaria, com indicadores de receita e pendências no painel para acompanhar inadimplência. Ações sensíveis (como certos lançamentos) podem continuar restritas ao financeiro; o atalho de “cobrar em massa” do insight executivo não abre daqui.",
  },
  PROFESSOR: {
    headline: "Professor",
    body:
      "Workspace do docente: turmas em que é titular, chamadas, avaliações, materiais e EduIA no contexto de sala — sem a visão financeira global da escola.",
  },
};
