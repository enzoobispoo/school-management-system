/** Ferramentas expostas à EduIA no workspace do professor (sem gestão/financeiro). */
export const aiDocenteToolDefinitions = [
  {
    type: "function",
    name: "query_docente_turmas",
    description:
      "Lista turmas em que o professor é titular, com disciplinas vinculadas e número de matrículas ativas. Use para responder sobre horários, turmas do dia, disciplinas e planejamento.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Filtra pelo nome da turma (parcial, opcional).",
        },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "query_notifications",
    description:
      "Últimas notificações da escola para o usuário (avisos institucionais). Por padrão retorna não lidas.",
    parameters: {
      type: "object",
      properties: {
        unreadOnly: { type: "boolean" },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "create_docente_avaliacao",
    description:
      "Cria uma avaliação (prova/atividade) em uma turma do professor titular. Exige disciplina já vinculada à turma. Na primeira chamada use confirmed:false para pedir confirmação; só use confirmed:true depois que o professor aceitar explicitamente (frase sugerida na resposta da tool).",
    parameters: {
      type: "object",
      properties: {
        turmaId: { type: "string" },
        disciplinaId: { type: "string" },
        titulo: { type: "string" },
        descricao: { type: "string" },
        peso: { type: "number" },
        dataAvaliacao: {
          type: "string",
          description: "Data da avaliação em ISO 8601 (ex.: 2026-05-20).",
        },
        confirmed: {
          type: "boolean",
          description:
            "false para pré-visualização; true somente após confirmação explícita do professor.",
        },
      },
      required: ["turmaId", "disciplinaId", "titulo", "dataAvaliacao"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "query_docente_avaliacoes_recentes",
    description:
      "Lista provas/avaliações recentes do professor (ativas, não na lixeira), com turma, disciplina e contagem de questões e notas. Use para revisar o que já foi criado ou contextualizar sugestões.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number" },
        searchTitulo: {
          type: "string",
          description: "Filtra pelo título (parcial, opcional).",
        },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "query_docente_diario_recente",
    description:
      "Últimos registros de aula (diário) nas turmas em que o professor é titular — datas, títulos e disciplinas. Use para sugerir continuidade didática, revisão e próximos temas.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
];
