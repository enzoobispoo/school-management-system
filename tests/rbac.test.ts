import { describe, expect, it } from "vitest";
import {
  canAccessExecutiveEduia,
  canAccessExecutiveSchoolDashboard,
} from "@/lib/auth/rbac";

describe("RBAC — painel executivo", () => {
  it("permite administração e secretarias (não o hub exclusivo do financeiro)", () => {
    expect(canAccessExecutiveSchoolDashboard({ role: "ADMIN" })).toBe(true);
    expect(canAccessExecutiveSchoolDashboard({ role: "FINANCEIRO" })).toBe(
      false
    );
    expect(canAccessExecutiveSchoolDashboard({ role: "SECRETARIA" })).toBe(
      true
    );
    expect(
      canAccessExecutiveSchoolDashboard({ role: "SECRETARIA_FINANCEIRA" })
    ).toBe(true);
  });

  it("nega professor", () => {
    expect(canAccessExecutiveSchoolDashboard({ role: "PROFESSOR" })).toBe(
      false
    );
  });
});

describe("RBAC — EduIA executiva", () => {
  it("permite perfis de gestão e super admin (financeiro com tools restritas na API)", () => {
    expect(canAccessExecutiveEduia({ role: "ADMIN" })).toBe(true);
    expect(canAccessExecutiveEduia({ role: "SUPER_ADMIN" })).toBe(true);
    expect(canAccessExecutiveEduia({ role: "FINANCEIRO" })).toBe(true);
    expect(canAccessExecutiveEduia({ role: "SECRETARIA" })).toBe(true);
    expect(canAccessExecutiveEduia({ role: "SECRETARIA_FINANCEIRA" })).toBe(
      true
    );
  });

  it("nega professor", () => {
    expect(canAccessExecutiveEduia({ role: "PROFESSOR" })).toBe(false);
  });
});
