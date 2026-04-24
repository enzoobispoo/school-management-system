"use client";

type LastSendStatus = "sent" | "failed" | "pending" | null;
type LastSendType = "boleto" | "reminder" | "overdue" | null;

interface LastSendBadgeProps {
  status?: LastSendStatus;
  type?: LastSendType;
}

export function LastSendBadge({ status, type }: LastSendBadgeProps) {
  if (!status || !type) return null;

  const typeLabel =
    type === "boleto"
      ? "Boleto"
      : type === "reminder"
      ? "Lembrete"
      : "Cobrança";

  if (status === "sent") {
    return (
      <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        {typeLabel} enviado
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex w-fit rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
        {typeLabel} falhou
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
      {typeLabel} pendente
    </span>
  );
}