"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function saudacaoPorHora(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function DocenteGreeting(props: {
  professorNome: string | null | undefined;
  diaHojeLabel: string;
  needsLink: boolean;
  loading: boolean;
  className?: string;
  /** `workspace` integra ao hero estilo painel tipo Cursor (menos “card”). */
  variant?: "card" | "workspace";
  footer?: ReactNode;
}) {
  const {
    professorNome,
    diaHojeLabel,
    needsLink,
    loading,
    className,
    variant = "card",
    footer,
  } = props;

  const primeiroNome =
    professorNome?.trim().split(/\s+/).filter(Boolean)[0] ?? "Professor";

  const [saudacao, setSaudacao] = useState("Olá");
  useEffect(() => {
    setSaudacao(saudacaoPorHora(new Date()));
  }, []);

  return (
    <section
      className={cn(
        variant === "workspace" ?
          "rounded-xl px-1 py-0"
        : "rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.06] via-card to-card px-5 py-4 shadow-sm",
        className
      )}
    >
      <p
        className={cn(
          "text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80",
          variant === "workspace" ?
            "font-mono font-medium"
          : "font-semibold tracking-[0.14em] text-muted-foreground/70"
        )}
      >
        Saudação
      </p>
      {loading ? (
        <p className="mt-1 text-sm text-muted-foreground">Carregando…</p>
      ) : needsLink ? (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Assim que sua conta estiver vinculada ao cadastro de professor,
          personalizamos esta área com seu nome e turmas.
        </p>
      ) : (
        <>
          <p
            className={cn(
              "mt-1 tracking-tight text-foreground",
              variant === "workspace" ?
                "text-2xl font-semibold sm:text-[1.65rem]"
              : "text-lg font-semibold"
            )}
          >
            {saudacao}, {primeiroNome}.
          </p>
          <p className="mt-1 font-mono text-[12px] text-muted-foreground">
            Hoje · <span className="text-foreground/85">{diaHojeLabel}</span>
          </p>
        </>
      )}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
}
