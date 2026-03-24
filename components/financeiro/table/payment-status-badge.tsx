"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentStatus = "paid" | "pending" | "overdue";

const statusConfig = {
  paid: {
    label: "Pago",
    icon: CheckCircle,
    className: "border-black/10 bg-black/[0.04] text-black/75",
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "border-black/10 bg-black/[0.04] text-black/65",
  },
  overdue: {
    label: "Atrasado",
    icon: AlertCircle,
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1", config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}