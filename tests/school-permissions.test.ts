import { describe, expect, it } from "vitest";
import {
  roleHasBillingNotify,
  roleHasCoreFinanceWrite,
  roleHasEnrollmentRead,
  roleHasEnrollmentWrite,
  roleHasFinanceRead,
} from "@/lib/auth/school-permissions";

describe("school-permissions — matriz financeiro x matrícula", () => {
  it("financeiro: lê finance e matrícula; só escreve finance (não matrícula)", () => {
    expect(roleHasFinanceRead("FINANCEIRO")).toBe(true);
    expect(roleHasCoreFinanceWrite("FINANCEIRO")).toBe(true);
    expect(roleHasEnrollmentRead("FINANCEIRO")).toBe(true);
    expect(roleHasEnrollmentWrite("FINANCEIRO")).toBe(false);
    expect(roleHasBillingNotify("FINANCEIRO")).toBe(true);
  });

  it("secretaria: lê finance e matrícula; só escreve matrícula (não ledger financeiro)", () => {
    expect(roleHasFinanceRead("SECRETARIA")).toBe(true);
    expect(roleHasCoreFinanceWrite("SECRETARIA")).toBe(false);
    expect(roleHasEnrollmentRead("SECRETARIA")).toBe(true);
    expect(roleHasEnrollmentWrite("SECRETARIA")).toBe(true);
    expect(roleHasBillingNotify("SECRETARIA")).toBe(true);
  });

  it("secretaria_financeira: iguala secretaria nas permissões de API (painel ≠ papel financeiro)", () => {
    expect(roleHasFinanceRead("SECRETARIA_FINANCEIRA")).toBe(true);
    expect(roleHasCoreFinanceWrite("SECRETARIA_FINANCEIRA")).toBe(false);
    expect(roleHasEnrollmentRead("SECRETARIA_FINANCEIRA")).toBe(true);
    expect(roleHasEnrollmentWrite("SECRETARIA_FINANCEIRA")).toBe(true);
    expect(roleHasBillingNotify("SECRETARIA_FINANCEIRA")).toBe(true);
  });

  it("admin e super admin têm escrita nos dois domínios sensíveis aqui mapeados", () => {
    expect(roleHasCoreFinanceWrite("ADMIN")).toBe(true);
    expect(roleHasEnrollmentWrite("ADMIN")).toBe(true);
    expect(roleHasCoreFinanceWrite("SUPER_ADMIN")).toBe(true);
    expect(roleHasEnrollmentWrite("SUPER_ADMIN")).toBe(true);
  });

  it("professor não participa da matriz escolar nestas APIs", () => {
    expect(roleHasFinanceRead("PROFESSOR")).toBe(false);
    expect(roleHasEnrollmentRead("PROFESSOR")).toBe(false);
  });
});
