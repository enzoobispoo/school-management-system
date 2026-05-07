"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type QuestaoForm = {
  tipo: "OBJETIVA" | "DISSERTATIVA";
  enunciado: string;
  explicacao: string;
  pontos: string;
  alternativas: { texto: string; correta: boolean }[];
};

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DocenteEditarAvaliacaoPage(props: { avaliacaoId: string }) {
  const { avaliacaoId } = props;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [podeEditar, setPodeEditar] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState<string | null>(null);
  const [naLixeira, setNaLixeira] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [turmaNome, setTurmaNome] = useState("");
  const [disciplinaNome, setDisciplinaNome] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("");
  const [dataAvaliacao, setDataAvaliacao] = useState("");
  const [formato, setFormato] = useState<"CLASSICA" | "JOGO">("CLASSICA");
  const [questoes, setQuestoes] = useState<QuestaoForm[]>([]);

  const mapLoadedQuestoes = useCallback((items: unknown[]) => {
    const forms: QuestaoForm[] = [];
    for (const raw of items) {
      const q = raw as {
        tipo?: string;
        enunciado?: string;
        explicacao?: string | null;
        pontos?: number | null;
        alternativas?: { texto: string; correta: boolean }[];
      };
      const tipo = q.tipo === "DISSERTATIVA" ? "DISSERTATIVA" : "OBJETIVA";
      const alternativas =
        tipo === "DISSERTATIVA"
          ? []
          : ((q.alternativas?.length ?? 0) > 0 ?
              q.alternativas!.map((a) => ({ texto: a.texto, correta: a.correta }))
            : [
                { texto: "", correta: true },
                { texto: "", correta: false },
              ]);
      forms.push({
        tipo,
        enunciado: q.enunciado ?? "",
        explicacao: q.explicacao ?? "",
        pontos: q.pontos != null ? String(q.pontos) : "",
        alternativas,
      });
    }
    return forms;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/docente/avaliacoes/${avaliacaoId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao carregar avaliação.");
        setNaLixeira(Boolean(json.naLixeira));
        setPodeEditar(Boolean(json.podeEditar));
        setMotivoBloqueio(json.motivoBloqueioEdicao ?? null);
        setTurmaNome(json.turma?.nome ?? "");
        setDisciplinaNome(json.disciplina?.nome ?? "");
        setTitulo(String(json.titulo ?? ""));
        setDescricao(json.descricao ? String(json.descricao) : "");
        setPeso(json.peso != null ? String(json.peso) : "");
        setFormato(json.formato === "JOGO" ? "JOGO" : "CLASSICA");
        setDataAvaliacao(
          json.dataAvaliacao ? toDatetimeLocalValue(new Date(json.dataAvaliacao)) : ""
        );
        setQuestoes(mapLoadedQuestoes(Array.isArray(json.questoes) ? json.questoes : []));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro.");
      } finally {
        setLoading(false);
      }
    })();
  }, [avaliacaoId, mapLoadedQuestoes]);

  async function restaurarDaLixeira() {
    try {
      setRestaurando(true);
      const res = await fetch(`/api/docente/avaliacoes/${avaliacaoId}/restore`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Não foi possível restaurar.");
      toast.success("Prova restaurada.");
      router.push("/docente/avaliacoes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro.");
    } finally {
      setRestaurando(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEditar) {
      toast.error(motivoBloqueio ?? "Edição não permitida.");
      return;
    }
    if (!titulo.trim() || !dataAvaliacao) {
      toast.error("Título e data são obrigatórios.");
      return;
    }
    const pesoNum = peso.trim() ? Number(peso.replace(",", ".")) : null;
    if (peso.trim() && Number.isNaN(pesoNum)) {
      toast.error("Peso inválido.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/docente/avaliacoes/${avaliacaoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formato,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          peso: pesoNum,
          dataAvaliacao,
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
      if (!res.ok) throw new Error(json.error || "Não foi possível salvar.");
      toast.success("Avaliação atualizada.");
      router.push("/docente/avaliacoes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro.");
    } finally {
      setSaving(false);
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
        title="Editar avaliação"
        description="Alterações só são permitidas antes de notas ou participação no modo jogo."
      />

      <DashboardMainLayout rightPanel={null}>
        <div className="relative space-y-8 pb-12 pt-2">
          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link href="/docente/avaliacoes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à lista
            </Link>
          </Button>

          <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm sm:p-8">
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando…
              </p>
            ) : naLixeira ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">Esta prova está na lixeira</p>
                <p className="text-sm text-muted-foreground">
                  Restaure para editar ou use &quot;Visualizar&quot; para consultar o conteúdo e o gabarito.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-xl"
                    disabled={restaurando}
                    onClick={() => void restaurarDaLixeira()}
                  >
                    {restaurando ?
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Restaurando…
                      </>
                    : "Restaurar prova"}
                  </Button>
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link href={`/docente/avaliacoes/${avaliacaoId}/ver`}>Visualizar</Link>
                  </Button>
                  <Button variant="ghost" className="rounded-xl" asChild>
                    <Link href="/docente/avaliacoes">Voltar à lista</Link>
                  </Button>
                </div>
              </div>
            ) : !podeEditar ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Esta prova não pode ser editada</p>
                <p className="text-sm text-muted-foreground">{motivoBloqueio}</p>
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link href="/docente/avaliacoes">Voltar</Link>
                </Button>
              </div>
            ) : (
              <form className="grid max-w-xl gap-5" onSubmit={handleSubmit}>
                <div className="rounded-xl border border-border/60 bg-muted/15 px-3 py-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{turmaNome}</span>
                  {" · "}
                  <span>{disciplinaNome}</span>
                  <p className="mt-1 text-xs">
                    Turma e disciplina não podem ser alteradas aqui. Duplique a prova para usar em outra turma.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Título</Label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Formato</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-sm"
                      value={formato}
                      onChange={(e) => setFormato(e.target.value === "JOGO" ? "JOGO" : "CLASSICA")}
                    >
                      <option value="CLASSICA">Clássica</option>
                      <option value="JOGO">Modo jogo</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Data da avaliação</Label>
                    <Input
                      type="datetime-local"
                      value={dataAvaliacao}
                      onChange={(e) => setDataAvaliacao(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Peso (opcional)</Label>
                    <Input value={peso} onChange={(e) => setPeso(e.target.value)} className="rounded-xl" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="rounded-xl min-h-[88px]" />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Questões</p>
                    <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={addQuestao}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Adicionar questão
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {questoes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma questão.</p>
                    ) : (
                      questoes.map((questao, qIdx) => (
                        <div key={`q-${qIdx}`} className="rounded-xl border border-border/60 bg-background/50 p-3">
                          <div className="mb-2 flex justify-between gap-2">
                            <p className="text-xs font-semibold uppercase text-muted-foreground">
                              Questão {qIdx + 1}
                            </p>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => setQuestoes((curr) => curr.filter((_, idx) => idx !== qIdx))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Input
                            value={questao.enunciado}
                            onChange={(e) =>
                              setQuestoes((curr) =>
                                curr.map((q, idx) =>
                                  idx === qIdx ? { ...q, enunciado: e.target.value } : q
                                )
                              )
                            }
                            placeholder="Enunciado"
                            className="rounded-xl mb-2"
                          />
                          <div className="grid gap-2 sm:grid-cols-2 mb-2">
                            <select
                              className="flex h-10 w-full rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-sm"
                              value={questao.tipo}
                              onChange={(e) =>
                                setQuestoes((curr) =>
                                  curr.map((q, idx) =>
                                    idx === qIdx ?
                                      {
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
                              <option value="OBJETIVA">Objetiva</option>
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
                              placeholder="Pontos"
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
                              placeholder="Explicação"
                              className="rounded-xl sm:col-span-2"
                            />
                          </div>
                          {questao.tipo === "DISSERTATIVA" ? (
                            <p className="text-xs text-muted-foreground">Sem alternativas.</p>
                          ) : (
                            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-2">
                              {questao.alternativas.map((alt, aIdx) => (
                                <div key={`${qIdx}-${aIdx}`} className="flex gap-2 items-center">
                                  <button
                                    type="button"
                                    className={`inline-flex h-6 shrink-0 items-center rounded-full border px-2 text-[11px] ${alt.correta ? "border-green-500/40 bg-green-500/10 text-green-600" : ""}`}
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
                                    OK
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
                                    className="rounded-xl"
                                  />
                                </div>
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-xs"
                                onClick={() =>
                                  setQuestoes((curr) =>
                                    curr.map((q, idx) =>
                                      idx === qIdx ?
                                        {
                                          ...q,
                                          alternativas: [...q.alternativas, { texto: "", correta: false }],
                                        }
                                      : q
                                    )
                                  )
                                }
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Alternativa
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="w-fit rounded-xl gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar alterações
                </Button>
              </form>
            )}
          </section>
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
