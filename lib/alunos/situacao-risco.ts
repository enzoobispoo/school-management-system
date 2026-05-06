/** Mesmas regras da listagem em `GET /api/alunos`. */
export function computeSituacaoRisco(params: {
  pagamentoStatuses: string[];
  frequenciaGeral: number | null;
  mediaGeral: number | null;
  advertencias: number;
}): "ok" | "atencao" {
  const pagamentoAtrasado = params.pagamentoStatuses.some(
    (s) => s === "ATRASADO"
  );
  const atencao =
    pagamentoAtrasado ||
    (params.frequenciaGeral !== null && params.frequenciaGeral < 75) ||
    (params.mediaGeral !== null && params.mediaGeral < 6) ||
    params.advertencias > 0;
  return atencao ? "atencao" : "ok";
}
