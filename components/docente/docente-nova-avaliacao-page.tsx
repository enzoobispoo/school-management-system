"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TurmaOpt = { id: string; nome: string; cursoNome: string };
type DiscOpt = { id: string; nome: string };

export function DocenteNovaAvaliacaoPage() {
  const router = useRouter();
  const [needsLink, setNeedsLink] = useState(false);
  const [turmas, setTurmas] = useState<TurmaOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [turmaId, setTurmaId] = useState("");
  const [disciplinas, setDisciplinas] = useState<DiscOpt[]>([]);
  const [disciplinaId, setDisciplinaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("");
  const [dataAvaliacao, setDataAvaliacao] = useState("");
  const [formato, setFormato] = useState<"CLASSICA" | "JOGO">("CLASSICA");
  const [questoes, setQuestoes] = useState<
    {
      tipo: "OBJETIVA" | "DISSERTATIVA";
      enunciado: string;
      explicacao: string;
      pontos: string;
      alternativas: { texto: string; correta: boolean }[];
    }[]
  >([]);
  const [aiReviewEnabled, setAiReviewEnabled] = useState(false);
  const [aiReviewRequired, setAiReviewRequired] = useState(false);
  const [aiReviewMinScore, setAiReviewMinScore] = useState(70);
  const [reviewingAi, setReviewingAi] = useState(false);
  const [aiReview, setAiReview] = useState<{
    summary: string;
    issues: string[];
    suggestions: string[];
    qualityScore: number;
  } | null>(null);

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/docente/overview", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erro ao carregar turmas.");
    setNeedsLink(Boolean(json.needsLink));
    const list = (json.turmas || []) as TurmaOpt[];
    setTurmas(list);
    setTurmaId((prev) => prev || list[0]?.id || "");
  }, []);

  const loadDisciplinas = useCallback(async (tid: string) => {
    if (!tid) {
      setDisciplinas([]);
      setDisciplinaId("");
      return;
    }
    const res = await fetch(`/api/docente/turmas/${tid}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      setDisciplinas([]);
      return;
    }
    const d = (json.disciplinas || []) as DiscOpt[];
    setDisciplinas(d);
    setDisciplinaId(d[0]?.id ?? "");
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await loadOverview();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadOverview]);

  useEffect(() => {
    void loadDisciplinas(turmaId);
  }, [turmaId, loadDisciplinas]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/docente/avaliacoes/revisar", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) return;
        setAiReviewEnabled(Boolean(json.enabled));
        setAiReviewRequired(Boolean(json.enforceBeforeCreate));
        setAiReviewMinScore(
          Number.isFinite(Number(json.minScore)) ? Number(json.minScore) : 70
        );
      } catch {
        setAiReviewEnabled(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsLink) {
      toast.error("Vincule sua conta ao professor antes.");
      return;
    }
    if (!turmaId || !disciplinaId || !titulo.trim() || !dataAvaliacao) {
      toast.error("Preencha turma, disciplina, título e data.");
      return;
    }

    const pesoNum = peso.trim() ? Number(peso.replace(",", ".")) : null;
    if (peso.trim() && Number.isNaN(pesoNum)) {
      toast.error("Peso inválido.");
      return;
    }
    if (aiReviewRequired) {
      if (!aiReview) {
        toast.error("Esta escola exige revisão IA antes da criação.");
        return;
      }
      if (aiReview.qualityScore < aiReviewMinScore) {
        toast.error(
          `Qualidade abaixo do mínimo (${Math.floor(aiReview.qualityScore)}/${aiReviewMinScore}).`
        );
        return;
      }
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/docente/turmas/${turmaId}/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplinaId,
          formato,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          peso: pesoNum,
          dataAvaliacao,
          aiReviewScore: aiReview?.qualityScore ?? null,
          questoes: questoes
            .map((q) => ({
              tipo: q.tipo,
              enunciado: q.enunciado.trim(),
              explicacao: q.explicacao.trim() || null,
              pontos: q.pontos.trim() ? Number(q.pontos.replace(",", ".")) : null,
              alternativas:
                q.tipo === "DISSERTATIVA"
                  ? []
                  : q.alternativas
                .map((a) => ({ texto: a.texto.trim(), correta: a.correta }))
                .filter((a) => a.texto.length > 0),
            }))
            .filter((q) => q.enunciado.length > 0),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível criar.");
      toast.success(
        formato === "JOGO"
          ? "Avaliação em modo jogo criada com questões."
          : "Avaliação criada na turma. Você pode lançar notas na página da turma."
      );
      if (formato === "JOGO" && typeof json.id === "string") {
        router.push(`/docente/avaliacoes/${json.id}/jogo`);
      } else {
        router.push(`/docente/turmas/${turmaId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro.");
    } finally {
      setSaving(false);
    }
  }

  async function runAiReview() {
    if (!aiReviewEnabled) {
      toast.error("Seu plano/configuração atual não possui revisão por IA.");
      return;
    }
    if (!titulo.trim()) {
      toast.error("Preencha ao menos o título antes da revisão por IA.");
      return;
    }
    try {
      setReviewingAi(true);
      const res = await fetch("/api/docente/avaliacoes/revisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          formato,
          questoes: questoes
            .map((q) => ({
              tipo: q.tipo,
              enunciado: q.enunciado.trim(),
              explicacao: q.explicacao.trim() || null,
              pontos: q.pontos.trim() ? Number(q.pontos.replace(",", ".")) : null,
              alternativas:
                q.tipo === "DISSERTATIVA"
                  ? []
                  : q.alternativas
                      .map((a) => ({ texto: a.texto.trim(), correta: a.correta }))
                      .filter((a) => a.texto.length > 0),
            }))
            .filter((q) => q.enunciado.length > 0),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha na revisão por IA.");
      setAiReview({
        summary: String(json.summary ?? "Revisão concluída."),
        issues: Array.isArray(json.issues) ? json.issues.map(String) : [],
        suggestions: Array.isArray(json.suggestions) ? json.suggestions.map(String) : [],
        qualityScore: Number.isFinite(json.qualityScore) ? Number(json.qualityScore) : 0,
      });
      toast.success("Revisão por IA concluída.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na revisão por IA.");
    } finally {
      setReviewingAi(false);
    }
  }

  function addQuestao() {
    setQuestoes((curr) => [
      ...curr,
      {
        tipo: "OBJETIVA",
        enunciado: "",
        explicacao: "",
        pontos: "",
        alternativas: [
          { texto: "", correta: true },
          { texto: "", correta: false },
        ],
      },
    ]);
  }

  return (
    <DashboardLayout>
      <Header
        title="Nova avaliação no sistema"
        description="Prova ou atividade avaliada — disciplina, título, data e peso opcional."
      />

      <DashboardMainLayout rightPanel={null}>
        <div className="relative space-y-8 pb-12 pt-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-4 h-56 rounded-[28px] bg-[radial-gradient(ellipse_72%_52%_at_50%_-8%,hsl(var(--primary)/0.11),transparent)] dark:bg-[radial-gradient(ellipse_72%_52%_at_50%_-8%,hsl(var(--primary)/0.18),transparent)]"
          />

          <Button variant="ghost" size="sm" className="relative rounded-xl" asChild>
            <Link href="/docente">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao workspace
            </Link>
          </Button>

          <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.07] dark:bg-zinc-900/45 sm:p-8">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Avaliação estruturada
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Esta avaliação aparece na turma para lançamento de notas. Para apenas guardar um PDF
              de prova ou lista, use os ambientes em{" "}
              <Link href="/docente/materiais" className="font-medium text-primary underline-offset-4 hover:underline">
                Materiais
              </Link>
              .
            </p>

            {loading ? (
              <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando turmas…
              </p>
            ) : needsLink ? (
              <p className="mt-8 text-sm text-muted-foreground">
                Associe sua conta ao cadastro de professor para criar avaliações.
              </p>
            ) : (
              <form className="relative mt-8 grid max-w-xl gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label>Turma</Label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-sm dark:bg-zinc-950/40"
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} — {t.cursoNome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label>Disciplina</Label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-sm dark:bg-zinc-950/40"
                    value={disciplinaId}
                    onChange={(e) => setDisciplinaId(e.target.value)}
                    disabled={!turmaId || disciplinas.length === 0}
                  >
                    <option value="">
                      {!turmaId ? "Escolha uma turma" : disciplinas.length === 0 ? "Sem disciplinas" : "Selecione"}
                    </option>
                    {disciplinas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label>Título</Label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex.: Prova — funções afins"
                    className="rounded-xl border-border/70 bg-muted/20 dark:bg-zinc-950/35"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Formato</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-sm dark:bg-zinc-950/40"
                      value={formato}
                      onChange={(e) => setFormato(e.target.value === "JOGO" ? "JOGO" : "CLASSICA")}
                    >
                      <option value="CLASSICA">Clássica</option>
                      <option value="JOGO">Modo jogo (estilo quiz ao vivo)</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Data da avaliação</Label>
                    <Input
                      type="datetime-local"
                      value={dataAvaliacao}
                      onChange={(e) => setDataAvaliacao(e.target.value)}
                      className="rounded-xl border-border/70 bg-muted/20 dark:bg-zinc-950/35"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Peso (opcional)</Label>
                    <Input
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      placeholder="Ex.: 2 ou 1.5"
                      className="rounded-xl border-border/70 bg-muted/20 dark:bg-zinc-950/35"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="min-h-[88px] rounded-xl border-border/70 bg-muted/20 dark:bg-zinc-950/35"
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Questões e alternativas</p>
                      <p className="text-xs text-muted-foreground">
                        Monte sua prova/atividade diretamente no sistema.
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={addQuestao}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Adicionar questão
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {questoes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma questão adicionada ainda. Você pode criar avaliação simples sem questões ou montar tudo agora.
                      </p>
                    ) : (
                      questoes.map((questao, qIdx) => (
                        <div key={`q-${qIdx}`} className="rounded-xl border border-border/60 bg-background/50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Questão {qIdx + 1}
                            </p>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-lg"
                              onClick={() =>
                                setQuestoes((curr) => curr.filter((_, idx) => idx !== qIdx))
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid gap-2">
                            <Input
                              value={questao.enunciado}
                              onChange={(e) =>
                                setQuestoes((curr) =>
                                  curr.map((q, idx) =>
                                    idx === qIdx ? { ...q, enunciado: e.target.value } : q
                                  )
                                )
                              }
                              placeholder="Enunciado da questão"
                              className="rounded-xl"
                            />
                            <div className="grid gap-2 sm:grid-cols-2">
                              <select
                                className="flex h-10 w-full rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-sm dark:bg-zinc-950/40"
                                value={questao.tipo}
                                onChange={(e) =>
                                  setQuestoes((curr) =>
                                    curr.map((q, idx) =>
                                      idx === qIdx
                                        ? {
                                            ...q,
                                            tipo:
                                              e.target.value === "DISSERTATIVA"
                                                ? "DISSERTATIVA"
                                                : "OBJETIVA",
                                          }
                                        : q
                                    )
                                  )
                                }
                              >
                                <option value="OBJETIVA">Objetiva (alternativas)</option>
                                <option value="DISSERTATIVA">Dissertativa</option>
                              </select>
                              <Input
                                value={questao.pontos}
                                onChange={(e) =>
                                  setQuestoes((curr) =>
                                    curr.map((q, idx) =>
                                      idx === qIdx ? { ...q, pontos: e.target.value } : q
                                    )
                                  )
                                }
                                placeholder="Pontos (opcional)"
                                className="rounded-xl"
                              />
                              <Input
                                value={questao.explicacao}
                                onChange={(e) =>
                                  setQuestoes((curr) =>
                                    curr.map((q, idx) =>
                                      idx === qIdx ? { ...q, explicacao: e.target.value } : q
                                    )
                                  )
                                }
                                placeholder="Explicação (opcional)"
                                className="rounded-xl"
                              />
                            </div>
                            {questao.tipo === "DISSERTATIVA" ? (
                              <div className="rounded-xl border border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground">
                                Questão dissertativa não precisa de alternativas.
                              </div>
                            ) : (
                              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-2">
                                {questao.alternativas.map((alt, aIdx) => (
                                  <div key={`q-${qIdx}-a-${aIdx}`} className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] ${alt.correta ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400" : "border-border text-muted-foreground"}`}
                                      onClick={() =>
                                        setQuestoes((curr) =>
                                          curr.map((q, idx) =>
                                            idx !== qIdx
                                              ? q
                                              : {
                                                  ...q,
                                                  alternativas: q.alternativas.map((a, i) =>
                                                    i === aIdx ? { ...a, correta: !a.correta } : a
                                                  ),
                                                }
                                          )
                                        )
                                      }
                                    >
                                      {alt.correta ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}
                                      Correta
                                    </button>
                                    <Input
                                      value={alt.texto}
                                      onChange={(e) =>
                                        setQuestoes((curr) =>
                                          curr.map((q, idx) =>
                                            idx === qIdx
                                              ? {
                                                  ...q,
                                                  alternativas: q.alternativas.map((a, i) =>
                                                    i === aIdx ? { ...a, texto: e.target.value } : a
                                                  ),
                                                }
                                              : q
                                          )
                                        )
                                      }
                                      placeholder={`Alternativa ${aIdx + 1}`}
                                      className="rounded-xl"
                                    />
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-lg text-xs"
                                  onClick={() =>
                                    setQuestoes((curr) =>
                                      curr.map((q, idx) =>
                                        idx === qIdx
                                          ? {
                                              ...q,
                                              alternativas: [...q.alternativas, { texto: "", correta: false }],
                                            }
                                          : q
                                      )
                                    )
                                  }
                                >
                                  <Plus className="mr-1 h-3 w-3" />
                                  Adicionar alternativa
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {aiReviewEnabled ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void runAiReview()}
                      disabled={reviewingAi || saving}
                      className="rounded-xl gap-2"
                    >
                      {reviewingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Revisar com IA
                    </Button>
                  ) : null}
                  <Button type="submit" disabled={saving} className="w-fit rounded-xl gap-2">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Criar avaliação na turma
                  </Button>
                </div>

                {aiReview ? (
                  <div className="rounded-xl border border-violet-200/70 bg-violet-50/70 p-3 text-sm dark:border-violet-500/30 dark:bg-violet-500/10">
                    <p className="font-medium text-foreground">
                      Revisão IA (nota {Math.max(0, Math.min(100, aiReview.qualityScore))}/100)
                    </p>
                    <p className="mt-1 text-muted-foreground">{aiReview.summary}</p>
                    {aiReview.issues.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                        {aiReview.issues.slice(0, 4).map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    ) : null}
                    {aiReview.suggestions.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground/90">
                        {aiReview.suggestions.slice(0, 4).map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
                {aiReviewRequired ? (
                  <p className="text-xs text-muted-foreground">
                    Política da escola: revisão IA obrigatória com nota mínima {aiReviewMinScore}/100.
                  </p>
                ) : null}
              </form>
            )}
          </section>
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
