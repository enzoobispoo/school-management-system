export function isAiQuery(input: string) {
    const value = input.trim().toLowerCase();
  
    if (!value) return false;
  
    if (value.endsWith("?")) return true;
  
    const aiStarters = [
      "quantos",
      "quantas",
      "quais",
      "qual",
      "quem",
      "mostre",
      "mostrar",
      "gere",
      "gerar",
      "como",
      "quanto",
      "resuma",
      "listar",
      "liste",
    ];
  
    return aiStarters.some((starter) => value.startsWith(starter));
  }