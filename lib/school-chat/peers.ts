import type { UserRole } from "@prisma/client";

const PEER_ROLES: UserRole[] = [
  "PROFESSOR",
  "ADMIN",
  "SECRETARIA",
  "SECRETARIA_FINANCEIRA",
  "FINANCEIRO",
];

export function isSchoolChatPeerRole(role: UserRole): boolean {
  return PEER_ROLES.includes(role);
}
