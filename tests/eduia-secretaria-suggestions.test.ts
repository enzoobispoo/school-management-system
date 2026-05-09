import { describe, expect, it } from "vitest";
import { filterAndPublicAiSuggestionsForDashboardUser } from "@/lib/ai/eduia-client-caps";
import { getEduiaQuickSuggestions } from "@/lib/ai/suggestions";

const fullOpenAiCaps = {
  planTier: "full" as const,
  openAiReady: true,
  integratedOnly: false,
};

describe("filterAndPublicAiSuggestionsForDashboardUser", () => {
  it("remove sugestões hideForSecretariaAcademic para SECRETARIA", () => {
    const filtered = filterAndPublicAiSuggestionsForDashboardUser(
      getEduiaQuickSuggestions(),
      fullOpenAiCaps,
      "SECRETARIA"
    );
    const labels = filtered.map((s) => s.label);
    expect(labels).not.toContain("Receita do mês");
    expect(labels).not.toContain("Pagamentos atrasados");
    expect(labels).not.toContain("Resumo financeiro");
    expect(labels).toContain("Próximos eventos");
  });

  it("mantém sugestões financeiras para SECRETARIA_FINANCEIRA", () => {
    const filtered = filterAndPublicAiSuggestionsForDashboardUser(
      getEduiaQuickSuggestions(),
      fullOpenAiCaps,
      "SECRETARIA_FINANCEIRA"
    );
    const labels = filtered.map((s) => s.label);
    expect(labels).toContain("Receita do mês");
    expect(labels).toContain("Pagamentos atrasados");
  });
});
