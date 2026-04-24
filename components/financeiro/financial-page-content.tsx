"use client";

import { FinancialSummary } from "@/components/financeiro/financial-summary";
import { FinancialSummarySkeleton } from "@/components/financeiro/financial-summary-skeleton";
import { PaymentsTable } from "@/components/financeiro/payments-table";
import { PaymentsTableSkeleton } from "@/components/financeiro/payments-table-skeleton";
import { FinancialFiltersBar } from "@/components/financeiro/financial-filters-bar";
import { FinancialPagination } from "@/components/financeiro/financial-pagination";
import type {
  PaymentTableItem,
  FinancialAdvancedMetrics,
} from "@/hooks/financeiro/use-financial-query";

interface FinancialPageContentProps {
  payments: PaymentTableItem[];
  loading: boolean;
  loadingTotals: boolean;
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
  advancedMetrics: FinancialAdvancedMetrics;
  onGenerateMonthlyPayments: () => Promise<void>;
  onRegisterPayment: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  onSendReminder: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => Promise<void>;
  onViewDetails: (payment: PaymentTableItem) => void;
  onDeletePayment: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
  onGenerateBoleto: (payment: {
    id: string;
    student: string;
    description: string;
    amount: number;
  }) => void;
}

export function FinancialPageContent(props: FinancialPageContentProps) {
  const {
    payments,
    loading,
    loadingTotals,
    error,
    page,
    setPage,
    meta,
    financialTotals,
    advancedMetrics,
    onRegisterPayment,
    onSendReminder,
    onViewDetails,
    onDeletePayment,
  } = props;

  return (
    <div className="p-6">
      {loadingTotals ? (
        <FinancialSummarySkeleton />
      ) : (
        <FinancialSummary
          receitaTotal={financialTotals.receitaTotal}
          recebidoMes={financialTotals.recebidoMes}
          valoresPendentes={financialTotals.valoresPendentes}
          valoresAtrasados={financialTotals.valoresAtrasados}
          quantidadePendentes={financialTotals.quantidadePendentes}
          quantidadeAtrasados={financialTotals.quantidadeAtrasados}
          receitaPrevista={advancedMetrics.receitaPrevista}
          taxaRecebimento={advancedMetrics.taxaRecebimento}
          taxaInadimplencia={advancedMetrics.taxaInadimplencia}
        />
      )}

      <div className="mb-4 mt-6">
        <FinancialFiltersBar {...props} payments={payments} />
      </div>

      {error ? (
        <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : loading ? (
        <PaymentsTableSkeleton />
      ) : (
        <PaymentsTable
          payments={payments}
          loading={loading}
          onRegisterPayment={onRegisterPayment}
          onSendReminder={onSendReminder}
          onViewDetails={onViewDetails}
          onDeletePayment={onDeletePayment}
          actionLoadingId={props.actionLoadingId}
          onGenerateBoleto={props.onGenerateBoleto}
        />
      )}

      {!loading ? (
        <FinancialPagination
          page={page}
          setPage={setPage}
          meta={meta}
          loading={loading}
          currentCount={payments.length}
        />
      ) : null}
    </div>
  );
}