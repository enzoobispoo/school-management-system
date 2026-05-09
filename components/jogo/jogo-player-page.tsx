"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { JOGO_AVATAR_EMOJIS } from "@/lib/jogo/jogo-avatars";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

type RankingRow = {
  posicao: number;
  id: string;
  nome: string;
  avatarEmoji?: string;
  score: number;
};

type PlayerState = {
  sessao: {
    id: string;
    status: "LOBBY" | "RUNNING" | "FINISHED";
    avaliacao: { titulo: string; totalQuestoes: number };
    questaoAtualOrdem: number;
    tempoPorQuestaoSegundos: number | null;
    questaoDeadlineAt: string | null;
    questaoAtual: {
      id: string;
      ordem: number;
      enunciado: string;
      pontos: number;
      alternativas: { id: string; ordem: number; texto: string }[];
    } | null;
    ranking: RankingRow[];
  };
  participante: {
    id: string;
    nome: string;
    score: number;
    jaRespondeu: boolean;
  } | null;
};

export function JogoPlayerPage({ pin }: { pin: string }) {
  const { t } = useDashboardLanguage();
  const [nome, setNome] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState<string>(JOGO_AVATAR_EMOJIS[0] ?? "🎓");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [sending, setSending] = useState(false);
  const [tick, setTick] = useState(0);
  const timeoutHandledRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!participantId) return;
    const params = new URLSearchParams({ pin, participantId });
    const res = await fetch(`/api/jogo/state?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || t("game.player.loadStateFail"));
    setState(json as PlayerState);
  }, [participantId, pin, t]);

  useEffect(() => {
    if (!participantId) return;
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [participantId, load]);

  useEffect(() => {
    const dl = state?.sessao.questaoDeadlineAt;
    if (!dl || state?.sessao.status !== "RUNNING") return;
    const id = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [state?.sessao.questaoDeadlineAt, state?.sessao.status]);

  useEffect(() => {
    timeoutHandledRef.current = null;
  }, [state?.sessao.questaoAtualOrdem]);

  const submitTimeout = useCallback(async () => {
    if (!participantId || !state?.sessao.questaoAtual) return;
    const qid = state.sessao.questaoAtual.id;
    if (state.participante?.jaRespondeu) return;
    if (timeoutHandledRef.current === qid) return;
    timeoutHandledRef.current = qid;
    try {
      const res = await fetch("/api/jogo/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          questaoId: qid,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        timeoutHandledRef.current = null;
        throw new Error(json.error || t("game.player.timeoutRegisterFail"));
      }
      toast.message(t("game.player.timeUpToast"));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.errorShort"));
    }
  }, [
    load,
    participantId,
    state?.sessao.questaoAtual,
    state?.participante?.jaRespondeu,
    t,
  ]);

  useEffect(() => {
    if (!participantId || !state?.sessao.questaoDeadlineAt) return;
    if (state.sessao.status !== "RUNNING" || state.participante?.jaRespondeu) return;
    const qid = state.sessao.questaoAtual?.id;
    if (!qid) return;
    const msLeft = new Date(state.sessao.questaoDeadlineAt).getTime() - Date.now();
    if (msLeft > 1200) return;
    void submitTimeout();
  }, [
    participantId,
    state?.sessao.questaoDeadlineAt,
    state?.sessao.status,
    state?.sessao.questaoAtual?.id,
    state?.participante?.jaRespondeu,
    submitTimeout,
    tick,
  ]);

  async function join() {
    try {
      const res = await fetch("/api/jogo/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, nome, avatarEmoji }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("game.player.joinFail"));
      setParticipantId(json.participantId as string);
      setState(json as PlayerState);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.errorShort"));
    }
  }

  async function responder(alternativaId: string) {
    if (!participantId || !state?.sessao.questaoAtual) return;
    try {
      setSending(true);
      const res = await fetch("/api/jogo/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          questaoId: state.sessao.questaoAtual.id,
          alternativaId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("game.player.answerFail"));
      toast.success(
        json.correta ?
          t("game.player.correctPoints", { points: String(json.pontos ?? 0) })
        : t("game.player.answerSent")
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.errorShort"));
    } finally {
      setSending(false);
    }
  }

  const { countdownPct, countdownLabel } = useMemo(() => {
    if (
      !state?.sessao.questaoDeadlineAt ||
      !state.sessao.tempoPorQuestaoSegundos ||
      state.sessao.status !== "RUNNING" ||
      !state.sessao.questaoAtual ||
      state.participante?.jaRespondeu
    ) {
      return { countdownPct: 0, countdownLabel: null as string | null };
    }
    const totalMs = state.sessao.tempoPorQuestaoSegundos * 1000;
    const leftMs = Math.max(
      0,
      new Date(state.sessao.questaoDeadlineAt).getTime() - Date.now()
    );
    return {
      countdownPct: Math.min(100, Math.round((leftMs / totalMs) * 100)),
      countdownLabel: `${Math.ceil(leftMs / 1000)}s`,
    };
  }, [
    state?.sessao.questaoDeadlineAt,
    state?.sessao.tempoPorQuestaoSegundos,
    state?.sessao.status,
    state?.sessao.questaoAtual,
    state?.participante?.jaRespondeu,
    tick,
  ]);

  if (!participantId) {
    return (
      <main className="mx-auto max-w-md p-6">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <p className="text-xs text-muted-foreground">{t("game.player.enterRoom")}</p>
          <p className="mt-1 text-2xl font-semibold tracking-widest">{pin}</p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">{t("game.player.pickAvatar")}</p>
              <div className="grid grid-cols-8 gap-1.5">
                {JOGO_AVATAR_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`flex h-9 items-center justify-center rounded-lg border text-lg transition-colors ${
                      avatarEmoji === em ?
                        "border-primary bg-primary/15"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40"
                    }`}
                    onClick={() => setAvatarEmoji(em)}
                    aria-label={t("game.player.avatarAria", { emoji: em })}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">{t("game.player.nicknameLabel")}</p>
              <Input
                placeholder={t("game.player.nicknamePlaceholder")}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button className="w-full rounded-xl" disabled={!nome.trim()} onClick={() => void join()}>
              {t("game.player.joinGame")}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
        <span className="text-3xl leading-none">{avatarEmoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{state?.sessao.avaliacao.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {state ?
              t("game.player.metaLine", {
                name: state.participante?.nome ?? "",
                current: String(state.sessao.questaoAtualOrdem),
                total: String(state.sessao.avaliacao.totalQuestoes),
                score: String(state.participante?.score ?? 0),
              })
            : null}
          </p>
        </div>
      </div>

      {countdownLabel ?
        <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{t("game.player.roundTime")}</span>
            <span className="tabular-nums text-foreground">{countdownLabel}</span>
          </div>
          <Progress value={countdownPct} className="mt-2 h-2" />
        </div>
      : null}

      <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
        {state?.sessao.status === "LOBBY" ?
          <p className="text-sm text-muted-foreground">{t("game.player.waitTeacher")}</p>
        : state?.sessao.status === "FINISHED" ?
          <p className="text-sm text-muted-foreground">{t("game.player.sessionDone")}</p>
        : !state?.sessao.questaoAtual ?
          <p className="text-sm text-muted-foreground">{t("game.player.loadingQuestion")}</p>
        : state?.participante?.jaRespondeu ?
          <p className="text-sm text-muted-foreground">{t("game.player.answerSentWait")}</p>
        : (
          <div className="space-y-3">
            <p className="font-medium">{state.sessao.questaoAtual.enunciado}</p>
            {state.sessao.questaoAtual.alternativas.map((alt) => (
              <Button
                key={alt.id}
                variant="outline"
                className="h-auto w-full justify-start rounded-xl py-3 text-left"
                disabled={sending}
                onClick={() => void responder(alt.id)}
              >
                <span className="font-semibold">{alt.ordem}.</span>
                <span className="ml-2">{alt.texto}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
        <p className="text-sm font-semibold">{t("game.player.leaderboard")}</p>
        <div className="mt-2 space-y-2">
          {(state?.sessao.ranking ?? []).slice(0, 10).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/10 px-3 py-2 text-sm"
            >
              <span className="text-lg">{r.avatarEmoji ?? "🎓"}</span>
              <span className="flex-1 truncate">
                {r.posicao}. {r.nome}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {t("game.player.points", { score: String(r.score) })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
