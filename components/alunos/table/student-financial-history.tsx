"use client";

import { cn } from "@/lib/utils";
import {
  StudentPaymentBadge,
  type StudentPaymentStatus,
} from "@/components/alunos/table/student-payment-badge";

interface FinancialHistoryItem {
  id?: string;
  date: string;
  description: string;
  amount: number;
  status: StudentPaymentStatus;
}

interface StudentFinancialHistoryProps {
  items?: FinancialHistoryItem[];
}

export function StudentFinancialHistory({
  items = [],
}: StudentFinancialHistoryProps) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhum histórico financeiro encontrado.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-md border border-border/50 bg-background p-2"
        >
          <div className="flex flex-col">
            <span className="text-sm">{item.description.split(" - ")[0]}</span>
            <span className="text-xs text-muted-foreground">{item.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              R$ {item.amount.toFixed(2).replace(".", ",")}
            </span>

            <StudentPaymentBadge
              status={item.status}
              className={cn("text-xs")}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
