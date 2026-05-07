"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { Button } from "@/components/ui/button";

type QuestaoApi = {
  tipo?: string;
  enunciado: string;
  explicacao?: string | null;
  pontos?: number | null;
  alternativas: { texto: string; correta: boolean }[];
};

export function DocenteVisualizarAvaliacaoPage(props: { avaliacaoId: string }) {
  const { avaliacaoId } = props;
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [turmaNome, setTurmaNome] = useState("");
  const [disciplinaNome, setDisciplinaNome] = useState("");
  const [formato, setFormato] = useState<"CLASSICA" | "JOGO">("CLASSICA");
  const [dataAvaliacao, setDataAvaliacao] = useState("");
  const [peso, setPeso] = useState<number | null>(null);
  const [naLixeira, setNaLixeira] = useState(false);
  const [questoes, setQuestoes] = useState<QuestaoApi[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/docente/avaliacoes/${avaliacaoId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao carregar avaliação.");
        setTitulo(String(json.titulo ?? ""));
        setDescricao(json.descricao ? String(json.descricao) : "");
        setTurmaNome(json.turma?.nome ?? "");
        setDisciplinaNome(json.disciplina?.nome ?? "");
        setFormato(json.formato === "JOGO" ? "JOGO" : "CLASSICA");
        setDataAvaliacao(
          json.dataAvaliacao ? new Date(json.dataAvaliacao).toLocaleString("pt-BR") : ""
        );
        setPeso(json.peso != null ? Number(json.peso) : null);
        setNaLixeira(Boolean(json.naLixeira));
        setQuestoes(Array.isArray(json.questoes) ? json.questoes : []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro.");
      } finally {
        setLoading(false);
      }
    })();
  }, [avaliacaoId]);

  return (
    <DashboardLayout>
      <Header
        title="Visualizar prova"
        description="Somente leitura — gabarito visível para o professor."
      />
      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-6 pb-12 pt-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl" asChild>
              <Link href="/docente/avaliacoes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" asChild>
              <Link href={`/docente/avaliacoes/${avaliacaoId}/quadro`}>
                <Presentation className="mr-2 h-4 w-4" />
                Quadro
              </Link>
            </Button>
            {formato === "JOGO" && !naLixeira ?
              <Button size="sm" variant="secondary" className="rounded-xl" asChild>
                <Link href={`/docente/avaliacoes/${avaliacaoId}/jogo`}>Abrir modo jogo</Link>
              </Button>
            : null}
          </div>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando…
            </p>
          ) : (
            <>
              {naLixeira ?
                <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
                  Esta prova está na lixeira. Restaure-a para criar sessões de jogo novamente.
                </p>
              : null}

              <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
                <h1 className="text-xl font-semibold">{titulo}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {turmaNome} · {disciplinaNome} · {dataAvaliacao}
                  {" · "}
                  {formato === "JOGO" ? "Modo jogo" : "Clássica"}
                  {peso != null ? ` · Peso ${peso}` : ""}
                </p>
                {descricao ?
                  <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">{descricao}</p>
                : null}
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Questões ({questoes.length})
                </h2>
                {questoes.length === 0 ?
                  <p className="text-sm text-muted-foreground">Nenhuma questão cadastrada.</p>
                : questoes.map((q, idx) => (
                    <article
                      key={`q-${idx}`}
                      className="rounded-2xl border border-border/60 bg-card/40 p-4"
                    >
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Questão {idx + 1}{" "}
                        {q.tipo === "DISSERTATIVA" ? "— Dissertativa" : "— Objetiva"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{q.enunciado}</p>
                      {q.explicacao ?
                        <p className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">Obs.:</span>{" "}
                          {q.explicacao}
                        </p>
                      : null}
                      {q.pontos != null ?
                        <p className="mt-1 text-xs text-muted-foreground">Pontos: {q.pontos}</p>
                      : null}
                      {q.alternativas?.length > 0 ?
                        <ul className="mt-3 space-y-1.5">
                          {q.alternativas.map((alt, i) => (
                            <li
                              key={`alt-${i}`}
                              className={
                                alt.correta ?
                                  "rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm"
                                : "rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm"
                              }
                            >
                              {alt.texto}
                              {alt.correta ?
                                <span className="ml-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                  (correta)
                                </span>
                              : null}
                            </li>
                          ))}
                        </ul>
                      : null}
                    </article>
                  ))
                }
              </section>
            </>
          )}
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
