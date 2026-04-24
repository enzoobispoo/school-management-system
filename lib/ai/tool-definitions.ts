export const aiToolDefinitions = [
    {
      type: "function",
      name: "query_students",
      description:
        "Busca alunos por nome, curso ou situação financeira. Use para perguntas sobre alunos, inadimplência e filtros de alunos.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          courseName: { type: "string" },
          paymentStatus: {
            type: "string",
            enum: ["paid", "pending", "overdue"],
          },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "query_courses",
      description:
        "Busca cursos por nome, categoria, status e ordenação por alunos.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          category: { type: "string" },
          active: { type: "boolean" },
          sortBy: {
            type: "string",
            enum: ["students_desc", "students_asc", "name_asc"],
          },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "query_teachers",
      description:
        "Busca professores por nome, curso e status. Retorna cursos, turmas e quantidade de alunos.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          courseName: { type: "string" },
          active: { type: "boolean" },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "query_payments",
      description:
        "Busca pagamentos por status, aluno, curso e texto livre.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          status: {
            type: "string",
            enum: ["PAGO", "PENDENTE", "ATRASADO", "CANCELADO"],
          },
          studentName: { type: "string" },
          courseName: { type: "string" },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "query_dashboard",
      description:
        "Retorna métricas gerais do dashboard: total de alunos, matrícula ativa, receita do mês, pendências e top cursos.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "register_payment",
      description:
        "Registra pagamento de um aluno. Só usar quando o usuário pedir para registrar ou confirmar um pagamento.",
      parameters: {
        type: "object",
        properties: {
          studentName: { type: "string" },
          paymentMethod: { type: "string" },
          confirmed: { type: "boolean" },
        },
        required: ["studentName"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "generate_monthly_payments",
      description:
        "Gera mensalidades do próximo ciclo. Só usar quando o usuário pedir explicitamente.",
      parameters: {
        type: "object",
        properties: {
          confirmed: { type: "boolean" },
        },
        additionalProperties: false,
      },
    },
  ] as const;