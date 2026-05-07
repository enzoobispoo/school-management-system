import { describe, expect, it } from "vitest";
import { pctChangeVsPrevious } from "@/lib/finance/pct-change";

describe("pctChangeVsPrevious", () => {
  it("calcula variação vs período anterior", () => {
    expect(pctChangeVsPrevious(110, 100)).toBe(10);
    expect(pctChangeVsPrevious(90, 100)).toBe(-10);
    expect(pctChangeVsPrevious(100, 100)).toBe(0);
  });

  it("quando anterior é zero e atual positivo, retorna 100%", () => {
    expect(pctChangeVsPrevious(50, 0)).toBe(100);
  });

  it("quando ambos zero, retorna 0", () => {
    expect(pctChangeVsPrevious(0, 0)).toBe(0);
  });
});
