"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TrocaRow = {
  id: string;
  createdAt: string;
  dataInicioPrevista: string;
  motivoTroca: string | null;
  observacoes: string | null;
  resumoTurma: string | null;
  resumoHorarios: string | null;
  turma: {
    id: string;
    nome: string;
    cursoNome: string;
    horarios: {
      diaSemana: string;
      diaLabel: string;
      horaInicio: string;
      horaFim: string;
    }[];
  };
  professorAnterior: { id: string; nome: string };
};

export function DocenteTrocasPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("proposta") || "";

  const [rows, setRows] = useState<TrocaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/docente/trocas-pendentes", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar.");
      setRows((json.data || []) as TrocaRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!highlightId || loading) return;
    requestAnimationFrame(() => {
      document
        .getElementById(`proposta-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [highlightId, loading, rows]);

  const sorted = useMemo(() => rows, [rows]);

  async function responder(id: string, aceitar: boolean) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/docente/trocas-pendentes/${id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceitar }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível registrar.");
      toast.success(typeof json.message === "string" ? json.message : "Registrado.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro.");
    } finally {
      setBusyId(null);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Trocas de turma"
        description="Quando a escola convida você para assumir uma turma, você confirma aqui se está disponível. A troca só vale após sua aceitação."
      />

      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-6 pt-2">
          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link href="/docente">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
          </Button>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando solicitações…
            </p>
          ) : sorted.length === 0 ? (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Nada pendente</CardTitle>
                <CardDescription className="text-sm">
                  Você não tem convites de troca aguardando resposta.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="flex flex-col gap-4">
              {sorted.map((r) => (
                <li key={r.id}>
                  <Card
                    id={`proposta-${r.id}`}
                    className={cn(
                      "rounded-2xl border-border/60 shadow-sm scroll-mt-28",
                      highlightId === r.id && "ring-2 ring-primary/30"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Shuffle className="h-4 w-4 text-primary" />
                            {r.turma.nome}
                          </CardTitle>
                          <CardDescription>{r.turma.cursoNome}</CardDescription>
                        </div>
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Início previsto: {formatDate(r.dataInicioPrevista)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        <p>
                          <span className="font-semibold text-foreground">
                            Professor atual:
                          </span>{" "}
                          {r.professorAnterior.nome}
                        </p>
                        {r.resumoTurma ? (
                          <p className="mt-1">
                            <span className="font-semibold text-foreground">Resumo:</span>{" "}
                            {r.resumoTurma}
                          </p>
                        ) : null}
                        {r.resumoHorarios ? (
                          <p className="mt-1">
                            <span className="font-semibold text-foreground">Horários:</span>{" "}
                            {r.resumoHorarios}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Grade cadastrada na turma
                        </p>
                        <ul className="space-y-0.5 text-xs text-muted-foreground">
                          {r.turma.horarios.length === 0 ? (
                            <li>Sem horários cadastrados.</li>
                          ) : (
                            r.turma.horarios.map((h) => (
                              <li key={`${h.diaSemana}-${h.horaInicio}`}>
                                <span className="text-foreground/85">{h.diaLabel}</span>:{" "}
                                {h.horaInicio} – {h.horaFim}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>

                      {r.motivoTroca ? (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Motivo (escola):</span>{" "}
                          {r.motivoTroca}
                        </p>
                      ) : null}
                      {r.observacoes ? (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Observações:</span>{" "}
                          {r.observacoes}
                        </p>
                      ) : null}

                      <p className="text-[11px] text-muted-foreground">
                        Solicitação recebida em {formatDate(r.createdAt)}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-xl"
                          disabled={busyId === r.id}
                          onClick={() => void responder(r.id, true)}
                        >
                          {busyId === r.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Confirmar disponibilidade
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          disabled={busyId === r.id}
                          onClick={() => void responder(r.id, false)}
                        >
                          Recusar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
