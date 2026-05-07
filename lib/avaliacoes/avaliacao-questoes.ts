export type QuestaoParsed = {
  ordem: number;
  enunciado: string;
  explicacao: string | null;
  pontos: number | null;
  tipo: "OBJETIVA" | "DISSERTATIVA";
  alternativas: { texto: string; correta: boolean }[];
};

export function parseQuestoesInput(questoesInput: unknown): QuestaoParsed[] {
  const arr = Array.isArray(questoesInput) ? questoesInput : [];
  return arr
    .map((q: unknown, idx: number) => {
      const item = q as {
        enunciado?: string;
        explicacao?: string | null;
        pontos?: number | null;
        tipo?: string;
        alternativas?: { texto?: string; correta?: boolean }[];
      };
      const enunciado = String(item?.enunciado || "").trim();
      const explicacao =
        item?.explicacao !== undefined && item?.explicacao !== null ?
          String(item.explicacao).trim() || null
        : null;
      const pontos =
        item?.pontos !== undefined && item?.pontos !== null ?
          Number(item.pontos)
        : null;
      const alternativas = (Array.isArray(item?.alternativas) ? item.alternativas : [])
        .map((a: { texto?: string; correta?: boolean }) => ({
          texto: String(a?.texto || "").trim(),
          correta: Boolean(a?.correta),
        }))
        .filter((a) => a.texto.length > 0);
      const tipo: "OBJETIVA" | "DISSERTATIVA" =
        item?.tipo === "DISSERTATIVA" ? "DISSERTATIVA" : "OBJETIVA";
      return { ordem: idx + 1, enunciado, explicacao, pontos, tipo, alternativas };
    })
    .filter((q) => q.enunciado.length > 0);
}

/** Retorna mensagem de erro ou null se ok. */
export function validateQuestoesParaFormato(
  questoes: QuestaoParsed[],
  formato: "CLASSICA" | "JOGO"
): string | null {
  for (const q of questoes) {
    if (q.pontos !== null && Number.isNaN(q.pontos)) {
      return "Pontos de questão inválido.";
    }
    if (q.tipo === "DISSERTATIVA") {
      continue;
    }
    if (q.alternativas.length > 0) {
      if (q.alternativas.length < 2) {
        return "Questões com alternativas precisam ter ao menos 2 opções.";
      }
      const corretas = q.alternativas.filter((a) => a.correta).length;
      if (corretas < 1) {
        return "Cada questão objetiva deve ter ao menos 1 alternativa correta.";
      }
    } else if (formato === "JOGO") {
      return "No modo jogo, cada questão precisa ter alternativas.";
    } else if (q.tipo === "OBJETIVA") {
      return "Questão objetiva precisa ter alternativas.";
    }
  }
  return null;
}
