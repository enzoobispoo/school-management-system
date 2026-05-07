"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useOperacaoPage } from "@/hooks/operacao/use-operacao-page";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function diasAbertosDesde(createdAtIso: string) {
  const t = new Date(createdAtIso).getTime();
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

interface PlaybookRow {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

const severityStyle: Record<string, string> = {
  CRITICAL: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  WARNING: "bg-amber-500 text-white hover:bg-amber-500/90",
  INFO: "bg-sky-600 text-white hover:bg-sky-600/90",
};

const categoryLabel: Record<string, string> = {
  FINANCE: "Financeiro",
  ACADEMIC: "Acadêmico",
  ENROLLMENT: "Matrícula",
  SYSTEM: "Sistema",
};

const statusLabel: Record<string, string> = {
  OPEN: "Aberto",
  ACKNOWLEDGED: "Em tratativa",
  RESOLVED: "Resolvido",
  DISMISSED: "Dispensado",
};

type ViewerSchoolsPayload = {
  loaded: boolean;
  schools: { id: string; nome: string }[];
  role: string | null;
};

export function OperacaoPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolIdFromUrl = searchParams.get("schoolId");

  const [viewerSchools, setViewerSchools] = useState<ViewerSchoolsPayload>({
    loaded: false,
    schools: [],
    role: null,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/schools", { cache: "no-store" });
        const j = await res.json();
        if (!cancelled) {
          setViewerSchools({
            loaded: true,
            schools: Array.isArray(j.schools) ? j.schools : [],
            role: typeof j.role === "string" ? j.role : null,
          });
        }
      } catch {
        if (!cancelled) {
          setViewerSchools({ loaded: true, schools: [], role: null });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!viewerSchools.loaded || viewerSchools.role !== "SUPER_ADMIN") return;
    if (viewerSchools.schools.length <= 1) return;
    if (schoolIdFromUrl) return;
    const first = viewerSchools.schools[0]?.id;
    if (!first) return;
    router.replace(`/operacao?schoolId=${first}`, { scroll: false });
  }, [viewerSchools, schoolIdFromUrl, router]);

  const effectiveScopedSchoolId =
    viewerSchools.role === "SUPER_ADMIN"
      ? schoolIdFromUrl ??
        (viewerSchools.schools.length === 1
          ? viewerSchools.schools[0]?.id ?? null
          : null)
      : null;

  const operacaoFetchEnabled =
    viewerSchools.loaded &&
    (viewerSchools.role !== "SUPER_ADMIN" || Boolean(effectiveScopedSchoolId));

  const op = useOperacaoPage({
    scopedSchoolId: effectiveScopedSchoolId,
    fetchEnabled: operacaoFetchEnabled,
  });

  const [dismissOpen, setDismissOpen] = useState(false);
  const [dismissId, setDismissId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [playbooksOpen, setPlaybooksOpen] = useState(false);
  const [playbooks, setPlaybooks] = useState<PlaybookRow[]>([]);
  const [canManagePlaybooks, setCanManagePlaybooks] = useState(false);
  const [playbooksLoaded, setPlaybooksLoaded] = useState(false);
  const [patchingPlaybookCode, setPatchingPlaybookCode] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/operacao/playbooks", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const j = await res.json();
        if (!cancelled) {
          setPlaybooks(Array.isArray(j.playbooks) ? j.playbooks : []);
          setCanManagePlaybooks(Boolean(j.canManage));
        }
      } catch {
        if (!cancelled) setPlaybooks([]);
      } finally {
        if (!cancelled) setPlaybooksLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function togglePlaybook(code: string, active: boolean) {
    try {
      setPatchingPlaybookCode(code);
      const res = await fetch(`/api/operacao/playbooks/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Falha ao salvar");
      }
      const updated = (await res.json()) as PlaybookRow;
      setPlaybooks((prev) =>
        prev.map((p) => (p.code === updated.code ? { ...p, ...updated } : p))
      );
      toast.success(active ? "Playbook ativado." : "Playbook desativado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar playbook");
    } finally {
      setPatchingPlaybookCode(null);
    }
  }

  async function handleDismissSubmit() {
    if (!dismissId) return;
    try {
      await op.patchIncident(dismissId, "dismiss", dismissReason.trim());
      toast.success("Incidente dispensado.");
      setDismissOpen(false);
      setDismissReason("");
      setDismissId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao dispensar");
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Central operacional"
        description="Problemas detectados automaticamente, com causa provável e próximos passos sugeridos."
      />

      <div className="space-y-6 px-6 pb-10">
        {!viewerSchools.loaded ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando permissões…
          </div>
        ) : null}

        {viewerSchools.loaded &&
        viewerSchools.role === "SUPER_ADMIN" &&
        viewerSchools.schools.length === 0 ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-foreground">
            Nenhuma escola ativa encontrada. Cadastre ou ative uma escola para usar a Central operacional com perfil de plataforma.
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={op.statusFilter || "all"}
                onValueChange={(v) => {
                  op.setPage(1);
                  op.setStatusFilter(v === "all" ? "" : v);
                }}
              >
                <SelectTrigger className="w-[200px] rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="OPEN">Abertos</SelectItem>
                  <SelectItem value="ACKNOWLEDGED">Em tratativa</SelectItem>
                  <SelectItem value="RESOLVED">Resolvidos</SelectItem>
                  <SelectItem value="DISMISSED">Dispensados</SelectItem>
                </SelectContent>
              </Select>

              {viewerSchools.loaded &&
              viewerSchools.role === "SUPER_ADMIN" &&
              viewerSchools.schools.length > 1 ? (
                <Select
                  value={effectiveScopedSchoolId ?? ""}
                  onValueChange={(id) =>
                    router.replace(`/operacao?schoolId=${id}`, { scroll: false })
                  }
                >
                  <SelectTrigger className="min-w-[220px] max-w-[320px] rounded-xl">
                    <SelectValue placeholder="Escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {viewerSchools.schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            <Button
              type="button"
              className="rounded-full gap-2 sm:shrink-0"
              disabled={op.evaluating || !operacaoFetchEnabled}
              onClick={() =>
                void op.evaluateNow().then((ok) =>
                  ok
                    ? toast.success("Avaliação concluída.")
                    : toast.error("Não foi possível avaliar agora.")
                )
              }
            >
              {op.evaluating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Avaliar agora
            </Button>
          </div>
          {!op.canDismissIncidents ? (
            <p className="text-xs text-muted-foreground">
              Dispensar incidentes é restrito a administradores; demais papéis podem marcar em tratativa ou resolvido.
            </p>
          ) : null}
        </div>

        {op.error ? (
          <div className="rounded-3xl border border-destructive/25 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            {op.error}
          </div>
        ) : null}

        {!operacaoFetchEnabled &&
        viewerSchools.loaded &&
        viewerSchools.role === "SUPER_ADMIN" &&
        viewerSchools.schools.length > 0 &&
        !effectiveScopedSchoolId ? (
          <div className="rounded-[24px] border border-border/50 bg-card p-10 text-center text-sm text-muted-foreground">
            Escolha uma escola para carregar incidentes (perfil de plataforma).
          </div>
        ) : op.loading ? (
          <div className="rounded-[24px] border border-border/50 bg-card p-10 text-center text-sm text-muted-foreground">
            Carregando incidentes…
          </div>
        ) : op.incidents.length === 0 ? (
          <div className="rounded-[24px] border border-border/50 bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhum incidente neste filtro. Use &quot;Avaliar agora&quot; ou aguarde o cron horário.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {op.incidents.map((inc) => (
              <li
                key={inc.id}
                className={cn(
                  "rounded-[22px] border border-border/60 bg-card p-5 shadow-sm",
                  inc.status === "OPEN" && inc.severity === "CRITICAL" && "border-destructive/35"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("rounded-full text-[11px]", severityStyle[inc.severity])}>
                        {inc.severity}
                      </Badge>
                      <Badge variant="outline" className="rounded-full text-[11px]">
                        {categoryLabel[inc.category] ?? inc.category}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full text-[11px]">
                        {statusLabel[inc.status] ?? inc.status}
                      </Badge>
                      {inc.playbookCode ? (
                        <span className="text-[11px] text-muted-foreground">
                          playbook: {inc.playbookCode}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">{inc.title}</h2>
                    <p className="text-sm text-muted-foreground">{inc.description}</p>
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">Diagnóstico: </span>
                      {inc.problemStatement}
                    </div>
                    {inc.impactHint ? (
                      <p className="text-xs text-muted-foreground">
                        Impacto: {inc.impactHint}
                      </p>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      Última detecção:{" "}
                      {new Date(inc.lastDetectedAt).toLocaleString("pt-BR")}
                      {inc.createdAt ? (
                        <>
                          {" "}
                          · Aberto há {diasAbertosDesde(inc.createdAt)} dia(s)
                        </>
                      ) : null}
                    </div>
                    {inc.suggestedActions?.length ? (
                      <div className="pt-1">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Próximos passos sugeridos
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                          {inc.suggestedActions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {inc.category === "FINANCE" ? (
                      <Link
                        href="/financeiro"
                        className="inline-block text-sm font-medium text-primary hover:underline"
                      >
                        Abrir financeiro →
                      </Link>
                    ) : null}
                    {inc.category === "ACADEMIC" ? (
                      <Link
                        href="/turmas"
                        className="inline-block text-sm font-medium text-primary hover:underline"
                      >
                        Abrir turmas →
                      </Link>
                    ) : null}
                    {inc.category === "ENROLLMENT" ? (
                      <Link
                        href="/alunos"
                        className="inline-block text-sm font-medium text-primary hover:underline"
                      >
                        Abrir alunos →
                      </Link>
                    ) : null}
                    {inc.dismissReason ? (
                      <p className="text-xs text-muted-foreground">
                        Motivo do dispensa: {inc.dismissReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    {inc.status === "OPEN" ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full"
                          onClick={() =>
                            void op
                              .patchIncident(inc.id, "acknowledge")
                              .then(() => toast.success("Marcado como em tratativa."))
                              .catch(() => toast.error("Falha ao atualizar"))
                          }
                        >
                          Em tratativa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() =>
                            void op
                              .patchIncident(inc.id, "resolve")
                              .then(() => toast.success("Marcado como resolvido."))
                              .catch(() => toast.error("Falha ao atualizar"))
                          }
                        >
                          Resolver
                        </Button>
                        {op.canDismissIncidents ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-muted-foreground"
                            onClick={() => {
                              setDismissId(inc.id);
                              setDismissOpen(true);
                            }}
                          >
                            Dispensar…
                          </Button>
                        ) : null}
                      </>
                    ) : inc.status === "ACKNOWLEDGED" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() =>
                            void op
                              .patchIncident(inc.id, "resolve")
                              .then(() => toast.success("Marcado como resolvido."))
                              .catch(() => toast.error("Falha ao atualizar"))
                          }
                        >
                          Resolver
                        </Button>
                        {op.canDismissIncidents ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-muted-foreground"
                            onClick={() => {
                              setDismissId(inc.id);
                              setDismissOpen(true);
                            }}
                          >
                            Dispensar…
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {playbooksLoaded && playbooks.length > 0 ? (
          <Collapsible open={playbooksOpen} onOpenChange={setPlaybooksOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-muted/35">
              <span>Playbooks de detecção ({playbooks.length})</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  playbooksOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2 rounded-2xl border border-border/50 bg-card/40 p-4">
              <p className="text-xs text-muted-foreground">
                Cada playbook executa um detector e pode disparar notificações.{" "}
                {canManagePlaybooks
                  ? "Desative os que não fazem sentido para sua escola."
                  : "Somente administradores alteram playbooks."}
              </p>
              <ul className="divide-y divide-border/60 rounded-xl border border-border/50">
                {playbooks.map((pb) => (
                  <li
                    key={pb.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{pb.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {pb.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {pb.active ? "Ativo" : "Off"}
                      </span>
                      <Switch
                        checked={pb.active}
                        disabled={
                          !canManagePlaybooks || patchingPlaybookCode === pb.code
                        }
                        onCheckedChange={(v) => void togglePlaybook(pb.code, v)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        {op.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {op.meta.page} de {op.meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={op.page <= 1}
                onClick={() => op.setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={op.page >= op.meta.totalPages}
                onClick={() => op.setPage((p) => p + 1)}
              >
                Próximo
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={dismissOpen} onOpenChange={setDismissOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Dispensar incidente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Explique por que este alerta não se aplica — o sistema não reabrirá automaticamente enquanto estiver dispensado.
          </p>
          <Textarea
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="Motivo (mín. 3 caracteres)"
            className="min-h-[100px] rounded-xl"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDismissOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={dismissReason.trim().length < 3}
              onClick={() => void handleDismissSubmit()}
            >
              Confirmar dispensa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
