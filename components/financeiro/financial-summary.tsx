"use client";

import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";
import { FinancialSummaryCard } from "@/components/financeiro/summary/financial-summary-card";

interface FinancialSummaryProps {
  receitaTotal: number;
  recebidoMes: number;
  valoresPendentes: number;
  valoresAtrasados: number;
  quantidadePendentes: number;
  quantidadeAtrasados: number;
}

const formatCurrency = (value: number) =>
  `R$ ${value.toFixed(2).replace(".", ",")}`;

export function FinancialSummary({
  receitaTotal,
  recebidoMes,
  valoresPendentes,
  valoresAtrasados,
  quantidadePendentes,
  quantidadeAtrasados,
}: FinancialSummaryProps) {
  const summaryData = [
    {
      title: "Receita Total",
      value: formatCurrency(receitaTotal),
      change: "Total recebido",
      changeType: "positive" as const,
      icon: DollarSign,
      iconBg: "bg-black/[0.04] text-black",
    },
    {
      title: "Recebido este mês",
      value: formatCurrency(recebidoMes),
      change: "Pagamentos confirmados",
      changeType: "positive" as const,
      icon: TrendingUp,
      iconBg: "bg-black/[0.04] text-black",
    },
    {
      title: "Valores Pendentes",
      value: formatCurrency(valoresPendentes),
      change: `${quantidadePendentes} pendente(s)`,
      changeType: "neutral" as const,
      icon: Clock,
      iconBg: "bg-black/[0.04] text-black",
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
      iconBg: "bg-black/[0.04] text-black",
      secondaryInfo:
        quantidadePendentes > 0
          ? `${quantidadePendentes} pendente(s)`
          : undefined,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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