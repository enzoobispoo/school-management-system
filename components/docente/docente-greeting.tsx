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
  /** Saudação mais destacada (tipo dashboard “welcome back”). */
  welcomeStyle?: "default" | "studio";
  footer?: ReactNode;
}) {
  const {
    professorNome,
    diaHojeLabel,
    needsLink,
    loading,
    className,
    variant = "card",
    welcomeStyle = "default",
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
          variant === "workspace" && welcomeStyle === "studio" &&
            "font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400",
          variant === "workspace" && welcomeStyle !== "studio" &&
            "font-mono font-medium",
          variant !== "workspace" &&
            "font-semibold tracking-[0.14em] text-muted-foreground/70"
        )}
      >
        {welcomeStyle === "studio" && variant === "workspace" ? "Painel" : "Saudação"}
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
              variant === "workspace" && welcomeStyle === "studio" &&
                "text-[1.75rem] font-bold leading-tight text-zinc-950 dark:text-white sm:text-[2rem]",
              variant === "workspace" && welcomeStyle !== "studio" &&
                "text-2xl font-semibold sm:text-[1.65rem]",
              variant !== "workspace" && "text-lg font-semibold"
            )}
          >
            {saudacao}, {primeiroNome}.
          </p>
          <p
            className={cn(
              "text-[13px] text-muted-foreground",
              welcomeStyle === "studio" && variant === "workspace" &&
                "mt-2 font-sans text-zinc-600 dark:text-zinc-400",
              !(welcomeStyle === "studio" && variant === "workspace") &&
                "mt-1 font-mono text-[12px]"
            )}
          >
            {welcomeStyle === "studio" && variant === "workspace" ? (
              <>
                Sua rotina de{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {diaHojeLabel}
                </span>
              </>
            ) : (
              <>
                Hoje · <span className="text-foreground/85">{diaHojeLabel}</span>
              </>
            )}
          </p>
        </>
      )}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
}
