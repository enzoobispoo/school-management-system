"use client";

import { Badge } from "@/components/ui/badge";

export type StudentPaymentStatus = "paid" | "pending" | "overdue";

const statusStyles = {
  paid: "border-black/10 bg-black/[0.04] text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/80",

  pending:
    "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",

  overdue:
    "border-red-200 bg-red-100 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400",
};

const statusLabels = {
  paid: "Em dia",
  pending: "Pendente",
  overdue: "Atrasado",
};

interface StudentPaymentBadgeProps {
  status: StudentPaymentStatus;
  className?: string;
}

export function StudentPaymentBadge({
  status,
  className,
}: StudentPaymentBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${statusStyles[status]} ${className ?? ""}`}
    >
      {statusLabels[status]}
    </Badge>
  );
}
