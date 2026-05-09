"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EduiaPanelShellProps {
  /** Coluna ao lado do conteúdo ou página dedicada. */
  layout?: "sidebar" | "page";
  /** Cabeçalho da página já contextualiza — oculta faixa duplicada. */
  chrome?: "full" | "minimal";
  /** Conteúdo à direita do título (ex.: botão maximizar). */
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function EduiaPanelShell({
  layout = "sidebar",
  chrome = "full",
  headerAction,
  children,
  className,
}: EduiaPanelShellProps) {
  const shell =
    layout === "sidebar" ?
      cn(
        "sticky top-20 z-10 flex h-[calc(100dvh-6rem)] min-h-[420px] flex-col overflow-hidden rounded-[26px] border border-border/55 bg-card text-card-foreground shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:border-border/40 dark:shadow-none",
        className
      )
    : cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-border/55 bg-card text-card-foreground shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:border-border/40 dark:shadow-none",
        className
      );

  return (
    <aside className={shell}>
      {chrome === "full" ?
        <header
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 border-b border-border/45 bg-muted/15 px-4 py-3.5 dark:bg-muted/10",
            layout === "page" && "px-5 py-4 sm:px-6"
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
              EduIA
            </h2>
            <span className="shrink-0 rounded-full border border-border/50 bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Assistente
            </span>
          </div>
          {headerAction ?
            <div className="flex shrink-0 items-center gap-2">{headerAction}</div>
          : null}
        </header>
      : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
        {children}
      </div>
    </aside>
  );
}
