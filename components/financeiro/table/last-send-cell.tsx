"use client";

import { LastSendBadge } from "@/components/financeiro/table/last-send-badge";

type LastSendStatus = "sent" | "failed" | "pending" | null;
type LastSendType = "boleto" | "reminder" | "overdue" | null;

interface LastSendCellProps {
  lastSendAt?: string | null;
  lastSendStatus?: LastSendStatus;
  lastSendType?: LastSendType;
  lastSendError?: string | null;
}

export function LastSendCell({
  lastSendAt,
  lastSendStatus,
  lastSendType,
  lastSendError,
}: LastSendCellProps) {
  if (!lastSendAt) {
    return (
      <span className="text-black/35 dark:text-white/35">
        Nunca enviado
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span>{lastSendAt}</span>

      <LastSendBadge
        status={lastSendStatus}
        type={lastSendType}
      />

      {lastSendError ? (
        <span
          className="max-w-[220px] truncate text-[11px] text-red-600 dark:text-red-300"
          title={lastSendError}
        >
          {lastSendError}
        </span>
      ) : null}
    </div>
  );
}