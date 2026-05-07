import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  buildDueDateClamped,
  calcularPrimeiroVencimentoMensal,
  clampDueDayInMonth,
} from "@/lib/finance/due-date";

describe("due-date", () => {
  it("clampDueDayInMonth respects short months", () => {
    expect(clampDueDayInMonth(2026, 1, 31)).toBe(28); // fev 2026
    expect(clampDueDayInMonth(2024, 1, 31)).toBe(29); // bissexto
  });

  it("calcularPrimeiroVencimentoMensal rolls to next month after enrollment day", () => {
    const base = new Date(2026, 2, 15); // 15 mar
    const d = calcularPrimeiroVencimentoMensal(base, 10);
    expect(d.getMonth()).toBe(3); // abril
    expect(d.getDate()).toBe(10);
  });

  it("addCalendarMonths crosses year boundary", () => {
    expect(addCalendarMonths(2026, 12, 1)).toEqual({ year: 2027, month1based: 1 });
  });

  it("buildDueDateClamped uses noon local", () => {
    const d = buildDueDateClamped(2026, 0, 10);
    expect(d.getHours()).toBe(12);
  });
});
