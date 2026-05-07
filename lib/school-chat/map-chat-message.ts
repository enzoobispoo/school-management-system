export type SchoolChatMessageDbShape = {
  id: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: Date;
  editedAt: Date | null;
  pinnedAt: Date | null;
  deletedAt: Date | null;
  senderUserId: string;
  sender: { id: string; nome: string; avatarUrl: string | null };
};

export function mapSchoolChatMessageForViewer(
  m: SchoolChatMessageDbShape,
  viewerId: string
) {
  const deletedForEveryone = Boolean(m.deletedAt);
  return {
    id: m.id,
    body: deletedForEveryone ? "" : m.body,
    attachmentUrl: deletedForEveryone ? null : m.attachmentUrl,
    attachmentName: deletedForEveryone ? null : m.attachmentName,
    createdAt: m.createdAt.toISOString(),
    editedAt: m.editedAt?.toISOString() ?? null,
    pinnedAt: m.pinnedAt?.toISOString() ?? null,
    deletedForEveryone,
    fromSelf: m.senderUserId === viewerId,
    sender: m.sender,
  };
}
