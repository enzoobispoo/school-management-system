"use client";

import { Search, Download, Plus } from "lucide-react";
import { FinancialSummary } from "@/components/financeiro/financial-summary";
import { PaymentsTable } from "@/components/financeiro/payments-table";
import { DashboardSectionCard } from "@/components/dashboard/ui/dashboard-section-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaymentTableItem } from "@/hooks/financeiro/use-financial-query";

interface FinancialPageContentProps {
  payments: PaymentTableItem[];
  loading: boolean;
  error: string;
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  tabStatus: string;
  setTabStatus: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  month: string;
  setMonth: (value: string) => void;
  generateDialogOpen: boolean;
  setGenerateDialogOpen: (open: boolean) => void;
  generatingMonthlyPayments: boolean;
  actionLoadingId: string | null;
  financialTotals: {
    receitaTotal: number;
    recebidoMes: number;
    valoresPendentes: number;
    valoresAtrasados: number;
    quantidadePendentes: number;
    quantidadeAtrasados: number;
  };
  onGenerateMonthlyPayments: () => Promise<void>;
  onRegisterPayment: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  onViewDetails: (payment: PaymentTableItem) => void;
  onDeletePayment: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
}

export function FinancialPageContent({
  payments,
  loading,
  error,
  page,
  setPage,
  meta,
  tabStatus,
  setTabStatus,
  search,
  setSearch,
  month,
  setMonth,
  generateDialogOpen,
  setGenerateDialogOpen,
  generatingMonthlyPayments,
  actionLoadingId,
  financialTotals,
  onGenerateMonthlyPayments,
  onRegisterPayment,
  onViewDetails,
  onDeletePayment,
}: FinancialPageContentProps) {
  return (
    <div className="p-6">
      <FinancialSummary
        receitaTotal={financialTotals.receitaTotal}
        recebidoMes={financialTotals.recebidoMes}
        valoresPendentes={financialTotals.valoresPendentes}
        valoresAtrasados={financialTotals.valoresAtrasados}
        quantidadePendentes={financialTotals.quantidadePendentes}
        quantidadeAtrasados={financialTotals.quantidadeAtrasados}
      />

      <div className="mb-4 mt-6 flex flex-col gap-4">
        <Tabs
          value={tabStatus}
          onValueChange={(value) => {
            setPage(1);
            setTabStatus(value);
          }}
          className="w-full"
        >
          <TabsList className="w-fit">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="overdue">Atrasados</TabsTrigger>
          </TabsList>
        </Tabs>

        <DashboardSectionCard className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar pagamento..."
                  className="h-11 rounded-2xl bg-background pl-9"
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />
              </div>

              <Select
                value={month}
                onValueChange={(value) => {
                  setPage(1);
                  setMonth(value);
                }}
              >
                <SelectTrigger className="h-11 w-[150px] rounded-2xl">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="03-2026">Março 2026</SelectItem>
                  <SelectItem value="02-2026">Fevereiro 2026</SelectItem>
                  <SelectItem value="01-2026">Janeiro 2026</SelectItem>
                  <SelectItem value="12-2025">Dezembro 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2 rounded-2xl">
                <Download className="h-4 w-4" />
                Exportar
              </Button>

              <AlertDialog
                open={generateDialogOpen}
                onOpenChange={setGenerateDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    className="gap-2 rounded-2xl"
                    disabled={generatingMonthlyPayments}
                  >
                    <Plus className="h-4 w-4" />
                    {generatingMonthlyPayments
                      ? "Gerando..."
                      : "Gerar mensalidades"}
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Gerar mensalidades</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação vai gerar a próxima mensalidade para todas as
                      matrículas ativas que ainda não tenham cobrança da próxima
                      competência.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={generatingMonthlyPayments}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async (e) => {
                        e.preventDefault();
                        await onGenerateMonthlyPayments();
                      }}
                      disabled={generatingMonthlyPayments}
                    >
                      {generatingMonthlyPayments
                        ? "Gerando..."
                        : "Confirmar geração"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DashboardSectionCard>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <PaymentsTable
          payments={payments}
          loading={loading}
          onRegisterPayment={onRegisterPayment}
          onViewDetails={onViewDetails}
          onDeletePayment={onDeletePayment}
          actionLoadingId={actionLoadingId}
        />
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {payments.length} de {meta.total} pagamentos
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}