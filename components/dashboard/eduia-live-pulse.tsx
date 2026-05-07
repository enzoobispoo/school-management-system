"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EduiaPulse } from "@/lib/dashboard/eduia-pulse";
import { EDUIA_FULL_BRIEFING_PROMPT } from "@/lib/dashboard/eduia-pulse";

interface EduiaLivePulseProps {
  pulse?: EduiaPulse | null;
  loading?: boolean;
  onAskEduia: (prompt: string) => void;
  className?: string;
}

export function EduiaLivePulse({
  pulse,
  loading,
  onAskEduia,
  className,
}: EduiaLivePulseProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-muted/25 p-3",
          className
        )}
      >
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-10 w-full animate-pulse rounded-lg bg-muted/80" />
      </div>
    );
  }

  if (!pulse) {
    return null;
  }

  const border =
    pulse.severity === "critical"
      ? "border-red-500/35 bg-red-500/[0.06] dark:bg-red-950/25"
      : pulse.severity === "attention"
        ? "border-amber-500/35 bg-amber-500/[0.06] dark:bg-amber-950/20"
        : "border-emerald-500/25 bg-emerald-500/[0.05] dark:bg-emerald-950/15";

  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-3 text-xs leading-snug shadow-sm",
        border,
        className
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
        <Sparkles className="h-3.5 w-3.5 text-foreground/70" />
        Pulse operacional
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-foreground">{pulse.headline}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 rounded-xl text-xs"
          onClick={() => onAskEduia(EDUIA_FULL_BRIEFING_PROMPT)}
        >
          Analisar com EduIA
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-xl text-xs"
          asChild
        >
          <Link href="/financeiro">Financeiro</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-xl text-xs"
          asChild
        >
          <Link href="/operacao">Operação</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-xl text-xs"
          asChild
        >
          <Link href="/notificacoes">Notificações</Link>
        </Button>
      </div>
    </div>
  );
}
