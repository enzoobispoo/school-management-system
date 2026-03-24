"use client";

import { TrendingUp, Users, Wallet, Target } from "lucide-react";
import { InsightCard } from "@/components/relatorios/summary/insight-card";

interface InsightsCardsProps {
  insights?: {
    annualGrowth: number;
    retentionRate: number;
    averageTicket: number;
    monthlyGoalRate: number;
    monthlyReceived: number;
    monthlyGoalTarget: number;
  };
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function InsightsCards({ insights }: InsightsCardsProps) {
  const data = [
    {
      title: "Crescimento Anual",
      value: `${(insights?.annualGrowth ?? 0).toFixed(1).replace(".", ",")}%`,
      description: "Aumento no número de alunos em relação ao ano anterior",
      icon: TrendingUp,
      iconBg: "bg-black/[0.04] text-black",
    },
    {
      title: "Taxa de Retenção",
      value: `${(insights?.retentionRate ?? 0).toFixed(1).replace(".", ",")}%`,
      description: "Alunos que renovaram matrícula nos últimos 12 meses",
      icon: Users,
      iconBg: "bg-black/[0.04] text-black",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(insights?.averageTicket ?? 0),
      description: "Valor médio de mensalidade por aluno",
      icon: Wallet,
      iconBg: "bg-black/[0.04] text-black",
    },
    {
      title: "Meta Mensal",
      value: `${Math.round(insights?.monthlyGoalRate ?? 0)}%`,
      description: `${formatCurrency(
        insights?.monthlyReceived ?? 0
      )} de ${formatCurrency(insights?.monthlyGoalTarget ?? 0)} atingidos`,
      icon: Target,
      iconBg: "bg-black/[0.04] text-black",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {data.map((insight) => (
        <InsightCard
          key={insight.title}
          title={insight.title}
          value={insight.value}
          description={insight.description}
          icon={insight.icon}
          iconBg={insight.iconBg}
        />
      ))}
    </div>
  );
}