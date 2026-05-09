"use client";

import { useMemo } from "react";
import {
  AiSuggestionCard,
  type AiSuggestionJarvisAccent,
} from "@/components/dashboard/ai/ai-suggestion-card";
import {
  DEFAULT_EDUIA_CLIENT_CAPS,
  filterAiSuggestionsForCaps,
  filterAiSuggestionsForExecutiveSecretariaRole,
  type EduiaClientCaps,
} from "@/lib/ai/eduia-client-caps";
import {
  getEduiaDocenteQuickSuggestions,
  getEduiaFinanceQuickSuggestions,
  getEduiaQuickSuggestions,
} from "@/lib/ai/suggestions";
interface AiQuickPromptsProps {
  onSelect: (prompt: string) => void;
  /** Atalhos do workspace docente (sem financeiro global). */
  preset?: "executive" | "professor";
  /** Cards grandes e cores suaves (painel docente estilo assistente). */
  presentation?: "list" | "jarvis";
  /** Capacidades da escola (plano + OpenAI); default conservador até `/api/auth/me` responder. */
  caps?: EduiaClientCaps | null;
  /** Para ocultar sugestões financeiras no preset executivo quando `SECRETARIA` acadêmica. */
  userRole?: string | null;
}

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
  caps = null,
  userRole = null,
}: AiQuickPromptsProps) {
  const effectiveCaps = caps ?? DEFAULT_EDUIA_CLIENT_CAPS;

  const executiveList = useMemo(() => {
    const base =
      userRole === "FINANCEIRO" ?
        getEduiaFinanceQuickSuggestions()
      : getEduiaQuickSuggestions();
    const capped = filterAiSuggestionsForCaps(base, effectiveCaps);
    return filterAiSuggestionsForExecutiveSecretariaRole(capped, userRole);
  }, [effectiveCaps, userRole]);

  const professorList = useMemo(
    () =>
      filterAiSuggestionsForCaps(
        getEduiaDocenteQuickSuggestions(),
        effectiveCaps
      ),
    [effectiveCaps]
  );

  const list = preset === "professor" ? professorList : executiveList;

  if (presentation === "jarvis" && preset === "professor") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {professorList.slice(0, 6).map((item, i) => (
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
