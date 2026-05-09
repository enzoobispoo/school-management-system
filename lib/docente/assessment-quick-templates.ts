import type { AiSuggestion } from "@/lib/ai/types";

/** Atalhos pedagógicos reutilizáveis na EduIA docente (sem expor nomes internos). */
export function getDocenteAssessmentTemplateSuggestions(): AiSuggestion[] {
  return [
    {
      label: "Modelo de prova objetiva",
      prompt:
        "Monte para mim o esqueleto de uma prova objetiva (instruções ao aluno, 10 questões com 4 alternativas cada e gabarito comentado em linhas gerais). Eu digo a disciplina e o ano/série em seguida.",
      requiresOpenAi: true,
    },
    {
      label: "Planejamento com BNCC",
      prompt:
        "Quero um planejamento de aula alinhado à BNCC para um tema que vou descrever: objetivos, habilidades sugeridas, sequência em 50 minutos e uma avaliação formativa simples.",
      requiresOpenAi: true,
    },
    {
      label: "Projeto avaliativo curto",
      prompt:
        "Sugira um projeto avaliativo curto (1–2 semanas) integrando duas áreas do conhecimento, com critérios de avaliação claros para eu usar nas minhas turmas titulares.",
      requiresOpenAi: true,
    },
  ];
}
