import { SCHOOL_EXECUTIVE_ROLES } from "@/lib/auth/rbac";

export function canCreateSchoolChatGroup(role: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  return SCHOOL_EXECUTIVE_ROLES.includes(role as (typeof SCHOOL_EXECUTIVE_ROLES)[number]);
}
