"use client";

import { useEffect, useState } from "react";
import { FileWarning, HandCoins, Receipt, UserX, Wallet } from "lucide-react";

type Resumo = {
  contasPagarPendentesValor: unknown;
  contasPagarPendentesQtd: number;
  contasPagarVencendo7d: number;
  negociacoesAbertas: number;
  professoresSemPerfilFinanceiro: number;
  notasRascunho: number;
  matriculasAtivasSemContratoFinanceiro: number;
};

function money(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function FinanceiroProfessionalSummary() {
  const [data, setData] = useState<Resumo | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/financeiro/painel-profissional/resumo", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setData(d as Resumo);
      })
      .catch(() => {
        if (!cancelled) setErr(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err || !data) return null;

  const cards = [
    {
      label: "Contas a pagar (pendentes)",
      value: money(data.contasPagarPendentesValor),
      hint: `${data.contasPagarPendentesQtd} lançamento(s)`,
      icon: Wallet,
    },
    {
      label: "Vencendo em 7 dias",
      value: String(data.contasPagarVencendo7d),
      hint: "Contas a pagar",
      icon: Receipt,
    },
    {
      label: "Negociações abertas",
      value: String(data.negociacoesAbertas),
      hint: "Mensalidades",
      icon: HandCoins,
    },
    {
      label: "Professores sem perfil financeiro",
      value: String(data.professoresSemPerfilFinanceiro),
      hint: "CLT / PJ",
      icon: UserX,
    },
    {
      label: "Documentos em rascunho",
      value: String(data.notasRascunho),
      hint: "Fiscal interno",
      icon: FileWarning,
    },
    {
      label: "Matrículas sem contrato financeiro",
      value: String(data.matriculasAtivasSemContratoFinanceiro),
      hint: "Campos opcionais na matrícula",
      icon: FileWarning,
    },
  ];

  return (
    <section className="rounded-2xl border border-border/60 bg-muted/15 px-4 py-4 dark:bg-muted/10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Governança financeira
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Indicadores operacionais do módulo ampliado (contas a pagar, contratos, professores e
        documentos).
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-xl border border-border/50 bg-card/80 px-3 py-3 dark:bg-card/40"
            >
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />
                {c.label}
              </div>
              <p className="mt-2 text-lg font-semibold tabular-nums">{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.hint}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
