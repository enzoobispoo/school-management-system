"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";

type Turma = {
  id: string;
  nome: string;
  capacidadeMaxima: number;
  matriculas: Array<{ id: string; aluno: { nome: string } }>;
};

type Disciplina = { id: string; nome: string };
type Avaliacao = { id: string; titulo: string; disciplina: { nome: string }; dataAvaliacao: string };
type Chamada = {
  id: string;
  dataAula: string;
  disciplina: { nome: string };
  presencas: Array<{ presente: boolean }>;
};

function periodQuery(start: string, end: string) {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  return params.toString();
}

export function AcademicoPageClient() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [boletimMatriculaId, setBoletimMatriculaId] = useState("");
  const [boletimBuscaNome, setBoletimBuscaNome] = useState("");
  const [boletim, setBoletim] = useState<any>(null);

  const selectedTurma = useMemo(
    () => turmas.find((t) => t.id === selectedTurmaId) || null,
    [turmas, selectedTurmaId]
  );

  const loadTurmas = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const r = await fetch("/api/turmas?pageSize=100", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Não foi possível carregar as turmas.");
      const data = (j.data || []) as Turma[];
      setTurmas(data);

      const last = typeof window !== "undefined" ? window.localStorage.getItem("academico:lastTurmaId") : "";
      const next = data.find((t) => t.id === last)?.id || data[0]?.id || "";
      setSelectedTurmaId((prev) => (!prev && next ? next : prev));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao carregar turmas.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadData = useCallback(async (turmaId: string) => {
    if (!turmaId) return;
    setLoading(true);
    setMessage("");
    try {
      const q = periodQuery(periodoInicio, periodoFim);
      const [dRes, aRes, cRes] = await Promise.allSettled([
        fetch(`/api/academico/disciplinas?turmaId=${turmaId}`, { cache: "no-store" }),
        fetch(`/api/academico/avaliacoes?turmaId=${turmaId}${q ? `&${q}` : ""}`, { cache: "no-store" }),
        fetch(`/api/academico/turmas/${turmaId}/chamadas${q ? `?${q}` : ""}`, { cache: "no-store" }),
      ]);

      if (dRes.status === "fulfilled") {
        const j = await dRes.value.json();
        setDisciplinas(dRes.value.ok ? j : []);
        if (!dRes.value.ok) setMessage("Disciplinas indisponíveis no momento.");
      }

      if (aRes.status === "fulfilled") {
        const j = await aRes.value.json();
        setAvaliacoes(aRes.value.ok ? j : []);
      }

      if (cRes.status === "fulfilled") {
        const j = await cRes.value.json();
        setChamadas(cRes.value.ok ? j : []);
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("academico:lastTurmaId", turmaId);
      }
    } catch {
      setMessage("Não foi possível carregar os indicadores acadêmicos.");
    } finally {
      setLoading(false);
    }
  }, [periodoInicio, periodoFim]);

  useEffect(() => {
    loadTurmas();
  }, [loadTurmas]);

  useEffect(() => {
    if (selectedTurmaId) loadData(selectedTurmaId);
  }, [selectedTurmaId, loadData]);

  useEffect(() => {
    if (!boletimMatriculaId && selectedTurma?.matriculas[0]?.id) {
      setBoletimMatriculaId(selectedTurma.matriculas[0].id);
    }
  }, [selectedTurma, boletimMatriculaId]);

  async function loadBoletim() {
    if (!boletimMatriculaId) return;
    try {
      const r = await fetch(`/api/academico/matriculas/${boletimMatriculaId}/boletim`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Não foi possível carregar o boletim.");
      setBoletim(j);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao carregar boletim.");
    }
  }

  const totalAlunos = selectedTurma?.matriculas.length || 0;
  const chamadasRecentes = chamadas.slice(0, 6);
  const avaliacoesRecentes = avaliacoes.slice(0, 6);
  const alunosBoletimFiltrados = useMemo(() => {
    const source = selectedTurma?.matriculas || [];
    const q = boletimBuscaNome.trim().toLowerCase();
    if (!q) return source;
    return source.filter((m) => m.aluno.nome.toLowerCase().includes(q));
  }, [selectedTurma, boletimBuscaNome]);

  return (
    <DashboardLayout>
      <Header title="Acadêmico" description="Painel executivo por turma" />
      <div className="p-6 space-y-4">
        <section className="rounded-2xl border border-border/70 bg-card/70 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Gestão Acadêmica</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Situação geral dos alunos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte turma, período, frequência e boletim em uma única visão.
          </p>
        </section>

        {message ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">
            {message}
          </div>
        ) : null}

        <section className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filtro principal</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="h-11 rounded-lg border border-input/80 bg-background px-3 text-sm"
              value={selectedTurmaId}
              onChange={(e) => setSelectedTurmaId(e.target.value)}
            >
              <option value="">Turma</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="h-11 rounded-lg border border-input/80 bg-background px-3 text-sm"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
            />
            <input
              type="date"
              className="h-11 rounded-lg border border-input/80 bg-background px-3 text-sm"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
            />
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Alunos na turma" value={String(totalAlunos)} />
          <MetricCard title="Disciplinas" value={String(disciplinas.length)} />
          <MetricCard title="Avaliações" value={String(avaliacoes.length)} />
          <MetricCard title="Chamadas" value={String(chamadas.length)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Últimas avaliações</h3>
            <div className="space-y-2">
              {avaliacoesRecentes.length === 0 ? (
                <EmptyText text="Sem avaliações neste período." />
              ) : (
                avaliacoesRecentes.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border/70 bg-background p-3">
                    <p className="text-sm font-medium leading-5">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.disciplina?.nome} - {new Date(a.dataAvaliacao).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Últimas chamadas</h3>
            <div className="space-y-2">
              {chamadasRecentes.length === 0 ? (
                <EmptyText text="Sem chamadas neste período." />
              ) : (
                chamadasRecentes.map((c) => {
                  const total = c.presencas.length;
                  const presentes = c.presencas.filter((p) => p.presente).length;
                  const freq = total > 0 ? (presentes / total) * 100 : 0;
                  return (
                    <div key={c.id} className="rounded-lg border border-border/70 bg-background p-3">
                      <p className="text-sm font-medium leading-5">{c.disciplina?.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.dataAula).toLocaleDateString("pt-BR")} - {presentes}/{total} presentes ({freq.toFixed(1)}%)
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Consulta de boletim</h3>
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <div className="relative">
              <input
                className="h-11 w-full rounded-lg border border-input/80 bg-background px-3 text-sm"
                placeholder="Buscar aluno por nome"
                value={boletimBuscaNome}
                onChange={(e) => setBoletimBuscaNome(e.target.value)}
              />
              {boletimBuscaNome.trim() && alunosBoletimFiltrados.length > 0 ? (
                <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
                  {alunosBoletimFiltrados.slice(0, 8).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setBoletimMatriculaId(m.id);
                        setBoletimBuscaNome(m.aluno.nome);
                      }}
                      className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      {m.aluno.nome}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <select
              className="h-11 flex-1 rounded-lg border border-input/80 bg-background px-3 text-sm"
              value={boletimMatriculaId}
              onChange={(e) => setBoletimMatriculaId(e.target.value)}
            >
              <option value="">Aluno</option>
              {alunosBoletimFiltrados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.aluno.nome}
                </option>
              ))}
            </select>
            <button
              className="h-11 rounded-lg border border-input/80 bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              onClick={loadBoletim}
              disabled={!boletimMatriculaId}
            >
              Ver boletim
            </button>
          </div>

          {boletim ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {boletim.aluno?.nome} - {boletim.turma?.nome}
              </p>
              {boletim.disciplinas?.length ? (
                boletim.disciplinas.map((d: any) => (
                  <div key={d.disciplinaId} className="rounded-lg border border-border/70 bg-background p-3">
                    <p className="text-sm font-medium">{d.disciplinaNome}</p>
                    <p className="text-xs text-muted-foreground">
                      Média: {d.media !== null ? Number(d.media).toFixed(2) : "-"} | Frequência:{" "}
                      {d.frequencia !== null ? `${Number(d.frequencia).toFixed(1)}%` : "-"}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyText text="Sem dados de boletim para este aluno." />
              )}
            </div>
          ) : null}
        </section>

        {loading ? <p className="text-xs text-muted-foreground">Carregando dados...</p> : null}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
      {text}
    </div>
  );
}

