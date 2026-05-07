import { AiSuggestion } from "@/lib/ai/types";
import { EDUIA_FULL_BRIEFING_PROMPT } from "@/lib/dashboard/eduia-pulse";

export function getDefaultSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Total de alunos",
      prompt: "Quantos alunos eu tenho no sistema?",
    },
    {
      label: "Receita do mês",
      prompt: "Quanto foi recebido este mês?",
    },
    {
      label: "Pagamentos atrasados",
      prompt: "Quantos pagamentos estão atrasados?",
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
    },
    {
      label: "Matrículas ativas",
      prompt: "Quantas matrículas ativas temos?",
    },
    {
      label: "Turmas e vagas",
      prompt: "Quais turmas estão lotadas e onde ainda há vagas?",
    },
    {
      label: "Central operacional",
      prompt:
        "Quais incidentes operacionais estão em aberto ou críticos? O que devo priorizar?",
    },
    {
      label: "Professores",
      prompt: "Liste professores ativos e os cursos em que atuam.",
    },
    {
      label: "Notificações",
      prompt: "Quantas notificações não lidas temos e quais são as últimas?",
    },
    {
      label: "Panorama acadêmico",
      prompt:
        "Resumo acadêmico: turmas ativas, avaliações e se há aulas sem presença registrada.",
    },
    {
      label: "Avaliar operação",
      prompt:
        "Quero rodar a avaliação operacional agora (detectores e incidentes). O que isso faz?",
    },
    {
      label: "Boletim do aluno",
      prompt:
        "Mostre o boletim com notas e frequência do aluno João (ajuste o nome se precisar).",
    },
    {
      label: "Marcar aviso lido",
      prompt:
        "Marque como lidas as notificações que você acabou de listar (use os ids retornados).",
    },
    {
      label: "Briefing do dia",
      prompt: EDUIA_FULL_BRIEFING_PROMPT,
    },
    {
      label: "O que está crítico?",
      prompt:
        "O que está mais crítico na escola agora entre financeiro, turmas lotadas e incidentes operacionais? Ordene por impacto.",
    },
    {
      label: "Plano da semana",
      prompt:
        "Com base nos dados atuais, sugira um plano de ação para esta semana para reduzir inadimplência e incidentes abertos. Seja específico com telas (/financeiro, /operacao).",
    },
    {
      label: "Cadastrar aluno",
      prompt:
        "Quero cadastrar um aluno novo com nome completo e dados que eu informar — monte o resumo e peça minha confirmação antes de gravar.",
    },
    {
      label: "Nova turma",
      prompt:
        "Ajude a criar uma turma nova: vamos usar um curso e professor já existentes, definir nome da turma, capacidade e pelo menos um horário em formato HH:mm (ex.: segunda 09:00 às 10:30). Peça confirmação antes de criar.",
    },
    {
      label: "Matricular aluno",
      prompt:
        "Preciso matricular um aluno (informando pelo nome) numa turma (informando pelo nome da turma e curso se precisar). Explique que gerará cobranças iniciais e peça confirmação antes de concluir.",
    },
  ];
}

export function getFinanceSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Listar inadimplentes",
      prompt: "Quem está inadimplente?",
    },
    {
      label: "Gerar mensalidades",
      prompt: "Gere mensalidades do próximo mês",
    },
  ];
}

export function getPostActionSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Ver inadimplentes",
      prompt: "Quem está inadimplente?",
    },
    {
      label: "Receita do mês",
      prompt: "Quanto foi recebido este mês?",
    },
  ];
}

/** Sugestões do assistente no workspace docente (sem financeiro/gestão global). */
export function getEduiaDocenteQuickSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Minhas turmas hoje",
      prompt:
        "Quais são minhas turmas como titular, com disciplinas e quantidade de alunos?",
    },
    {
      label: "Planejar avaliação",
      prompt:
        "Quero criar uma avaliação: ajude a escolher turma e disciplina pelos dados reais e sugira título e data. Depois peça minha confirmação antes de gravar.",
    },
    {
      label: "Minhas provas recentes",
      prompt:
        "Liste minhas provas e avaliações recentes no sistema e sugira qual revisar ou duplicar para uma nova turma.",
    },
    {
      label: "Sugerir aulas da semana",
      prompt:
        "Com base nos meus registros de aula recentes e nas turmas titulares, sugira uma sequência de 3 aulas com objetivos, tópicos e uma atividade por dia.",
    },
    {
      label: "Ideias de temas e projetos",
      prompt:
        "Sugira temas interdisciplinares e um projeto avaliativo curto adequado às minhas turmas e disciplinas (use dados reais do sistema).",
    },
    {
      label: "Rubrica de correção",
      prompt:
        "Monte uma rubrica de correção clara (critérios e níveis) para uma prova dissertativa na disciplina que eu indicar.",
    },
    {
      label: "Avisos da escola",
      prompt: "Quais notificações não lidas eu tenho?",
    },
    {
      label: "Abrir nova avaliação",
      prompt:
        "Explique o que preencher em /docente/avaliacoes/nova e como escolher disciplina da turma.",
    },
    {
      label: "Modo jogo (Kahoot)",
      prompt:
        "Como usar o modo jogo ao vivo da prova, PIN para alunos e dicas para aplicar em sala.",
    },
    {
      label: "Quadro para correção",
      prompt:
        "Como usar o quadro online da prova (ação Quadro na biblioteca de avaliações) para anotar e projetar correções?",
    },
    {
      label: "Resumo de uma turma",
      prompt:
        "Resuma a turma que eu escolher (nome aproximado): curso, disciplinas e matrículas ativas.",
    },
  ];
}