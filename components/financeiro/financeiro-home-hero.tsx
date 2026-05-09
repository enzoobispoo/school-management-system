"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingDown, Clock, Percent } from "lucide-react";
import { useDashboardSessionOptional } from "@/components/providers/dashboard-session-provider";

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function firstName(fullName: string) {
  const t = fullName.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] ?? t;
}

interface FinanceiroHomeHeroProps {
  loadingTotals: boolean;
  recebidoMes: number;
  valoresAtrasados: number;
  quantidadeAtrasados: number;
  valoresPendentes: number;
  quantidadePendentes: number;
  taxaInadimplencia: number;
}

export function FinanceiroHomeHero({
  loadingTotals,
  recebidoMes,
  valoresAtrasados,
  quantidadeAtrasados,
  valoresPendentes,
  quantidadePendentes,
  taxaInadimplencia,
}: FinanceiroHomeHeroProps) {
  const sessionOpt = useDashboardSessionOptional();
  const [nomeCompleto, setNomeCompleto] = useState<string | null>(null);

  useEffect(() => {
    if (
      sessionOpt &&
      !sessionOpt.loading &&
      typeof sessionOpt.user?.nome === "string" &&
      sessionOpt.user.nome.trim()
    ) {
      setNomeCompleto(sessionOpt.user.nome);
      return;
    }

    if (sessionOpt?.loading) return;

    let cancelled = false;
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user?: { nome?: string } }) => {
        if (
          !cancelled &&
          typeof d.user?.nome === "string" &&
          d.user.nome.trim()
        ) {
          setNomeCompleto(d.user.nome);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionOpt?.loading, sessionOpt?.user?.nome]);

  const nome = nomeCompleto ? firstName(nomeCompleto) : null;

  const mini = [
    {
      label: "Recebido no mês",
      value: loadingTotals ? "—" : formatCurrency(recebidoMes),
      hint: "Confirmados no mês corrente",
      icon: Wallet,
    },
    {
      label: "Em atraso",
      value: loadingTotals ? "—" : formatCurrency(valoresAtrasados),
      hint:
        loadingTotals ?
          "—"
        : `${quantidadeAtrasados} cobrança(ões)`,
      icon: TrendingDown,
    },
    {
      label: "Pendentes",
      value: loadingTotals ? "—" : formatCurrency(valoresPendentes),
      hint:
        loadingTotals ?
          "—"
        : `${quantidadePendentes} em aberto`,
      icon: Clock,
    },
    {
      label: "Inadimplência",
      value: loadingTotals ? "—" : formatPercentage(taxaInadimplencia),
      hint: "Sobre carteira ativa",
      icon: Percent,
    },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-border/70 bg-gradient-to-br from-muted/45 via-background to-background px-5 py-5 shadow-sm dark:from-muted/12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
        Seu painel financeiro
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {nome ? (
          <>
            Olá,{" "}
            <span className="text-foreground">{nome}</span>
          </>
        ) : (
          "Olá"
        )}
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        Acompanhe recebimentos, pendências e inadimplência. Os números abaixo
        refletem apenas a sua escola e o que você pode operar neste perfil.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {mini.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-border/60 bg-card/90 px-4 py-3 dark:bg-card/40"
            >
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />
                {item.label}
              </div>
              <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                {item.value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {item.hint}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
