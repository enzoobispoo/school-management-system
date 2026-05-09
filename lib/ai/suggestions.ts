import { AiSuggestion } from "@/lib/ai/types";
import { EDUIA_FULL_BRIEFING_PROMPT } from "@/lib/dashboard/eduia-pulse";
import { getDocenteAssessmentTemplateSuggestions } from "@/lib/docente/assessment-quick-templates";

export function getDefaultSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Total de alunos",
      prompt: "Quantos alunos eu tenho no sistema?",
    },
    {
      label: "Receita do mês",
      prompt: "Quanto foi recebido este mês?",
      hideForSecretariaAcademic: true,
    },
    {
      label: "Pagamentos atrasados",
      prompt: "Quantos pagamentos estão atrasados?",
      hideForSecretariaAcademic: true,
    },
    {
      label: "Próximos eventos",
      prompt: "Quais são os próximos eventos?",
    },
  ];
}

/** Sugestões alinhadas aos módulos atuais (financeiro, turmas, operação, acadêmico). */
export function getEduiaQuickSuggestions(): AiSuggestion[] {
  return [
    ...getDefaultSuggestions(),
    {
      label: "Resumo financeiro",
      prompt: "Mostre um resumo financeiro do mês.",
      hideForSecretariaAcademic: true,
    },
    {
      label: "Matrículas ativas",
      prompt: "Quantas matrículas ativas temos?",
    },
    {
      label: "Turmas e vagas",
      prompt: "Quais turmas estão lotadas e onde ainda há vagas?",
      requiresOpenAi: true,
    },
    {
      label: "Central operacional",
      prompt:
        "Quais incidentes operacionais estão em aberto ou críticos? O que devo priorizar?",
      requiresOpenAi: true,
    },
    {
      label: "Professores",
      prompt: "Liste professores ativos e os cursos em que atuam.",
      requiresOpenAi: true,
    },
    {
      label: "Notificações",
      prompt: "Quantas notificações não lidas temos e quais são as últimas?",
      requiresOpenAi: true,
    },
    {
      label: "Panorama acadêmico",
      prompt:
        "Resumo acadêmico: turmas ativas, avaliações e se há aulas sem presença registrada.",
      requiresOpenAi: true,
    },
    {
      label: "Avaliar operação",
      prompt:
        "Quero rodar a avaliação operacional agora (detectores e incidentes). O que isso faz?",
      requiresOpenAi: true,
      requiresFullPlan: true,
    },
    {
      label: "Boletim do aluno",
      prompt:
        "Mostre o boletim com notas e frequência do aluno João (ajuste o nome se precisar).",
      requiresOpenAi: true,
    },
    {
      label: "Marcar aviso lido",
      prompt:
        "Marque como lidas as notificações que você acabou de listar (use os ids retornados).",
      requiresOpenAi: true,
    },
    {
      label: "Briefing do dia",
      prompt: EDUIA_FULL_BRIEFING_PROMPT,
      requiresOpenAi: true,
      hideForSecretariaAcademic: true,
    },
    {
      label: "O que está crítico?",
      prompt:
        "O que está mais crítico na escola agora entre financeiro, turmas lotadas e incidentes operacionais? Ordene por impacto.",
      requiresOpenAi: true,
      hideForSecretariaAcademic: true,
    },
    {
      label: "Plano da semana",
      prompt:
        "Com base nos dados atuais, sugira um plano de ação para esta semana para reduzir inadimplência e incidentes abertos. Indique em linguagem clara onde acompanhar cobranças e onde ver incidentes operacionais no sistema.",
      requiresOpenAi: true,
      hideForSecretariaAcademic: true,
    },
    {
      label: "Cadastrar aluno",
      prompt:
        "Quero cadastrar um aluno novo com nome completo e dados que eu informar — monte o resumo e peça minha confirmação antes de gravar.",
      requiresOpenAi: true,
    },
    {
      label: "Nova turma",
      prompt:
        "Ajude a criar uma turma nova: vamos usar um curso e professor já existentes, definir nome da turma, capacidade e pelo menos um horário em formato HH:mm (ex.: segunda 09:00 às 10:30). Peça confirmação antes de criar.",
      requiresOpenAi: true,
    },
    {
      label: "Matricular aluno",
      prompt:
        "Preciso matricular um aluno (informando pelo nome) numa turma (informando pelo nome da turma e curso se precisar). Explique que gerará cobranças iniciais e peça confirmação antes de concluir.",
      requiresOpenAi: true,
    },
    {
      label: "Gerar mensalidades",
      prompt: "Gere mensalidades do próximo mês",
      hideForSecretariaAcademic: true,
    },
    {
      label: "Registrar pagamento",
      prompt:
        "Quero registrar pagamento de um aluno; peça nome e forma de pagamento e confirmação antes de dar baixa.",
      hideForSecretariaAcademic: true,
    },
  ];
}

export function getFinanceSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Listar inadimplentes",
      prompt: "Quem está inadimplente?",
      hideForSecretariaAcademic: true,
    },
    {
      label: "Gerar mensalidades",
      prompt: "Gere mensalidades do próximo mês",
      hideForSecretariaAcademic: true,
    },
  ];
}

/** Atalhos da EduIA no hub financeiro (ferramentas restritas no servidor). */
export function getEduiaFinanceQuickSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Resumo financeiro do painel",
      prompt:
        "Use os dados reais e me dê um resumo executivo só de cobrança: recebido no mês, pendências, atrasos e tendência em relação ao mês anterior, citando números.",
      requiresOpenAi: true,
    },
    {
      label: "Pagamentos atrasados",
      prompt: "Liste os pagamentos atrasados mais relevantes e o valor total em risco.",
    },
    {
      label: "Registrar baixa",
      prompt:
        "Quero registrar o pagamento de um aluno; peça nome ou cobrança e confirme valor e método antes de concluir.",
      requiresOpenAi: true,
    },
    {
      label: "Gerar mensalidades",
      prompt: "Explique como gerar mensalidades do próximo mês e o que conferir antes de confirmar.",
      requiresOpenAi: true,
    },
    {
      label: "Notificações de cobrança",
      prompt:
        "Há notificações não lidas que afetem financeiro ou cobrança? Resuma e diga o que abrir primeiro.",
      requiresOpenAi: true,
    },
    {
      label: "Lentidão no sistema",
      prompt:
        "O sistema está lento ou travando no meu Mac. Com base em boas práticas de navegador e front-end, o que posso tentar agora e quando escalar para o administrador?",
      requiresOpenAi: true,
    },
    ...getFinanceSuggestions(),
  ];
}

export function getPostActionSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Ver inadimplentes",
      prompt: "Quem está inadimplente?",
      hideForSecretariaAcademic: true,
    },
    {
      label: "Receita do mês",
      prompt: "Quanto foi recebido este mês?",
      hideForSecretariaAcademic: true,
    },
  ];
}

/** Sugestões do assistente no workspace docente (sem financeiro/gestão global). */
export function getEduiaDocenteQuickSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Panorama das turmas",
      prompt:
        "Monte um panorama das minhas turmas em que sou titular: para cada uma, nome da turma, curso, disciplinas que leciono e quantidade de alunos ativos.",
    },
    {
      label: "Total de alunos (titular)",
      prompt:
        "Quantos alunos ativos eu tenho no total, somando todas as minhas turmas em que sou titular?",
    },
    {
      label: "Minhas turmas hoje",
      prompt:
        "Quais são minhas turmas como titular, com disciplinas e quantidade de alunos?",
    },
    {
      label: "Planejar avaliação",
      prompt:
        "Quero criar uma avaliação nova: use os dados reais da escola para eu escolher turma e disciplina, sugira título e data, e só registre depois que eu confirmar em voz alta.",
      requiresOpenAi: true,
    },
    {
      label: "Gerar apresentação em slides",
      prompt:
        "Quero uma apresentação em slides sobre um tema que vou descrever em seguida. Se precisar, encaixe turma e disciplina pelos meus dados. Mostre primeiro um rascunho com vários slides (capa chamativa e depois tópicos em lista) e só salve no sistema depois que eu disser que confirmo.",
      requiresOpenAi: true,
    },
    {
      label: "Minhas provas recentes",
      prompt:
        "Liste minhas provas e avaliações recentes e sugira qual vale revisar ou repetir o formato em outra turma.",
      requiresOpenAi: true,
    },
    {
      label: "Sugerir aulas da semana",
      prompt:
        "Com base nas minhas aulas registradas e nas turmas titulares, sugira uma sequência de três aulas com objetivo, conteúdo e uma atividade por dia.",
      requiresOpenAi: true,
    },
    {
      label: "Ideias de temas e projetos",
      prompt:
        "Sugira temas interdisciplinares e um projeto avaliativo curto que combine com minhas turmas e disciplinas reais.",
      requiresOpenAi: true,
    },
    {
      label: "Rubrica de correção",
      prompt:
        "Monte uma rubrica de correção clara (critérios e níveis) para uma prova dissertativa na disciplina que eu indicar.",
      requiresOpenAi: true,
    },
    {
      label: "Avisos da escola",
      prompt: "Quais avisos ou notificações ainda não li?",
      requiresOpenAi: true,
    },
    {
      label: "Nova avaliação passo a passo",
      prompt:
        "Explique, passo a passo, como criar uma avaliação nova na área de avaliações do docente e como escolher a disciplina certa da turma.",
      requiresOpenAi: true,
    },
    {
      label: "Modo jogo ao vivo",
      prompt:
        "Como usar o modo jogo ao vivo da prova na sala: PIN para os alunos entrarem e boas práticas para aplicar com a turma.",
      requiresOpenAi: true,
    },
    {
      label: "Quadro para correção",
      prompt:
        "Como usar o quadro online da prova na biblioteca de avaliações para anotar correções e projetar para a turma?",
      requiresOpenAi: true,
    },
    {
      label: "Resumo de uma turma",
      prompt:
        "Resuma a turma que eu escolher pelo nome (pode ser aproximado): curso, disciplinas e matrículas ativas.",
    },
    ...getDocenteAssessmentTemplateSuggestions(),
  ];
}