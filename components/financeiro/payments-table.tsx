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
import type { PaymentTableItem } from "@/hooks/financeiro/use-financial-query";

interface PaymentsTableProps {
  onViewDetails?: (payment: PaymentTableItem) => void;
  payments: PaymentTableItem[];
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
  onSendReminder?: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  onGenerateBoleto?: (payment: {
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
  onSendReminder,
  onGenerateBoleto,
  actionLoadingId = null,
}: PaymentsTableProps) {
  if (loading) {
    return (
      <div className="rounded-[24px] border border-black/5 bg-white p-8 text-sm text-black/42 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white/60">
        Carregando pagamentos...
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-[24px] border border-black/5 bg-white p-8 text-sm text-black/42 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white/60">
        Nenhum pagamento encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="border-black/5 hover:bg-transparent dark:border-white/10">
              <TableHead className="font-medium text-black dark:text-white">
                Aluno
              </TableHead>

              <TableHead className="font-medium text-black dark:text-white">
                Descrição
              </TableHead>

              <TableHead className="font-medium text-black dark:text-white">
                Competência
              </TableHead>

              <TableHead className="font-medium text-black dark:text-white">
                Valor
              </TableHead>

              <TableHead className="font-medium text-black dark:text-white">
                Status
              </TableHead>

              <TableHead className="font-medium text-black dark:text-white">
                Vencimento
              </TableHead>

              <TableHead className="font-medium text-black dark:text-white">
                Pagamento
              </TableHead>

              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {payments.map((payment) => {
              const isUpdating =
                actionLoadingId === payment.id ||
                actionLoadingId === "batch-boleto";

              return (
                <TableRow
                  key={payment.id}
                  className={cn(
                    "border-black/5 dark:border-white/10",
                    payment.status === "overdue" &&
                      "bg-red-50 dark:bg-red-500/5"
                  )}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-black/[0.04] text-xs font-medium text-black dark:bg-white/10 dark:text-white">
                          {payment.studentInitials}
                        </AvatarFallback>
                      </Avatar>

                      <span className="font-medium text-black dark:text-white">
                        {payment.student}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-black/55 dark:text-white/60">
                    <div className="flex flex-col gap-1">
                      <span>{payment.description}</span>

                      <div className="flex flex-wrap gap-2">
                        {payment.hasBoleto && (
                          <span className="inline-flex w-fit rounded-full border border-black/10 bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-black/70 dark:border-white/10 dark:bg-white/10 dark:text-white/70">
                            Boleto gerado
                          </span>
                        )}

                        {payment.wasPaidAutomatically && (
                          <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                            Pago automaticamente
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-black/55 dark:text-white/60">
                    {payment.competence}
                  </TableCell>

                  <TableCell className="py-3 font-medium text-black dark:text-white">
                    R$ {payment.amount.toFixed(2).replace(".", ",")}
                  </TableCell>

                  <TableCell className="py-3">
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>

                  <TableCell className="py-3 text-black/55 dark:text-white/60">
                    {payment.dueDate}
                  </TableCell>

                  <TableCell className="py-3 text-black/55 dark:text-white/60">
                    {payment.date}
                  </TableCell>

                  <TableCell className="py-3">
                    <PaymentsTableActions
                      payment={payment}
                      isUpdating={isUpdating}
                      onViewDetails={onViewDetails}
                      onRegisterPayment={onRegisterPayment}
                      onDeletePayment={onDeletePayment}
                      onSendReminder={onSendReminder}
                      onGenerateBoleto={onGenerateBoleto}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}