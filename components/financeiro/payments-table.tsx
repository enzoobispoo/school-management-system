"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/financeiro/table/payment-status-badge";
import { PaymentsTableActions } from "@/components/financeiro/table/payments-table-actions";

interface Payment {
  id: string;
  student: string;
  studentInitials: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
  dueDate: string;
}

interface PaymentsTableProps {
  onViewDetails?: (payment: Payment) => void;
  payments: Payment[];
  loading?: boolean;
  onRegisterPayment?: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  onDeletePayment?: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  actionLoadingId?: string | null;
}

export function PaymentsTable({
  payments,
  loading = false,
  onViewDetails,
  onRegisterPayment,
  onDeletePayment,
  actionLoadingId = null,
}: PaymentsTableProps) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
        Carregando pagamentos...
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
        Nenhum pagamento encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-border/50 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="font-medium">Aluno</TableHead>
            <TableHead className="font-medium">Descrição</TableHead>
            <TableHead className="font-medium">Valor</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium">Vencimento</TableHead>
            <TableHead className="font-medium">Pagamento</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {payments.map((payment) => {
            const isUpdating = actionLoadingId === payment.id;

            return (
              <TableRow
                key={payment.id}
                className={cn(
                  "border-border/50",
                  payment.status === "overdue" && "bg-destructive/5"
                )}
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-black/[0.04] text-xs font-medium text-black">
                        {payment.studentInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                      {payment.student}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-muted-foreground">
                  {payment.description}
                </TableCell>

                <TableCell className="py-3 font-medium text-foreground">
                  R$ {payment.amount.toFixed(2).replace(".", ",")}
                </TableCell>

                <TableCell className="py-3">
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>

                <TableCell className="py-3 text-muted-foreground">
                  {payment.dueDate}
                </TableCell>

                <TableCell className="py-3 text-muted-foreground">
                  {payment.date}
                </TableCell>

                <TableCell className="py-3">
                  <PaymentsTableActions
                    payment={payment}
                    isUpdating={isUpdating}
                    onViewDetails={onViewDetails}
                    onRegisterPayment={onRegisterPayment}
                    onDeletePayment={onDeletePayment}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
