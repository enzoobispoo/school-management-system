import { NextResponse } from "next/server";

/** Perfis da escola com acesso ao painel executivo e métricas agregadas. */
export const SCHOOL_EXECUTIVE_ROLES = ["ADMIN", "FINANCEIRO", "SECRETARIA"] as const;

/** Perfis que podem usar a EduIA do dashboard com ferramentas de gestão (financeiro, turmas, etc.). */
export const EDUIA_EXECUTIVE_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
  "FINANCEIRO",
  "SECRETARIA",
] as const;

export type SchoolExecutiveRole = (typeof SCHOOL_EXECUTIVE_ROLES)[number];
export type EduiaExecutiveRole = (typeof EDUIA_EXECUTIVE_ROLES)[number];

export function canAccessExecutiveSchoolDashboard(user: {
  role: string;
}): boolean {
  return SCHOOL_EXECUTIVE_ROLES.includes(user.role as SchoolExecutiveRole);
}

export function canAccessExecutiveEduia(user: { role: string }): boolean {
  return EDUIA_EXECUTIVE_ROLES.includes(user.role as EduiaExecutiveRole);
}

export function jsonForbiddenRole(
  message: string,
  code = "FORBIDDEN_ROLE"
): NextResponse {
  return NextResponse.json({ error: message, code }, { status: 403 });
}
