import { AiSuggestion } from "@/lib/ai/types";

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