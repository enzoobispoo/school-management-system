"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileStack,
  Mic,
  Paperclip,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiChatMessage } from "@/components/dashboard/ai/ai-chat-message";
import { AiQuickPrompts } from "@/components/dashboard/ai/ai-quick-prompts";
import { useDashboardAi } from "@/hooks/dashboard/use-dashboard-ai";
import type { DashboardMetricsView } from "@/components/dashboard/metrics/dashboard-metric-card-config";
import { buildEduiaPulseFromMetrics } from "@/lib/dashboard/eduia-pulse";
import { EduiaLivePulse } from "@/components/dashboard/eduia-live-pulse";
import { DOCENTE_JARVIS_PILLS } from "@/lib/ai/docente-jarvis-context";
import { cn } from "@/lib/utils";

const JARVIS_PILL_ICONS = [
  ClipboardList,
  Users,
  Bell,
  CalendarDays,
  FileStack,
] as const;

interface AiAssistantPanelProps {
  embedded?: boolean;
  initialPrompt?: string;
  /** Copiloto executivo (escola) vs workspace docente. */
  variant?: "executive" | "professor";
  /** Primeiro nome ou apelido para saudação (modo docente). */
  professorDisplayName?: string;
  professorNeedsLink?: boolean;
  /** Quando vindo do dashboard, alimenta o pulse sem nova requisição. */
  dashboardMetrics?: DashboardMetricsView | null;
  dashboardMetricsLoading?: boolean;
  dashboardMetricsError?: boolean;
}

export function AiAssistantPanel({
  embedded = false,
  initialPrompt = "",
  variant = "executive",
  professorDisplayName,
  professorNeedsLink = false,
  dashboardMetrics = null,
  dashboardMetricsLoading = false,
  dashboardMetricsError = false,
}: AiAssistantPanelProps) {
  const router = useRouter();
  const {
    messages,
    input,
    setInput,
    loading,
    isTyping,
    sendMessage,
    stopResponse,
    clearMessages,
    typingRef,
    setIsTyping,
  } = useDashboardAi();

  /** Área rolável do histórico — não usar scrollIntoView aqui (rolava o viewport inteiro). */
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const hasSentInitialPrompt = useRef(false);

  const isProfessorJarvis = embedded && variant === "professor";

  const shortProfessorName =
    professorDisplayName?.trim()?.split(/\s+/)[0] ?? "Professor";

  const pulse = useMemo(() => {
    if (
      dashboardMetrics == null ||
      dashboardMetricsLoading ||
      dashboardMetricsError
    ) {
      return null;
    }
    return buildEduiaPulseFromMetrics(dashboardMetrics);
  }, [
    dashboardMetrics,
    dashboardMetricsLoading,
    dashboardMetricsError,
  ]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const root = scrollAreaRef.current;
    if (!root) return;
    root.scrollTo({
      top: root.scrollHeight,
      behavior: behavior === "smooth" ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (messages.length === 0 && !loading) return;
    scrollToBottom("smooth");
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!initialPrompt.trim()) return;
    if (hasSentInitialPrompt.current) return;

    hasSentInitialPrompt.current = true;
    sendMessage(initialPrompt);

    const url = new URL(window.location.href);
    url.searchParams.delete("ai");
    router.replace(url.pathname + url.search);
  }, [initialPrompt, sendMessage, router]);

  return (
    <div
      className={
        embedded
          ? cn(
              "flex h-full min-h-0 flex-col overflow-hidden",
              isProfessorJarvis && "gap-1"
            )
          : "flex min-h-[520px] flex-col overflow-hidden rounded-[28px] border border-border bg-card p-5 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      }
    >
      {!embedded ? (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              EduIA · Copiloto escolar
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Consulta o sistema por você, cruza financeiro, turmas e operação e sugere o próximo passo — sempre com dados reais.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={clearMessages}
          >
            Limpar
          </Button>
        </div>
      ) : null}

      {!embedded ? null : isProfessorJarvis ? (
        messages.length > 0 ?
          <div className="flex shrink-0 justify-end px-0.5 pb-1">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              onClick={clearMessages}
            >
              Nova conversa
            </Button>
          </div>
        : null
      ) : (
        <div className="mb-2 shrink-0 px-0.5">
          <h4 className="text-base font-semibold leading-snug tracking-tight text-foreground">
            À sua disposição
          </h4>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            Pergunte ou use um atalho abaixo — os dados vêm do sistema.
          </p>
        </div>
      )}

      {!embedded ? (
        <div className="mb-4">
          <h4 className="text-[26px] font-semibold leading-8 tracking-[-0.04em] text-foreground">
            À sua disposição
          </h4>
          <p className="mt-2 text-sm text-muted-foreground">
            Fale como com um braço direito da gestão: cobranças, matrículas, capacidade, incidentes, boletins — eu consulto e organizo por prioridade.
          </p>
        </div>
      ) : null}

      <div
        ref={scrollAreaRef}
        className={
          isProfessorJarvis ?
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-[24px] border border-border/45 bg-muted/20 p-4 dark:bg-muted/10"
          : embedded ?
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-border/80 bg-muted/35 p-3"
          : "min-h-0 flex-1 overflow-y-auto rounded-[24px] bg-muted/40 p-4"
        }
      >
        <div className={cn("space-y-4", isProfessorJarvis && messages.length === 0 && "space-y-0")}>
          {messages.length === 0 ?
            isProfessorJarvis ?
              <div className="flex min-h-[min(100%,460px)] flex-col pb-2">
                <div className="flex flex-1 flex-col items-center justify-center px-1 pb-8 pt-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                    Assistente do workspace
                  </p>
                  <h3 className="mt-4 max-w-[17rem] text-[21px] font-semibold leading-[1.25] tracking-[-0.035em] text-foreground sm:text-[23px]">
                    Como posso ajudar, {shortProfessorName}?
                  </h3>
                  <p className="mt-3 max-w-[18rem] text-[12px] leading-relaxed text-muted-foreground">
                    {professorNeedsLink ?
                      "Associe sua conta ao cadastro de professor para eu consultar suas turmas e responder com dados da escola."
                    : "Vejo suas turmas como titular, avisos institucionais e ajudo a montar avaliações — com confirmação antes de gravar qualquer registro."}
                  </p>

                  <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                    {DOCENTE_JARVIS_PILLS.map((pill, i) => {
                      const Icon = JARVIS_PILL_ICONS[i] ?? ClipboardList;
                      return (
                        <button
                          key={pill.label}
                          type="button"
                          onClick={() => sendMessage(pill.prompt)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border border-border/55 bg-card px-3 py-2 text-[11px] font-medium text-foreground",
                            "shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-muted/70 dark:border-border/40 dark:bg-card/80"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 opacity-70" />
                          {pill.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto space-y-3 border-t border-border/40 pt-4">
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                    Sugestões rápidas
                  </p>
                  <AiQuickPrompts
                    preset="professor"
                    presentation="jarvis"
                    onSelect={sendMessage}
                  />
                </div>
              </div>
            : <>
                <p className="text-[13px] text-muted-foreground">
                  Pergunte em linguagem natural ou toque em um atalho.
                </p>
                {dashboardMetrics != null && !dashboardMetricsError ?
                  <EduiaLivePulse
                    loading={dashboardMetricsLoading}
                    pulse={pulse}
                    onAskEduia={sendMessage}
                  />
                : null}
                <AiQuickPrompts onSelect={sendMessage} />
              </>

          : messages.map((message) => (
              <AiChatMessage
                key={message.id}
                message={message}
                typingRef={typingRef}
                setIsTyping={setIsTyping}
                onSelectSuggestion={sendMessage}
                onTypingProgress={() => scrollToBottom("auto")}
              />
            ))
          }

          {loading ?
            <div
              className={cn(
                "max-w-[90%] rounded-2xl border px-4 py-3 text-sm text-muted-foreground",
                isProfessorJarvis ?
                  "border-border/50 bg-card/60"
                : "border-border"
              )}
            >
              {isProfessorJarvis ?
                "Consultando suas turmas e o contexto da escola…"
              : "Consultando o sistema e cruzando os dados…"}
            </div>
          : null}
        </div>
      </div>

      {isProfessorJarvis ?
        <div className="mt-2 shrink-0 px-0.5 pb-0.5 pt-1">
          <div className="flex items-center gap-1 rounded-[22px] border border-border/60 bg-muted/35 p-1.5 pl-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:bg-muted/25">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              title="Entrada por voz em breve"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
            >
              <Mic className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              title="Anexos em breve"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
            >
              <Paperclip className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Button>
            <Input
              placeholder="Em que posso ajudar hoje?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-10 min-w-0 flex-1 border-0 bg-transparent px-2 text-[13px] shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading && !isTyping) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            {loading || isTyping ?
              <Button
                type="button"
                onClick={stopResponse}
                className="h-9 w-9 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
              >
                <span className="block h-2.5 w-2.5 rounded-[2px] bg-background" />
              </Button>
            : <Button
                type="button"
                onClick={() => sendMessage()}
                className="h-9 shrink-0 rounded-full bg-foreground px-5 text-[12px] font-semibold text-background hover:bg-foreground/90"
              >
                Enviar
              </Button>}
          </div>
        </div>
      : <div
          className={
            embedded ? "mt-2 shrink-0 flex gap-2 pt-1" : "mt-4 flex gap-2"
          }
        >
          <Input
            placeholder={
              variant === "professor" ?
                "Ex.: minhas turmas e disciplinas; planejar prova de História…"
              : "Ex.: briefing do dia; turmas lotadas; quem está inadimplente?"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-11 rounded-2xl"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && !isTyping) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          {loading || isTyping ?
            <Button
              onClick={stopResponse}
              className="h-11 w-11 shrink-0 rounded-2xl bg-primary text-primary-foreground hover:opacity-90"
            >
              <span className="block h-3 w-3 rounded-[2px] bg-current" />
            </Button>
          : <Button
              onClick={() => sendMessage()}
              className="h-11 shrink-0 rounded-2xl px-5"
            >
              Enviar
            </Button>}
        </div>}
    </div>
  );
}
