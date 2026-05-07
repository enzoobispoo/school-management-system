/** Variação percentual vs período anterior (ex.: receita mês a mês). */
export function pctChangeVsPrevious(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
