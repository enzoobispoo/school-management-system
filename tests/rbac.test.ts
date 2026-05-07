import { describe, expect, it } from "vitest";
import {
  canAccessExecutiveEduia,
  canAccessExecutiveSchoolDashboard,
} from "@/lib/auth/rbac";

describe("RBAC — painel executivo", () => {
  it("permite administração, financeiro e secretaria", () => {
    expect(canAccessExecutiveSchoolDashboard({ role: "ADMIN" })).toBe(true);
    expect(canAccessExecutiveSchoolDashboard({ role: "FINANCEIRO" })).toBe(
      true
    );
    expect(canAccessExecutiveSchoolDashboard({ role: "SECRETARIA" })).toBe(
      true
    );
  });

  it("nega professor", () => {
    expect(canAccessExecutiveSchoolDashboard({ role: "PROFESSOR" })).toBe(
      false
    );
  });
});

describe("RBAC — EduIA executiva", () => {
  it("permite perfis de gestão e super admin", () => {
    expect(canAccessExecutiveEduia({ role: "ADMIN" })).toBe(true);
    expect(canAccessExecutiveEduia({ role: "SUPER_ADMIN" })).toBe(true);
    expect(canAccessExecutiveEduia({ role: "FINANCEIRO" })).toBe(true);
    expect(canAccessExecutiveEduia({ role: "SECRETARIA" })).toBe(true);
  });

  it("nega professor", () => {
    expect(canAccessExecutiveEduia({ role: "PROFESSOR" })).toBe(false);
  });
});
