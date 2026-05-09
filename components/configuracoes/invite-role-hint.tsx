"use client";

import { INVITE_ROLE_GUIDE } from "@/lib/config/invite-role-guide";

export function InviteRoleHint({ role }: { role: string }) {
  const entry = INVITE_ROLE_GUIDE[role];
  if (!entry) return null;

  return (
    <div
      className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground"
      role="note"
    >
      <p className="font-semibold text-foreground">{entry.headline}</p>
      <p className="mt-1.5">{entry.body}</p>
    </div>
  );
}
