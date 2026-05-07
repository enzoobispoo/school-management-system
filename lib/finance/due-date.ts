/** Dia útil de vencimento (1–31). Meses curtos usam o último dia do mês. */

export function clampDueDayInMonth(
  year: number,
  monthIndex: number,
  requestedDay: number
): number {
  const rd = Number.isFinite(requestedDay) ? Math.round(requestedDay) : 10;
  const clampedRequest = Math.min(Math.max(1, rd), 31);
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(clampedRequest, last);
}

export function buildDueDateClamped(
  year: number,
  monthIndex: number,
  dueDay: number
): Date {
  const day = clampDueDayInMonth(year, monthIndex, dueDay);
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

/** Avança competência (mês civil): jan=1 … dez=12. */
export function addCalendarMonths(
  year: number,
  month1based: number,
  delta: number
): { year: number; month1based: number } {
  const idx = month1based - 1 + delta;
  const y = year + Math.floor(idx / 12);
  const m = ((idx % 12) + 12) % 12;
  return { year: y, month1based: m + 1 };
}

/** Primeira data de vencimento após a matrícula, usando o dia escolhido. */
export function calcularPrimeiroVencimentoMensal(
  dataMatricula: Date,
  dueDay: number
): Date {
  const y0 = dataMatricula.getFullYear();
  const m0 = dataMatricula.getMonth();
  const day0 = clampDueDayInMonth(y0, m0, dueDay);
  if (dataMatricula.getDate() <= day0) {
    return buildDueDateClamped(y0, m0, dueDay);
  }
  const next = addCalendarMonths(y0, m0 + 1, 1);
  return buildDueDateClamped(next.year, next.month1based - 1, dueDay);
}
