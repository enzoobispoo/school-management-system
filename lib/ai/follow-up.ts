import {
    extractFollowUpFilters,
    isContextualFollowUp,
    normalizeConversationContext,
  } from "@/lib/ai/conversation-context";
  
  function formatCurrency(value: number) {
    return `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pt-BR");
  }
  
  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();
  }
  
  export function resolveLocalFollowUp(params: {
    message: string;
    conversationContext: unknown;
  }) {
    const context = normalizeConversationContext(params.conversationContext);
  
    if (!context) {
      return null;
    }
  
    const { courseName, limit } = extractFollowUpFilters(params.message);
    const hasNumericLimit = typeof limit === "number" && limit > 0;
    const hasRefinementIntent =
      isContextualFollowUp(params.message) || !!courseName || hasNumericLimit;
  
    if (!hasRefinementIntent) {
      return null;
    }
  
    if (context.scope === "top_courses") {
      let items = [...context.items];
  
      if (courseName) {
        const normalizedFilter = normalizeText(courseName);
  
        items = items.filter((item) => {
          const normalizedCategory = normalizeText(item.category);
          const normalizedName = normalizeText(item.name);
  
          return (
            normalizedCategory.includes(normalizedFilter) ||
            normalizedName.includes(normalizedFilter)
          );
        });
      }
  
      if (hasNumericLimit) {
        items = items.slice(0, limit);
      }
  
      if (items.length === 0) {
        return {
          message: "Não encontrei cursos com esse filtro.",
          conversationContext: context,
        };
      }
  
      const lista = items
        .map(
          (item, index) =>
            `${index + 1}. ${item.name} (${item.category}) — ${item.students} alunos`
        )
        .join("\n");
  
      return {
        message: `Refinei os cursos:\n\n${lista}`,
        conversationContext: {
          scope: "top_courses" as const,
          items,
        },
      };
    }
  
    if (context.scope === "overdue_payments") {
      let items = [...context.items];
  
      if (courseName) {
        const normalizedFilter = normalizeText(courseName);
  
        items = items.filter((item) =>
          normalizeText(item.courseName).includes(normalizedFilter)
        );
      }
  
      if (hasNumericLimit) {
        items = items.slice(0, limit);
      }
  
      if (items.length === 0) {
        return {
          message: "Não encontrei resultados com esse refinamento.",
          conversationContext: context,
        };
      }
  
      const lista = items
        .map((item) =>
          [
            `• Aluno: ${item.studentName}`,
            `  Curso: ${item.courseName}`,
            `  Valor: ${formatCurrency(item.amount)}`,
            `  Vencimento: ${formatDate(item.dueDate)}`,
          ].join("\n")
        )
        .join("\n\n");
  
      return {
        message: `Refinei a lista anterior:\n\n${lista}`,
        conversationContext: {
          scope: "overdue_payments" as const,
          items,
        },
      };
    }
  
    return null;
  }