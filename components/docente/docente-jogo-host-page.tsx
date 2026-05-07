"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, SkipForward, Square } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { Button } from "@/components/ui/button";

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
    if (!res.ok) throw new Error(json.error || "Erro ao carregar sessão.");
    setSessao(json.sessao ?? null);
  }, [avaliacaoId]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

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
      if (!res.ok) throw new Error(json.error || "Não foi possível criar sessão.");
      setSessao(json.sessao);
      toast.success(
        tempoOpcao === "" ? "Sessão criada (sem cronômetro)." : "Sessão criada com cronômetro."
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro.");
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
      if (!res.ok) throw new Error(json.error || "Não foi possível atualizar sessão.");
      setSessao(json.sessao);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro.");
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
    return `${Math.ceil(leftMs / 1000)}s na rodada`;
  }, [sessao?.questaoDeadlineAt, sessao?.tempoPorQuestaoSegundos, sessao?.status, tick]);

  return (
    <DashboardLayout>
      <Header
        title="Sessão ao vivo da avaliação"
        description="Estilo quiz ao vivo: PIN para os alunos, apelidos, avatares e cronômetro opcional por questão."
      />
      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link href="/docente">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando sessão...</p>
          ) : !sessao ? (
            <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
              <p className="text-sm text-muted-foreground">
                Nenhuma sessão aberta para esta avaliação.
              </p>
              <div className="mt-4 grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">Cronômetro por questão</label>
                <select
                  className="flex h-11 w-full max-w-xs rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-sm"
                  value={tempoOpcao}
                  onChange={(e) => setTempoOpcao(e.target.value)}
                >
                  <option value="">Sem cronômetro</option>
                  <option value="10">10 segundos</option>
                  <option value="15">15 segundos</option>
                  <option value="20">20 segundos</option>
                  <option value="30">30 segundos</option>
                  <option value="45">45 segundos</option>
                  <option value="60">60 segundos</option>
                  <option value="90">90 segundos</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Os alunos escolhem avatar e apelido ao entrar. Quando o tempo acaba, a rodada fecha automaticamente.
                </p>
              </div>
              <Button className="mt-4 rounded-xl" onClick={() => void createSession()} disabled={busy}>
                Criar sessão ao vivo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-5 xl:col-span-2">
                <p className="text-xs text-muted-foreground">PIN da sala</p>
                <p className="mt-1 text-3xl font-semibold tracking-widest">{sessao.pin}</p>
                <p className="mt-2 text-xs text-muted-foreground break-all">{joinLink}</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Status: {sessao.status} · Questão atual: {sessao.questaoAtualOrdem}/
                  {sessao.avaliacao.totalQuestoes}
                  {sessao.tempoPorQuestaoSegundos ?
                    ` · ${sessao.tempoPorQuestaoSegundos}s por rodada`
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
                    Iniciar
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => void control("next")}
                    disabled={busy || sessao.status !== "RUNNING"}
                  >
                    <SkipForward className="mr-1.5 h-4 w-4" />
                    Próxima rodada
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => void control("finish")}
                    disabled={busy || sessao.status === "FINISHED"}
                  >
                    <Square className="mr-1.5 h-4 w-4" />
                    Encerrar
                  </Button>
                </div>
                <div className="mt-4 rounded-xl border border-border/60 bg-muted/10 p-3">
                  <p className="text-xs text-muted-foreground">Enunciado da rodada</p>
                  <p className="mt-1 text-sm font-medium">
                    {sessao.questaoAtual?.enunciado ?? "Aguardando início/encerrada."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <p className="text-sm font-semibold">Placar em tempo real</p>
                <div className="mt-3 space-y-2">
                  {sessao.ranking.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem participantes ainda.</p>
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
                        <span className="tabular-nums text-muted-foreground">{p.score} pts</span>
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
