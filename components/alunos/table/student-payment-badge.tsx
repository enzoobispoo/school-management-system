"use client";

import { Badge } from "@/components/ui/badge";

export type StudentPaymentStatus = "paid" | "pending" | "overdue";

const statusStyles = {
  paid: "border-black/10 bg-black/[0.04] text-black/75",
  pending: "border-warning/20 bg-warning/10 text-warning-foreground",
  overdue: "border-destructive/20 bg-destructive/10 text-destructive",
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
