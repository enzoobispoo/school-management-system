"use client";

import { AiSuggestionCard } from "@/components/dashboard/ai/ai-suggestion-card";

interface AiQuickPromptsProps {
  onSelect: (prompt: string) => void;
}

const quickPrompts = [
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
    prompt: "Mostre um resumo financeiro do mês.",
  },
  {
    prompt: "Quais cursos têm mais alunos?",
  },
];

export function AiQuickPrompts({ onSelect }: AiQuickPromptsProps) {
  return (
    <div className="flex flex-col gap-3">
      {quickPrompts.map((item) => (
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