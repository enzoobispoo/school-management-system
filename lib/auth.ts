export { getCurrentUser, getCurrentUserFromRequest, requireSchool } from "@/lib/auth/get-current-user";
export type { AuthenticatedUser } from "@/lib/auth/get-current-user";

export function isAdmin(user: { role: string } | null | undefined) {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}
