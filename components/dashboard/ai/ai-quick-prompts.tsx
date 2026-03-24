"use client";

import { Button } from "@/components/ui/button";

interface AiQuickPromptsProps {
  onSelect: (text: string) => void | Promise<void>;
}

const prompts = [
  "Quais pagamentos estão atrasados?",
  "Quantos alunos ativos temos hoje?",
  "Mostre um resumo financeiro do mês.",
  "Quais cursos têm mais alunos?",
];

export function AiQuickPrompts({ onSelect }: AiQuickPromptsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <Button
          key={prompt}
          type="button"
          variant="outline"
          className="rounded-full border-black/10 bg-white text-black/70 hover:bg-black/[0.03]"
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}