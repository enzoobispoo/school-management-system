"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DocenteEduiaSidePanelProps {
  /** Nome completo ou primeiro nome (ex.: overview). */
  professorNome?: string | null;
  loading?: boolean;
  needsLink?: boolean;
  initialPrompt?: string;
  /** Coluna ao lado do conteúdo (dashboard) ou página dedicada. */
  layout?: "sidebar" | "page";
  /** Em página dedicada o cabeçalho da página já contextualiza — oculta faixa duplicada. */
  chrome?: "full" | "minimal";
  className?: string;
}

export function DocenteEduiaSidePanel({
  professorNome: professorNomeProp,
  loading = false,
  needsLink = false,
  initialPrompt = "",
  layout = "sidebar",
  chrome = "full",
  className,
}: DocenteEduiaSidePanelProps) {
  const [resolvedNome, setResolvedNome] = useState<string | null>(
    professorNomeProp ?? null
  );

  useEffect(() => {
    setResolvedNome(professorNomeProp ?? null);
  }, [professorNomeProp]);

  useEffect(() => {
    if (professorNomeProp?.trim()) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as { user?: { nome?: string } };
        if (!cancelled && typeof data.user?.nome === "string") {
          setResolvedNome(data.user.nome);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [professorNomeProp]);

  const displayNome =
    resolvedNome?.trim() ??
    (loading ? "…" : "Professor");

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

  const firstName = displayNome.split(/\s+/)[0] ?? displayNome;

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

          {layout === "sidebar" ?
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              asChild
              title="Abrir em tela cheia"
            >
              <Link href="/docente/eduia">
                <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>
          : null}
        </header>
      : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
        <AiAssistantPanel
          embedded
          variant="professor"
          professorDisplayName={firstName}
          professorNeedsLink={needsLink}
          initialPrompt={initialPrompt}
        />
      </div>
    </aside>
  );
}
