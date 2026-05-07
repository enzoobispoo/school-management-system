"use client";

import { AiSuggestionCard } from "@/components/dashboard/ai/ai-suggestion-card";
import { EDUIA_FULL_BRIEFING_PROMPT } from "@/lib/dashboard/eduia-pulse";

import { getEduiaDocenteQuickSuggestions } from "@/lib/ai/suggestions";
import type { AiSuggestionJarvisAccent } from "@/components/dashboard/ai/ai-suggestion-card";

interface AiQuickPromptsProps {
  onSelect: (prompt: string) => void;
  /** Atalhos do workspace docente (sem financeiro global). */
  preset?: "executive" | "professor";
  /** Cards grandes e cores suaves (painel docente estilo assistente). */
  presentation?: "list" | "jarvis";
}

const quickPrompts = [
  {
    prompt: EDUIA_FULL_BRIEFING_PROMPT,
  },
  {
    prompt: "Quantos alunos eu tenho no sistema?",
  },
  {
    prompt: "Quanto foi recebido este mês?",
  },
  {
    prompt: "Quem está inadimplente?",
  },
  {
    prompt: "Quais são os próximos eventos?",
  },
  {
    prompt: "Quais pagamentos estão atrasados?",
  },
  {
    prompt: "Quantos alunos ativos temos hoje?",
  },
  {
    prompt: "Quantas matrículas ativas temos?",
  },
  {
    prompt: "Mostre um resumo financeiro do mês.",
  },
  {
    prompt: "Quais cursos têm mais alunos?",
  },
  {
    prompt: "Quais turmas estão lotadas e onde há vagas?",
  },
  {
    prompt:
      "Há incidentes operacionais críticos ou em aberto? O que priorizo esta semana?",
  },
  {
    prompt: "Liste professores ativos e os cursos em que lecionam.",
  },
  {
    prompt: "Quantas notificações não lidas temos e quais são as mais recentes?",
  },
  {
    prompt:
      "Me dê um panorama acadêmico rápido: turmas, avaliações e frequência registrada.",
  },
  {
    prompt:
      "Qual o boletim (notas e frequência) do aluno que eu indicar pelo nome?",
  },
];

const professorQuickPrompts = getEduiaDocenteQuickSuggestions().map((s) => ({
  prompt: s.prompt,
  label: s.label,
}));

const jarvisAccents: AiSuggestionJarvisAccent[] = [
  "violet",
  "amber",
  "sky",
  "emerald",
  "rose",
];

export function AiQuickPrompts({
  onSelect,
  preset = "executive",
  presentation = "list",
}: AiQuickPromptsProps) {
  const list = preset === "professor" ? professorQuickPrompts : quickPrompts;

  if (presentation === "jarvis" && preset === "professor") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {professorQuickPrompts.slice(0, 6).map((item, i) => (
          <AiSuggestionCard
            key={item.prompt}
            prompt={item.prompt}
            label={item.label}
            onClick={onSelect}
            variant="jarvis"
            jarvisAccent={jarvisAccents[i % jarvisAccents.length]}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((item) => (
        <AiSuggestionCard
          key={item.prompt}
          prompt={item.prompt}
          onClick={onSelect}
          variant="list"
        />
      ))}
    </div>
  );
}