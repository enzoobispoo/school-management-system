/** Chave estável para DM entre dois usuários (mesma escola). */
export function schoolChatDmKey(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(":");
}
