/** Atalhos contextuais estilo “pill” do assistente docente (workspace real). */
export const DOCENTE_JARVIS_PILLS: Array<{
  label: string;
  prompt: string;
  requiresOpenAi?: boolean;
}> = [
  {
    label: "Avaliações",
    prompt:
      "Quero ajuda para planejar ou registrar uma avaliação nas minhas turmas — quais disciplinas e turmas eu tenho?",
    requiresOpenAi: true,
  },
  {
    label: "Turmas",
    prompt:
      "Quais são minhas turmas como titular, com disciplinas e quantidade de alunos ativos?",
  },
  {
    label: "Avisos",
    prompt: "Quais notificações não lidas eu tenho na escola?",
    requiresOpenAi: true,
  },
  {
    label: "Agenda",
    prompt:
      "Como está minha rotina na escola hoje e quais eventos do calendário posso considerar?",
    requiresOpenAi: true,
  },
  {
    label: "Materiais",
    prompt:
      "Como uso o vault de materiais didáticos no workspace docente?",
    requiresOpenAi: true,
  },
];
