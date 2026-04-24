"use client";

import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Wallet,
  Percent,
} from "lucide-react";
import { FinancialSummaryCard } from "@/components/financeiro/summary/financial-summary-card";

interface FinancialSummaryProps {
  receitaTotal: number;
  recebidoMes: number;
  valoresPendentes: number;
  valoresAtrasados: number;
  quantidadePendentes: number;
  quantidadeAtrasados: number;
  receitaPrevista?: number;
  taxaRecebimento?: number;
  taxaInadimplencia?: number;
}

const formatCurrency = (value: number) =>
  `R$ ${value.toFixed(2).replace(".", ",")}`;

const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

export function FinancialSummary({
  receitaTotal,
  recebidoMes,
  valoresPendentes,
  valoresAtrasados,
  quantidadePendentes,
  quantidadeAtrasados,
  receitaPrevista = 0,
  taxaRecebimento = 0,
  taxaInadimplencia = 0,
}: FinancialSummaryProps) {
  const summaryData = [
    {
      title: "Receita Total",
      value: formatCurrency(receitaTotal),
      change: "Total recebido",
      changeType: "positive" as const,
      icon: DollarSign,
      iconBg: "bg-black/[0.04] text-black dark:bg-muted dark:text-foreground",
    },
    {
      title: "Recebido este mês",
      value: formatCurrency(recebidoMes),
      change: "Pagamentos confirmados",
      changeType: "positive" as const,
      icon: TrendingUp,
      iconBg: "bg-black/[0.04] text-black dark:bg-muted dark:text-foreground",
    },
    {
      title: "Receita Prevista",
      value: formatCurrency(receitaPrevista),
      change: "Pendentes + atrasados",
      changeType: "neutral" as const,
      icon: Wallet,
      iconBg: "bg-black/[0.04] text-black dark:bg-muted dark:text-foreground",
    },
    {
      title: "Valores Pendentes",
      value: formatCurrency(valoresPendentes),
      change: `${quantidadePendentes} pendente(s)`,
      changeType: "neutral" as const,
      icon: Clock,
      iconBg: "bg-black/[0.04] text-black dark:bg-muted dark:text-foreground",
      secondaryInfo:
        quantidadeAtrasados > 0
          ? `${quantidadeAtrasados} atrasado(s)`
          : undefined,
    },
    {
      title: "Valores Atrasados",
      value: formatCurrency(valoresAtrasados),
      change: `${quantidadeAtrasados} atrasado(s)`,
      changeType: "negative" as const,
      icon: TrendingDown,
      iconBg: "bg-black/[0.04] text-black dark:bg-muted dark:text-foreground",
      secondaryInfo:
        quantidadePendentes > 0
          ? `${quantidadePendentes} pendente(s)`
          : undefined,
    },
    {
      title: "Taxa de Recebimento",
      value: formatPercentage(taxaRecebimento),
      change:
        taxaRecebimento >= 80
          ? "Cobrança saudável"
          : taxaRecebimento >= 50
          ? "Atenção ao recebimento"
          : "Cobrança crítica",
      changeType:
        taxaRecebimento >= 80
          ? ("positive" as const)
          : taxaRecebimento >= 50
          ? ("neutral" as const)
          : ("negative" as const),
      icon: Percent,
      iconBg: "bg-black/[0.04] text-black dark:bg-muted dark:text-foreground",
    },
    {
      title: "Taxa de Inadimplência",
      value: formatPercentage(taxaInadimplencia),
      change:
        taxaInadimplencia <= 5
          ? "Inadimplência controlada"
          : taxaInadimplencia <= 15
          ? "Atenção à inadimplência"
          : "Inadimplência elevada",
      changeType:
        taxaInadimplencia <= 5
          ? ("positive" as const)
          : taxaInadimplencia <= 15
          ? ("neutral" as const)
          : ("negative" as const),
      icon: TrendingDown,
      iconBg: "bg-black/[0.04] text-black dark:bg-muted dark:text-foreground",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {summaryData.map((item) => (
        <FinancialSummaryCard
          key={item.title}
          title={item.title}
          value={item.value}
          change={item.change}
          changeType={item.changeType}
          secondaryInfo={item.secondaryInfo}
          icon={item.icon}
          iconBg={item.iconBg}
        />
      ))}
    </div>
  );
}