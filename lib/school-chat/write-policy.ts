import { SchoolChatThreadKind, SchoolChatWritePolicy } from "@prisma/client";

export function viewerCanPostSchoolChat(params: {
  kind: SchoolChatThreadKind;
  writePolicy: SchoolChatWritePolicy;
  ownerUserId: string | null;
  viewerUserId: string;
}): boolean {
  const { kind, writePolicy, ownerUserId, viewerUserId } = params;
  if (kind !== "GROUP") return true;
  if (writePolicy === "ALL_MEMBERS") return true;
  return ownerUserId != null && ownerUserId === viewerUserId;
}
