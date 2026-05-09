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
import {
  dashboardLocaleTag,
  useDashboardLanguage,
} from "@/lib/i18n/dashboard-language";
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
  const { t, language } = useDashboardLanguage();
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
    const debounceTimer = window.setTimeout(async () => {
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
        if (!res.ok)
          throw new Error(json.error || t("docente.avaliacoesList.loadListError"));
        setRows(Array.isArray(json) ? json : []);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : t("docente.avaliacoesList.loadErrorShort")
        );
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(debounceTimer);
  }, [query, refreshKey, aba, t]);

  async function duplicar(item: AvaliacaoListItem) {
    try {
      setDupId(item.id);
      const res = await fetch(`/api/docente/avaliacoes/${item.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || t("docente.avaliacoesList.duplicateFail"));
      const successMsg =
        typeof json.titulo === "string" ?
          t("docente.avaliacoesList.duplicateSuccessTitle", {
            title: json.titulo,
          })
        : t("docente.avaliacoesList.duplicateSuccessGeneric");
      toast.success(successMsg);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("docente.avaliacoesList.duplicateError")
      );
    } finally {
      setDupId(null);
    }
  }

  async function moverParaLixeira(id: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/docente/avaliacoes/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(json.error || t("docente.avaliacoesList.moveTrashFail"));
      toast.success(t("docente.avaliacoesList.movedTrash"));
      setMoverLixeiraId(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.errorShort"));
    } finally {
      setBusyId(null);
    }
  }

  async function restaurar(id: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/docente/avaliacoes/${id}/restore`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(json.error || t("docente.avaliacoesList.restoreFail"));
      toast.success(t("docente.avaliacoesList.restored"));
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.errorShort"));
    } finally {
      setBusyId(null);
    }
  }

  async function apagarDefinitivamente(id: string) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/docente/avaliacoes/${id}/permanent`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(json.error || t("docente.avaliacoesList.permanentFail"));
      toast.success(t("docente.avaliacoesList.permanentRemoved"));
      setApagarDefId(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.errorShort"));
    } finally {
      setBusyId(null);
    }
  }

  const subtitle = useMemo(() => {
    if (rows.length === 0) return t("docente.avaliacoesList.subtitleNone");
    return t("docente.avaliacoesList.subtitleCount", { count: rows.length });
  }, [rows.length, t]);

  const itemMover = rows.find((r) => r.id === moverLixeiraId);
  const itemApagar = rows.find((r) => r.id === apagarDefId);

  return (
    <DashboardLayout>
      <Header
        title={t("docente.avaliacoesList.title")}
        description={t("docente.avaliacoesList.description")}
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
                    {t("docente.avaliacoesList.tabActive")}
                  </TabsTrigger>
                  <TabsTrigger value="lixeira" className="rounded-lg px-4">
                    {t("docente.avaliacoesList.tabTrash")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("docente.avaliacoesList.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              <Button className="rounded-xl" asChild>
                <Link href="/docente/avaliacoes/nova">
                  <PenLine className="mr-2 h-4 w-4" />
                  {t("docente.avaliacoesList.newAssessment")}
                </Link>
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {loading ? t("docente.avaliacoesList.searching") : subtitle}
            </p>
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
                        {new Date(item.dataAvaliacao).toLocaleDateString(
                          dashboardLocaleTag(language)
                        )}{" "}
                        •{" "}
                        {item.formato === "JOGO" ?
                          t("docente.avaliacoesList.modeGame")
                        : t("docente.avaliacoesList.modeClassic")}
                        {naLixeira ? ` • ${t("docente.avaliacoesList.inTrashSuffix")}` : ""}
                      </p>
                    </div>
                    <div
                      role="toolbar"
                      aria-label={t("docente.avaliacoesList.toolbarAria")}
                      className="-mx-1 flex min-h-11 min-w-0 w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto overscroll-x-contain px-1 py-0.5 sm:w-auto sm:max-w-[min(100%,28rem)] sm:justify-end md:max-w-[min(100%,34rem)] lg:max-w-[min(100%,40rem)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
                    >
                      <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                        <Link href={`/docente/avaliacoes/${item.id}/ver`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          {t("docente.avaliacoesList.view")}
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                        <Link href={`/docente/avaliacoes/${item.id}/quadro`}>
                          <Presentation className="mr-1.5 h-3.5 w-3.5" />
                          {t("docente.avaliacoesList.board")}
                        </Link>
                      </Button>
                      {item.formato === "JOGO" && !naLixeira ?
                        <Button size="sm" variant="secondary" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                          <Link href={`/docente/avaliacoes/${item.id}/jogo`}>
                            <Play className="mr-1.5 h-3.5 w-3.5" />
                            {t("docente.avaliacoesList.play")}
                          </Link>
                        </Button>
                      : null}

                      {!naLixeira && item.podeEditar ?
                        <Button size="sm" variant="outline" className="shrink-0 whitespace-nowrap rounded-xl" asChild>
                          <Link href={`/docente/avaliacoes/${item.id}/editar`}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            {t("docente.avaliacoesList.edit")}
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
                            {dupId === item.id ?
                              t("docente.avaliacoesList.duplicating")
                            : t("docente.avaliacoesList.duplicate")}
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
                              {t("docente.avaliacoesList.classLink")}
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
                            {t("docente.avaliacoesList.delete")}
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
                            {t("docente.avaliacoesList.restore")}
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
                                t("docente.avaliacoesList.permanentDisabledTooltip")
                              : undefined
                            }
                          >
                            <Trash className="mr-1.5 h-3.5 w-3.5" />
                            {t("docente.avaliacoesList.permanentDelete")}
                          </Button>
                        </>
                      }
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <p>
                      {t("docente.avaliacoesList.statsQuestions", {
                        count: item.questoesCount,
                      })}
                    </p>
                    <p>
                      {t("docente.avaliacoesList.statsObjectives", {
                        count: item.questoesObjetivasCount,
                      })}
                    </p>
                    <p>
                      {t("docente.avaliacoesList.statsGraded", {
                        count: item.alunosComNotaCount,
                      })}
                    </p>
                  </div>
                  {!naLixeira && !item.podeEditar ?
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("docente.avaliacoesList.editBlockedHint")}
                    </p>
                  : null}
                  {item.questaoPreview ?
                    <p className="mt-2 line-clamp-2 text-sm text-foreground/90">
                      Exemplo de questão: {item.questaoPreview}
                    </p>
                  : null}
                  {item.alunosPreview.length > 0 ?
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("docente.avaliacoesList.studentsPreview", {
                        list: item.alunosPreview.join(", "),
                      })}
                    </p>
                  : null}
                </article>
              );
            })}

            {!loading && rows.length === 0 ?
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-6 py-10 text-center text-sm text-muted-foreground">
                {t("docente.avaliacoesList.emptyFilter")}
              </div>
            : null}
          </section>
        </div>
      </DashboardMainLayout>

      <AlertDialog open={Boolean(moverLixeiraId)} onOpenChange={(o) => !o && setMoverLixeiraId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("docente.avaliacoesList.dialogMoveTrashTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {itemMover ?
                t("docente.avaliacoesList.dialogMoveTrashDesc", {
                  title: itemMover.titulo,
                })
              : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("chat.dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (moverLixeiraId) void moverParaLixeira(moverLixeiraId);
              }}
            >
              {t("docente.avaliacoesList.dialogMoveTrashConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(apagarDefId)} onOpenChange={(o) => !o && setApagarDefId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("docente.avaliacoesList.dialogPermanentTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemApagar ?
                t("docente.avaliacoesList.dialogPermanentDesc", {
                  title: itemApagar.titulo,
                })
              : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("chat.dialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (apagarDefId) void apagarDefinitivamente(apagarDefId);
              }}
            >
              {t("docente.avaliacoesList.dialogPermanentConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
