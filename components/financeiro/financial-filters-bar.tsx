"use client";

import { useEffect, useState } from "react";
import { Search, Download, CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export/export-to-csv";
import { DashboardSectionCard } from "@/components/dashboard/ui/dashboard-section-card";
import type { PaymentTableItem } from "@/hooks/financeiro/use-financial-query";
import { FinancialGenerateDialog } from "./financial-generate-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ExportPayment = Pick<
  PaymentTableItem,
  "student" | "description" | "amount" | "status" | "dueDate"
>;

interface Props {
  tabStatus: string;
  setTabStatus: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  month: string;
  setMonth: (value: string) => void;
  dateFrom?: string;
  setDateFrom?: (value: string) => void;
  dateTo?: string;
  setDateTo?: (value: string) => void;
  setPage: (value: number | ((prev: number) => number)) => void;
  generateDialogOpen: boolean;
  setGenerateDialogOpen: (open: boolean) => void;
  generatingMonthlyPayments: boolean;
  onGenerateMonthlyPayments: () => Promise<void>;
  payments: ExportPayment[];
}

export function FinancialFiltersBar({
  tabStatus,
  setTabStatus,
  search,
  setSearch,
  month,
  setMonth,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  setPage,
  generateDialogOpen,
  setGenerateDialogOpen,
  generatingMonthlyPayments,
  onGenerateMonthlyPayments,
  payments,
}: Props) {
  const [meses, setMeses] = useState<{ value: string; label: string }[]>([]);
  const [showDateRange, setShowDateRange] = useState(!!(dateFrom || dateTo));

  useEffect(() => {
    fetch("/api/pagamentos/meses-disponiveis", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setMeses(d); })
      .catch(() => {});
  }, []);
  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={tabStatus}
        onValueChange={(value) => {
          setPage(1);
          setTabStatus(value);
        }}
      >
        <TabsList className="w-fit bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="rounded-full bg-[#f6f6f6] px-4 py-2 text-sm font-medium text-[#6b7280] data-[state=active]:bg-black data-[state=active]:text-white dark:bg-muted dark:text-muted-foreground dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
          >
            Todos
          </TabsTrigger>
          <TabsTrigger
            value="paid"
            className="rounded-full bg-[#f6f6f6] px-4 py-2 text-sm font-medium text-[#6b7280] data-[state=active]:bg-black data-[state=active]:text-white dark:bg-muted dark:text-muted-foreground dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
          >
            Pagos
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-full bg-[#f6f6f6] px-4 py-2 text-sm font-medium text-[#6b7280] data-[state=active]:bg-black data-[state=active]:text-white dark:bg-muted dark:text-muted-foreground dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
          >
            Pendentes
          </TabsTrigger>
          <TabsTrigger
            value="overdue"
            className="rounded-full bg-[#f6f6f6] px-4 py-2 text-sm font-medium text-[#6b7280] data-[state=active]:bg-black data-[state=active]:text-white dark:bg-muted dark:text-muted-foreground dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
          >
            Atrasados
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DashboardSectionCard className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/42 dark:text-muted-foreground" />
              <Input
                placeholder="Buscar pagamento..."
                className="h-11 rounded-2xl bg-background pl-9 placeholder:text-black/42 dark:placeholder:text-muted-foreground"
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
                {meses.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className={`h-11 w-11 rounded-2xl shrink-0 ${
                showDateRange ? "border-foreground/30 bg-muted" : ""
              }`}
              title="Filtrar por período"
              onClick={() => {
                setShowDateRange((v) => !v);
                if (showDateRange) {
                  setDateFrom?.("");
                  setDateTo?.("");
                }
              }}
            >
              <CalendarRange className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-11 gap-2 rounded-2xl border border-black/10 bg-white px-5 text-black shadow-sm hover:bg-black/[0.03] dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur-md dark:hover:bg-white/20"
              onClick={() =>
                exportToCSV(
                  payments.map((p) => ({
                    Aluno: p.student,
                    Descrição: p.description,
                    Valor: p.amount,
                    Status: p.status,
                    Vencimento: p.dueDate,
                  })),
                  "pagamentos.csv"
                )
              }
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>

            <FinancialGenerateDialog
              open={generateDialogOpen}
              onOpenChange={setGenerateDialogOpen}
              loading={generatingMonthlyPayments}
              onConfirm={onGenerateMonthlyPayments}
            />
          </div>
        </div>

        {/* Date range expandido */}
        {showDateRange && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-4">
            <span className="text-xs text-muted-foreground">Período:</span>
            <input
              type="date"
              value={dateFrom ?? ""}
              onChange={(e) => { setDateFrom?.(e.target.value); setPage(1); }}
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/30"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="date"
              value={dateTo ?? ""}
              onChange={(e) => { setDateTo?.(e.target.value); setPage(1); }}
              className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-foreground/30"
            />
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" className="h-9 rounded-xl text-xs text-muted-foreground"
                onClick={() => { setDateFrom?.(""); setDateTo?.(""); setPage(1); }}
              >
                Limpar
              </Button>
            )}
          </div>
        )}
      </DashboardSectionCard>
    </div>
  );
}