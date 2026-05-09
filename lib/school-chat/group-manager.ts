const ROLES_CAN_CREATE_SCHOOL_CHAT_GROUP = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "FINANCEIRO",
  "SECRETARIA",
  "SECRETARIA_FINANCEIRA",
]);

export function canCreateSchoolChatGroup(role: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  return ROLES_CAN_CREATE_SCHOOL_CHAT_GROUP.has(role);
}
