export { getCurrentUser, getCurrentUserFromRequest, requireSchool } from "@/lib/auth/get-current-user";
export type { AuthenticatedUser } from "@/lib/auth/get-current-user";
export { resolveSchoolScopeForRequest } from "@/lib/auth/resolve-school-scope";

export function isAdmin(user: { role: string } | null | undefined) {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export {
  canAccessExecutiveEduia,
  canAccessExecutiveSchoolDashboard,
  EDUIA_EXECUTIVE_ROLES,
  jsonForbiddenRole,
  SCHOOL_EXECUTIVE_ROLES,
} from "@/lib/auth/rbac";

export {
  assertBillingNotify,
  assertCoreFinanceWrite,
  assertEnrollmentRead,
  assertEnrollmentWrite,
  assertFinanceRead,
  roleHasBillingNotify,
  roleHasCoreFinanceWrite,
  roleHasEnrollmentRead,
  roleHasEnrollmentWrite,
  roleHasFinanceRead,
} from "@/lib/auth/school-permissions";
