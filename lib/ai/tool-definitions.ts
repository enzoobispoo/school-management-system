export const aiToolDefinitions = [
    {
      type: "function",
      name: "query_students",
      description:
        "Busca alunos por nome, curso ou situação financeira (pagamentos). Cobre cadastro, inadimplência e vínculo com turmas/matrículas quando disponível nos dados retornados.",
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
        "Panorama executivo da escola para diagnosticar situação tipo pulse e propor soluções: totais de alunos/matrículas ativas; receita efetiva do mês (pagamentos PAGO), receita do mês anterior e variação percentual; valores e quantidades de pendências e atrasos; ocupação de turmas ativas (quantas lotadas vs com vagas e total de vagas disponíveis) com exemplos de turmas lotadas; top cursos por alunos; incidentes operacionais em aberto/críticos; snapshotGeradoEm (ISO) marca quando o snapshot foi montado — dados podem estar em cache curto (~60s). Use este snapshot antes de dar recomendações estratégicas — sempre amarradas a esses números e combinando outras tools quando precisar de detalhe.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "query_classes",
      description:
        "Lista turmas com ocupação (matrículas ATIVAS), capacidade, vagas estimadas e flag de lotada. Use para vagas, turmas lotadas, distribuição por curso.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string" },
          active: { type: "boolean" },
          overCapacityOnly: { type: "boolean" },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "query_operational_incidents",
      description:
        "Lista incidentes da Central operacional (alertas automáticos de financeiro, acadêmico, matrícula ou sistema). Por padrão retorna só incidentes em aberto ou em tratativa.",
      parameters: {
        type: "object",
        properties: {
          onlyOpen: { type: "boolean" },
          severity: {
            type: "string",
            enum: ["INFO", "WARNING", "CRITICAL"],
          },
          category: {
            type: "string",
            enum: ["FINANCE", "ACADEMIC", "ENROLLMENT", "SYSTEM"],
          },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "mark_notification_read",
      description:
        "Marca uma notificação específica como lida (pelo id retornado em query_notifications).",
      parameters: {
        type: "object",
        properties: {
          notificationId: { type: "string" },
        },
        required: ["notificationId"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "query_student_report",
      description:
        "Boletim somente leitura: notas por avaliação/disciplina, média por disciplina e frequência registrada (quando houver chamadas). Use studentName (nome parcial) ou matriculaId. Se houver várias matrículas, a tool devolve opções — peça qual turma ou chame de novo com matriculaId.",
      parameters: {
        type: "object",
        properties: {
          studentName: { type: "string" },
          matriculaId: { type: "string" },
          turmaSearch: { type: "string" },
          activeOnly: { type: "boolean" },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "query_notifications",
      description:
        "Consulta notificações da escola (centro de avisos). Por padrão lista não lidas e informa total de não lidas.",
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
      name: "query_academic_overview",
      description:
        "Panorama acadêmico operacional: turmas ativas, disciplinas, avaliações recentes, aulas sem presença registrada (últimos 14 dias), notas lançadas. Não substitui boletim completo.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "manage_operational_incident",
      description:
        "Atualiza estado de incidente da Central operacional: acknowledge (em tratativa) ou resolve (resolvido). Sempre chame primeiro com confirmed:false para pedir confirmação explícita ao usuário; só use confirmed:true depois que ele concordar com segurança. Não implementa dispensa (apenas administradores na UI).",
      parameters: {
        type: "object",
        properties: {
          incidentId: { type: "string" },
          action: {
            type: "string",
            enum: ["acknowledge", "resolve"],
          },
          confirmed: { type: "boolean" },
        },
        required: ["incidentId", "action"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "run_operational_evaluation",
      description:
        "Disponível apenas no plano Full: executa os detectores operacionais da escola (como 'Avaliar agora' na Central operacional), podendo criar ou atualizar incidentes e disparar notificações conforme playbooks. Exige confirmação em duas etapas (confirmed:false depois confirmed:true). Em planos Basic ou Starter, oriente o usuário a usar /operacao manualmente.",
      parameters: {
        type: "object",
        properties: {
          confirmed: { type: "boolean" },
        },
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
    {
      type: "function",
      name: "create_student",
      description:
        "Cadastra novo aluno na escola (nome obrigatório; demais campos opcionais seguem validação da API). Duas etapas: primeiro sem confirmed ou confirmed:false para pré-visualização; só depois confirmed:true com aceitação explícita do usuário.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          email: { type: "string" },
          cpf: { type: "string" },
          telefone: { type: "string" },
          dataNascimento: { type: "string" },
          endereco: { type: "string" },
          responsavelNome: { type: "string" },
          responsavelTelefone: { type: "string" },
          responsavelEmail: { type: "string" },
          responsavelCpf: { type: "string" },
          observacoesGerais: { type: "string" },
          confirmed: { type: "boolean" },
        },
        required: ["nome"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "create_course",
      description:
        "Cria curso com valor mensal e categoria. Duas etapas com confirmação explícita antes de confirmed:true.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          categoria: { type: "string" },
          descricao: { type: "string" },
          duracaoTexto: { type: "string" },
          valorMensal: { type: "number" },
          ativo: { type: "boolean" },
          confirmed: { type: "boolean" },
        },
        required: ["nome", "categoria", "valorMensal"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "create_professor",
      description:
        "Cadastra professor (nome obrigatório). Duas etapas com confirmação antes de confirmed:true.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          email: { type: "string" },
          telefone: { type: "string" },
          ativo: { type: "boolean" },
          confirmed: { type: "boolean" },
        },
        required: ["nome"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "create_class",
      description:
        "Cria turma vinculada a curso e professor. Informe cursoId OU cursoSearch; professorId OU professorSearch. horarios: lista com pelo menos um item — diaSemana em SEGUNDA|TERCA|QUARTA|QUINTA|SEXTA|SABADO|DOMINGO e horas HH:mm (ex.: 09:00). Duas etapas com confirmação antes de confirmed:true.",
      parameters: {
        type: "object",
        properties: {
          cursoId: { type: "string" },
          cursoSearch: { type: "string" },
          professorId: { type: "string" },
          professorSearch: { type: "string" },
          nomeTurma: { type: "string" },
          capacidadeMaxima: { type: "number" },
          ativo: { type: "boolean" },
          horarios: {
            type: "array",
            items: {
              type: "object",
              properties: {
                diaSemana: {
                  type: "string",
                  enum: [
                    "SEGUNDA",
                    "TERCA",
                    "QUARTA",
                    "QUINTA",
                    "SEXTA",
                    "SABADO",
                    "DOMINGO",
                  ],
                },
                horaInicio: { type: "string" },
                horaFim: { type: "string" },
              },
              required: ["diaSemana", "horaInicio", "horaFim"],
              additionalProperties: false,
            },
          },
          confirmed: { type: "boolean" },
        },
        required: ["nomeTurma", "capacidadeMaxima", "horarios"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "create_enrollment",
      description:
        "Matricula aluno em turma ativa com vagas (gera parcelas iniciais como o fluxo manual). Use alunoId OU studentSearch; turmaId OU turmaSearch; opcional cursoSearch/cursoId para desambiguar turmas. Duas etapas com confirmação antes de confirmed:true.",
      parameters: {
        type: "object",
        properties: {
          alunoId: { type: "string" },
          studentSearch: { type: "string" },
          turmaId: { type: "string" },
          turmaSearch: { type: "string" },
          cursoId: { type: "string" },
          cursoSearch: { type: "string" },
          dataMatricula: { type: "string" },
          observacoes: { type: "string" },
          confirmed: { type: "boolean" },
        },
        additionalProperties: false,
      },
    },
  ] as const;