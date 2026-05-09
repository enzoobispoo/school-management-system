"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, SkipForward, Square } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { Button } from "@/components/ui/button";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

type SessaoState = {
  id: string;
  pin: string;
  status: "LOBBY" | "RUNNING" | "FINISHED";
  tempoPorQuestaoSegundos: number | null;
  questaoDeadlineAt: string | null;
  avaliacao: { id: string; titulo: string; formato: string; totalQuestoes: number };
  questaoAtualOrdem: number;
  questaoAtual: { id: string; ordem: number; enunciado: string } | null;
  ranking: {
    posicao: number;
    id: string;
    nome: string;
    avatarEmoji?: string;
    score: number;
    respostasCount: number;
  }[];
};

export function DocenteJogoHostPage({ avaliacaoId }: { avaliacaoId: string }) {
  const { t } = useDashboardLanguage();
  const [sessao, setSessao] = useState<SessaoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tempoOpcao, setTempoOpcao] = useState<string>("20");
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/docente/avaliacoes/${avaliacaoId}/jogo/sessao`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || t("docente.jogoHost.loadSessionError"));
    setSessao(json.sessao ?? null);
  }, [avaliacaoId, t]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("common.errorShort"));
      } finally {
        setLoading(false);
      }
    })();
  }, [load, t]);

  useEffect(() => {
    if (!sessao) return;
    const timer = window.setInterval(() => {
      void load();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [sessao, load]);

  useEffect(() => {
    if (!sessao?.questaoDeadlineAt || sessao.status !== "RUNNING") return;
    const id = window.setInterval(() => setTick((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, [sessao?.questaoDeadlineAt, sessao?.status]);

  async function createSession() {
    try {
      setBusy(true);
      const tempoPorQuestaoSegundos =
        tempoOpcao === "" ? undefined : Number(tempoOpcao);
      const res = await fetch(`/api/docente/avaliacoes/${avaliacaoId}/jogo/sessao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          tempoOpcao === "" || Number.isNaN(tempoPorQuestaoSegundos) ?
            {}
          : { tempoPorQuestaoSegundos }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("docente.jogoHost.createSessionFail"));
      setSessao(json.sessao);
      toast.success(
        tempoOpcao === "" ?
          t("docente.jogoHost.sessionNoTimer")
        : t("docente.jogoHost.sessionWithTimer")
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.errorShort"));
    } finally {
      setBusy(false);
    }
  }

  async function control(action: "start" | "next" | "finish") {
    if (!sessao) return;
    try {
      setBusy(true);
      const res = await fetch(
        `/api/docente/avaliacoes/${avaliacaoId}/jogo/sessao/${sessao.id}/control`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("docente.jogoHost.updateSessionFail"));
      setSessao(json.sessao);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.errorShort"));
    } finally {
      setBusy(false);
    }
  }

  const joinLink = useMemo(
    () =>
      sessao ?
        `${typeof window !== "undefined" ? window.location.origin : ""}/jogo/${sessao.pin}`
      : "",
    [sessao]
  );

  const hostCountdown = useMemo(() => {
    if (
      !sessao?.questaoDeadlineAt ||
      !sessao.tempoPorQuestaoSegundos ||
      sessao.status !== "RUNNING"
    ) {
      return null;
    }
    const leftMs = Math.max(0, new Date(sessao.questaoDeadlineAt).getTime() - Date.now());
    const sec = Math.ceil(leftMs / 1000);
    return t("docente.jogoHost.roundSecondsLeft", { n: String(sec) });
  }, [sessao?.questaoDeadlineAt, sessao?.tempoPorQuestaoSegundos, sessao?.status, tick, t]);

  const statusHuman = useMemo(() => {
    if (!sessao) return "";
    if (sessao.status === "LOBBY") return t("docente.jogoHost.statusLobby");
    if (sessao.status === "RUNNING") return t("docente.jogoHost.statusRunning");
    return t("docente.jogoHost.statusFinished");
  }, [sessao, t]);

  const TIMER_OPTIONS = useMemo(
    () => ["10", "15", "20", "30", "45", "60", "90"],
    []
  );

  return (
    <DashboardLayout>
      <Header
        title={t("docente.jogoHost.pageTitle")}
        description={t("docente.jogoHost.pageDescription")}
      />
      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link href="/docente">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("docente.jogoHost.back")}
            </Link>
          </Button>

          {loading ? (
            <p className="text-sm text-muted-foreground">{t("docente.jogoHost.loadingSession")}</p>
          ) : !sessao ? (
            <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <p className="text-sm text-muted-foreground">{t("docente.jogoHost.noSession")}</p>
              <div className="mt-4 grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("docente.jogoHost.timerPerQuestion")}
                </label>
                <select
                  className="flex h-11 w-full max-w-xs rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-sm"
                  value={tempoOpcao}
                  onChange={(e) => setTempoOpcao(e.target.value)}
                >
                  <option value="">{t("docente.jogoHost.timerNone")}</option>
                  {TIMER_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {t("docente.jogoHost.timerSeconds", { n: sec })}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{t("docente.jogoHost.hintAvatar")}</p>
              </div>
              <Button className="mt-4 rounded-xl" onClick={() => void createSession()} disabled={busy}>
                {t("docente.jogoHost.createSession")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-5 xl:col-span-2">
                <p className="text-xs text-muted-foreground">{t("docente.jogoHost.pinLabel")}</p>
                <p className="mt-1 text-3xl font-semibold tracking-widest">{sessao.pin}</p>
                <p className="mt-2 text-xs text-muted-foreground break-all">{joinLink}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("docente.jogoHost.statusLabel")}: {statusHuman} · {t("docente.jogoHost.currentQuestion")}:{" "}
                  {sessao.questaoAtualOrdem}/{sessao.avaliacao.totalQuestoes}
                  {sessao.tempoPorQuestaoSegundos ?
                    ` · ${t("docente.jogoHost.secondsPerRound", {
                      n: String(sessao.tempoPorQuestaoSegundos),
                    })}`
                  : ""}
                </p>
                {hostCountdown ?
                  <p className="mt-2 text-sm font-medium text-primary">{hostCountdown}</p>
                : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => void control("start")}
                    disabled={busy || sessao.status !== "LOBBY"}
                  >
                    <Play className="mr-1.5 h-4 w-4" />
                    {t("docente.jogoHost.start")}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => void control("next")}
                    disabled={busy || sessao.status !== "RUNNING"}
                  >
                    <SkipForward className="mr-1.5 h-4 w-4" />
                    {t("docente.jogoHost.nextRound")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => void control("finish")}
                    disabled={busy || sessao.status === "FINISHED"}
                  >
                    <Square className="mr-1.5 h-4 w-4" />
                    {t("docente.jogoHost.finish")}
                  </Button>
                </div>
                <div className="mt-4 rounded-xl border border-border/60 bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">{t("docente.jogoHost.roundStatement")}</p>
                  <p className="mt-1 text-sm font-medium">
                    {sessao.questaoAtual?.enunciado ?? t("docente.jogoHost.waitingStatement")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <p className="text-sm font-semibold">{t("docente.jogoHost.liveLeaderboard")}</p>
                <div className="mt-3 space-y-2">
                  {sessao.ranking.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("docente.jogoHost.noParticipants")}</p>
                  ) : (
                    sessao.ranking.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-sm"
                      >
                        <span className="text-lg">{p.avatarEmoji ?? "🎓"}</span>
                        <span className="flex-1 truncate">
                          {p.posicao}. {p.nome}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {t("game.player.points", { score: String(p.score) })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
