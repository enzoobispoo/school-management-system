"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  PenLine,
  Download,
  Pencil,
  Copy,
  Eye,
  Play,
  Trash2,
  RotateCcw,
  Trash,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AvaliacaoListItem = {
  id: string;
  titulo: string;
  formato: "CLASSICA" | "JOGO";
  dataAvaliacao: string;
  createdAt: string;
  turma: { id: string; nome: string };
  disciplina: { id: string; nome: string };
  questoesCount: number;
  questoesObjetivasCount: number;
  questaoPreview: string | null;
  alunosComNotaCount: number;
  alunosPreview: string[];
  podeEditar?: boolean;
  naLixeira?: boolean;
};

export function DocenteAvaliacoesPage() {
  const [aba, setAba] = useState<"ativas" | "lixeira">("ativas");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AvaliacaoListItem[]>([]);
  const [error, setError] = useState("");
  const [dupId, setDupId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [moverLixeiraId, setMoverLixeiraId] = useState<string | null>(null);
  const [apagarDefId, setApagarDefId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (query.trim().length >= 2) params.set("q", query.trim());
        if (aba === "lixeira") params.set("lixeira", "1");
        const qs = params.toString();
        const url = qs ? `/api/docente/avaliacoes?${qs}` : `/api/docente/avaliacoes${aba === "lixeira" ? "?lixeira=1" : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao carregar provas.");
        setRows(Array.isArray(json) ? json : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query, refreshKey, aba]);

  async function duplicar(item: AvaliacaoListItem) {
    try {
      setDupId(item.id);
      const res = await fetch(`/api/docente/avaliacoes/${item.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Não foi possível duplicar.");
      const successMsg =
        typeof json.titulo === "string" ?
          `Cópia criada: ${json.titulo}`
        : "Prova duplicada.";
      toast.success(successMsg);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao duplicar.");
    } finally {
      setDupId(null);
    }
  }

  async function moverParaLixeira(id: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/docente/avaliacoes/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Não foi possível mover para a lixeira.");
      toast.success("Prova movida para a lixeira.");
      setMoverLixeiraId(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro.");
    } finally {
      setBusyId(null);
    }
  }

  async function restaurar(id: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/docente/avaliacoes/${id}/restore`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Não foi possível restaurar.");
      toast.success("Prova restaurada.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro.");
    } finally {
      setBusyId(null);
    }
  }

  async function apagarDefinitivamente(id: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/docente/avaliacoes/${id}/permanent`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Não foi possível excluir.");
      toast.success("Prova removida definitivamente.");
      setApagarDefId(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro.");
    } finally {
      setBusyId(null);
    }
  }

  const subtitle = useMemo(() => {
    if (rows.length === 0) return "Nenhuma prova encontrada.";
    return `${rows.length} prova(s) encontrada(s).`;
  }, [rows.length]);

  const itemMover = rows.find((r) => r.id === moverLixeiraId);
  const itemApagar = rows.find((r) => r.id === apagarDefId);

  return (
    <DashboardLayout>
      <Header
        title="Provas e avaliações"
        description="Biblioteca das avaliações já criadas no sistema, com busca por título, questão e alunos."
      />
      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-5 pb-12 pt-2">
          <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Tabs
                value={aba}
                onValueChange={(v) => setAba(v as "ativas" | "lixeira")}
                className="w-full sm:w-auto"
              >
                <TabsList className="rounded-xl">
                  <TabsTrigger value="ativas" className="rounded-lg px-4">
                    Ativas
                  </TabsTrigger>
                  <TabsTrigger value="lixeira" className="rounded-lg px-4">
                    Lixeira
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título, enunciado de questão, turma, disciplina ou aluno..."
                  className="pl-9"
                />
              </div>
              <Button className="rounded-xl" asChild>
                <Link href="/docente/avaliacoes/nova">
                  <PenLine className="mr-2 h-4 w-4" />
                  Nova avaliação
                </Link>
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{loading ? "Buscando..." : subtitle}</p>
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          </section>

          <section className="grid gap-3">
            {rows.map((item) => {
              const naLixeira = Boolean(item.naLixeira);
              return (
                <article key={item.id} className="rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold">{item.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.turma.nome} • {item.disciplina.nome} •{" "}
                        {new Date(item.dataAvaliacao).toLocaleDateString("pt-BR")} •{" "}
                        {item.formato === "JOGO" ? "Modo jogo" : "Clássica"}
                        {naLixeira ? " • Na lixeira" : ""}
                      </p>
                    </div>
                    <div
                      role="toolbar"
                      aria-label="Ações da prova"
                      className="-mx-1 flex min-h-11 min-w-0 w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto overscroll-x-contain px-1 py-0.5 sm:w-auto sm:max-w-[min(100%,28rem)] sm:justify-end md:max-w-[min(100%,34rem)] lg:max-w-[min(100%,40rem)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
                    >
                      <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                        <Link href={`/docente/avaliacoes/${item.id}/ver`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Ver
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                        <Link href={`/docente/avaliacoes/${item.id}/quadro`}>
                          <Presentation className="mr-1.5 h-3.5 w-3.5" />
                          Quadro
                        </Link>
                      </Button>
                      {item.formato === "JOGO" && !naLixeira ?
                        <Button size="sm" variant="secondary" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                          <Link href={`/docente/avaliacoes/${item.id}/jogo`}>
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            Jogar
                          </Link>
                        </Button>
                      : null}

                      {!naLixeira && item.podeEditar ?
                        <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                          <Link href={`/docente/avaliacoes/${item.id}/editar`}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Editar
                          </Link>
                        </Button>
                      : null}

                      {!naLixeira ?
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 whitespace-nowrap rounded-xl"
                            disabled={dupId === item.id}
                            onClick={() => void duplicar(item)}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            {dupId === item.id ? "Duplicando…" : "Duplicar"}
                          </Button>
                          <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                            <a href={`/api/docente/avaliacoes/${item.id}/pdf`} target="_blank" rel="noreferrer">
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              PDF
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                            <Link href={`/docente/turmas/${item.turma.id}`}>
                              <FileText className="mr-1.5 h-3.5 w-3.5" />
                              Turma
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 whitespace-nowrap rounded-xl text-destructive hover:bg-destructive/10"
                            disabled={busyId === item.id}
                            onClick={() => setMoverLixeiraId(item.id)}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Excluir
                          </Button>
                        </>
                      : <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 whitespace-nowrap rounded-xl"
                            disabled={busyId === item.id}
                            onClick={() => void restaurar(item.id)}
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Restaurar
                          </Button>
                          <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                            <a href={`/api/docente/avaliacoes/${item.id}/pdf`} target="_blank" rel="noreferrer">
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              PDF
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="shrink-0 whitespace-nowrap rounded-xl"
                            disabled={busyId === item.id || item.alunosComNotaCount > 0}
                            onClick={() => setApagarDefId(item.id)}
                            title={
                              item.alunosComNotaCount > 0 ?
                                "Não é possível apagar provas com notas lançadas."
                              : undefined
                            }
                          >
                            <Trash className="mr-1.5 h-3.5 w-3.5" />
                            Apagar definitivo
                          </Button>
                        </>
                      }
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <p>Questões: {item.questoesCount}</p>
                    <p>Objetivas: {item.questoesObjetivasCount}</p>
                    <p>Alunos com nota: {item.alunosComNotaCount}</p>
                  </div>
                  {!naLixeira && !item.podeEditar ?
                    <p className="mt-2 text-xs text-muted-foreground">
                      Edição bloqueada após lançar notas ou após participação no modo jogo.
                    </p>
                  : null}
                  {item.questaoPreview ?
                    <p className="mt-2 line-clamp-2 text-sm text-foreground/90">
                      Exemplo de questão: {item.questaoPreview}
                    </p>
                  : null}
                  {item.alunosPreview.length > 0 ?
                    <p className="mt-1 text-xs text-muted-foreground">
                      Alunos: {item.alunosPreview.join(", ")}
                    </p>
                  : null}
                </article>
              );
            })}

            {!loading && rows.length === 0 ?
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-6 py-10 text-center text-sm text-muted-foreground">
                Nenhuma avaliação encontrada com esse filtro.
              </div>
            : null}
          </section>
        </div>
      </DashboardMainLayout>

      <AlertDialog open={Boolean(moverLixeiraId)} onOpenChange={(o) => !o && setMoverLixeiraId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para a lixeira?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemMover ?
                <>
                  A prova <strong>{itemMover.titulo}</strong> sai da lista principal. Sessões de jogo
                  em aberto serão encerradas e os PINs deixam de funcionar. Você pode restaurar depois.
                </>
              : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (moverLixeiraId) void moverParaLixeira(moverLixeiraId);
              }}
            >
              Mover para lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(apagarDefId)} onOpenChange={(o) => !o && setApagarDefId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemApagar ?
                <>
                  A prova <strong>{itemApagar.titulo}</strong> e todas as questões serão removidas do
                  sistema. Só é permitido quando não há notas lançadas.
                </>
              : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (apagarDefId) void apagarDefinitivamente(apagarDefId);
              }}
            >
              Apagar para sempre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
