/** Calcula o fim da rodada quando há cronômetro por questão (segundos > 0). */
export function computeQuestaoDeadline(
  tempoPorQuestaoSegundos: number | null | undefined
): Date | null {
  const s =
    typeof tempoPorQuestaoSegundos === "number" && Number.isFinite(tempoPorQuestaoSegundos)
      ? Math.floor(tempoPorQuestaoSegundos)
      : null;
  if (s == null || s <= 0) return null;
  return new Date(Date.now() + s * 1000);
}
