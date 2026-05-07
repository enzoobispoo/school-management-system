"use client";

import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OverviewTurmaLike } from "@/components/docente/docente-dashboard-types";

interface DocenteQuickPanelProps {
  diaHojeLabel: string;
  turmas: OverviewTurmaLike[];
  needsLink: boolean;
  loading: boolean;
  className?: string;
  /** Quando false, painel acompanha o fluxo da página (ex.: coluna principal). */
  sticky?: boolean;
}

export function DocenteQuickPanel({
  diaHojeLabel,
  turmas,
  needsLink,
  loading,
  className,
  sticky = true,
}: DocenteQuickPanelProps) {
  const hoje = turmas.filter((t) => t.horariosHoje.length > 0);

  return (
    <aside
      className={cn(
        "flex flex-col gap-4 overflow-y-auto rounded-2xl border border-border/50 bg-card/70 p-4 text-card-foreground shadow-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-zinc-900/55",
        sticky &&
          "sticky top-20 z-10 max-h-[calc(100dvh-6rem)]",
        className
      )}
    >
      <div>
        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Resumo do dia
        </h3>
        <p className="mt-1 text-[13px] font-medium text-foreground">{diaHojeLabel}</p>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-14 rounded-lg bg-muted" />
          <div className="h-14 rounded-lg bg-muted" />
        </div>
      ) : needsLink ? (
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Associe sua conta ao cadastro de professor para ver horários e turmas
          aqui.
        </p>
      ) : hoje.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">
          Nenhuma turma com horário cadastrado para hoje.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {hoje.map((t) => (
            <li key={t.id}>
              <Link
                href={`/docente/turmas/${t.id}`}
                className={cn(
                  "flex items-start justify-between gap-2 rounded-lg border border-border/50 bg-muted/25 px-3 py-2 text-[12px]",
                  "transition-colors hover:bg-muted/45"
                )}
              >
                <span className="min-w-0 font-medium leading-snug text-foreground">
                  {t.nome}
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                    {t.horariosHoje.map((h) => `${h.horaInicio}–${h.horaFim}`).join(", ")}
                  </span>
                </span>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border/40 pt-3 dark:border-white/[0.06]">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/85">
          Atalhos
        </p>
        <div className="flex flex-col gap-1">
          <Link
            href="/calendario/eventos"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            Calendário
          </Link>
          <Link
            href="/notificacoes"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <Bell className="h-4 w-4 shrink-0" />
            Notificações
          </Link>
          <Link
            href="/mensagens"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            Mensagens
          </Link>
        </div>
      </div>

      {!needsLink && !loading ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Abra cada turma para ver alunos, disciplinas e registrar frequência.
        </p>
      ) : null}
    </aside>
  );
}
