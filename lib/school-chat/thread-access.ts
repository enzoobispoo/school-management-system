import { prisma } from "@/lib/prisma";

export async function userParticipatesInThread(
  userId: string,
  threadId: string
): Promise<boolean> {
  const row = await prisma.schoolChatParticipant.findFirst({
    where: { userId, threadId },
    select: { id: true },
  });
  return Boolean(row);
}
