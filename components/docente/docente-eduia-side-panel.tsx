"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { AiAssistantPanel } from "@/components/dashboard/ai/ai-assistant-panel";
import { EduiaPanelShell } from "@/components/dashboard/ai/eduia-panel-shell";
import { Button } from "@/components/ui/button";

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

  const firstName = displayNome.split(/\s+/)[0] ?? displayNome;

  const maximizeAction =
    layout === "sidebar" ?
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
    : null;

  return (
    <EduiaPanelShell
      layout={layout}
      chrome={chrome}
      className={className}
      headerAction={maximizeAction}
    >
      <AiAssistantPanel
        embedded
        variant="professor"
        professorDisplayName={firstName}
        professorNeedsLink={needsLink}
        initialPrompt={initialPrompt}
      />
    </EduiaPanelShell>
  );
}
