"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { Button } from "@/components/ui/button";
import { DocenteProvaWhiteboard } from "@/components/docente/docente-prova-whiteboard";

type QuestaoApi = {
  tipo?: string;
  enunciado: string;
  alternativas: { texto: string; correta: boolean }[];
};

export function DocenteProvaQuadroPage(props: { avaliacaoId: string }) {
  const { avaliacaoId } = props;
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [turmaNome, setTurmaNome] = useState("");
  const [disciplinaNome, setDisciplinaNome] = useState("");
  const [formato, setFormato] = useState<"CLASSICA" | "JOGO">("CLASSICA");
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
        setTurmaNome(json.turma?.nome ?? "");
        setDisciplinaNome(json.disciplina?.nome ?? "");
        setFormato(json.formato === "JOGO" ? "JOGO" : "CLASSICA");
        setNaLixeira(Boolean(json.naLixeira));
        setQuestoes(Array.isArray(json.questoes) ? json.questoes : []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro.");
      } finally {
        setLoading(false);
      }
    })();
  }, [avaliacaoId]);

  const storageKey = `docente-prova-quadro:v1:${avaliacaoId}`;

  return (
    <DashboardLayout>
      <Header
        title="Quadro da prova"
        description="Projete ou corrija em tela cheia: enunciados ao lado e quadro com lápis, borracha e formas."
      />
      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-4 pb-12 pt-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl" asChild>
              <Link href="/docente/avaliacoes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Biblioteca
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href={`/docente/avaliacoes/${avaliacaoId}/ver`}>Somente leitura</Link>
            </Button>
            {formato === "JOGO" && !naLixeira ?
              <Button variant="secondary" size="sm" className="rounded-xl" asChild>
                <Link href={`/docente/avaliacoes/${avaliacaoId}/jogo`}>Modo jogo</Link>
              </Button>
            : null}
          </div>

          {loading ?
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando…
            </p>
          : <>
              {naLixeira ?
                <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm">
                  Prova na lixeira — o quadro ainda pode ser usado para consulta; restaurar para jogo ao vivo.
                </p>
              : null}

              <div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
                <h1 className="text-lg font-semibold">{titulo}</h1>
                <p className="text-xs text-muted-foreground">
                  {turmaNome} · {disciplinaNome}
                  {formato === "JOGO" ? " · Também disponível como jogo ao vivo" : ""}
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
                <section className="space-y-3 rounded-2xl border border-border/60 bg-card/30 p-4 xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto">
                  <h2 className="text-sm font-semibold text-muted-foreground">Enunciados</h2>
                  {questoes.length === 0 ?
                    <p className="text-sm text-muted-foreground">Sem questões cadastradas.</p>
                  : questoes.map((q, idx) => (
                      <article key={`q-${idx}`} className="rounded-xl border border-border/50 bg-background/40 p-3 text-sm">
                        <p className="text-xs font-semibold text-muted-foreground">Questão {idx + 1}</p>
                        <p className="mt-1 whitespace-pre-wrap">{q.enunciado}</p>
                        {q.alternativas?.length > 0 ?
                          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {q.alternativas.map((a, i) => (
                              <li key={`a-${i}`}>
                                {String.fromCharCode(65 + i)}) {a.texto}
                                {a.correta ?
                                  <span className="ml-1 font-medium text-emerald-600 dark:text-emerald-400">
                                    (gabarito)
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

                <DocenteProvaWhiteboard storageKey={storageKey} />
              </div>
            </>
          }
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
