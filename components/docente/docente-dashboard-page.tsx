"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpenText,
  CheckCircle2,
  Clock3,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileText,
  FileStack,
  Inbox,
  Loader2,
  MessageSquare,
  PanelRight,
  PenLine,
  RefreshCw,
  Shuffle,
  SlidersHorizontal,
  Target,
  TimerReset,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { DocenteDashboardCalendar } from "@/components/docente/docente-dashboard-calendar";
import { DocenteQuickPanel } from "@/components/docente/docente-quick-panel";
import { DocenteEduiaSidePanel } from "@/components/docente/docente-eduia-side-panel";
import { DocenteGreeting } from "@/components/docente/docente-greeting";
import type { OverviewTurmaLike } from "@/components/docente/docente-dashboard-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OverviewResponse = {
  needsLink: boolean;
  professor: { id: string; nome: string } | null;
  turmas: OverviewTurmaLike[];
  diaHojeLabel: string;
  metricas: {
    turmasAtivas: number;
    alunosTotal: number;
    turmasComAulaHoje: number;
  };
  trocasPendentes?: number;
};

function MetricPill(props: {
  label: string;
  value: string;
  loading: boolean;
  tone?: string;
}) {
  const { label, value, loading, tone } = props;
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-2.5 backdrop-blur-sm",
        tone ?? "border-border/50 bg-muted/25 dark:border-border/60 dark:bg-muted/30"
      )}
    >
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <div className="mt-1 h-7 w-12 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-foreground">
          {value}
        </p>
      )}
    </div>
  );
}

type TileSpec = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const WORKSPACE_TILES: TileSpec[] = [
  {
    id: "eduia",
    title: "EduIA",
    description:
      "Copiloto do workspace: turmas titulares, avisos e planejamento de avaliações.",
    href: "/docente/eduia",
    icon: PanelRight,
  },
  {
    id: "materiais",
    title: "Materiais",
    description: "Ambientes para slides, provas impressas e atividades em arquivo.",
    href: "/docente/materiais",
    icon: FileStack,
  },
  {
    id: "avaliacao",
    title: "Nova avaliação",
    description: "Crie prova ou atividade avaliada na turma para lançar notas.",
    href: "/docente/avaliacoes/nova",
    icon: PenLine,
  },
  {
    id: "mensagens",
    title: "Mensagens",
    description: "Converse com professores e gestores; envie texto e anexos.",
    href: "/mensagens",
    icon: MessageSquare,
  },
  {
    id: "turmas",
    title: "Turmas",
    description: "Chamadas, diário, boletins e registros por turma.",
    href: "/docente#turmas-docente",
    icon: ClipboardList,
  },
  {
    id: "agenda",
    title: "Agenda",
    description: "Calendário da escola e compromissos.",
    href: "/calendario/eventos",
    icon: CalendarDays,
  },
  {
    id: "avisos",
    title: "Avisos",
    description: "Caixa de notificações (sem financeiro no seu perfil).",
    href: "/notificacoes",
    icon: Bell,
  },
];

const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  minAttendancePercent: 75,
  minAttendanceSamples: 4,
  minGrade: 6,
  minGradeSamples: 2,
  weeklyCallsTarget: 10,
  weeklyAssessmentsTarget: 2,
  weeklyGradesTarget: 8,
};

/** Tons coloridos discretos (família azul–índigo–teal) para combinar entre si. */
const COLOR_CARD_TONES = [
  "border-slate-200/75 bg-slate-50/90 dark:border-slate-500/22 dark:bg-slate-500/[0.065]",
  "border-blue-200/45 bg-blue-50/78 dark:border-blue-400/17 dark:bg-blue-500/[0.065]",
  "border-indigo-200/42 bg-indigo-50/74 dark:border-indigo-400/16 dark:bg-indigo-500/[0.055]",
  "border-cyan-200/40 bg-cyan-50/70 dark:border-cyan-400/14 dark:bg-cyan-500/[0.055]",
  "border-sky-200/42 bg-sky-50/74 dark:border-sky-400/15 dark:bg-sky-500/[0.055]",
  "border-teal-200/38 bg-teal-50/68 dark:border-teal-400/13 dark:bg-teal-500/[0.05]",
];

type DashboardInsights = {
  configAplicada: DashboardConfig;
  pendenciasDia: {
    chamadasParaFechar: number;
    avaliacoesSemNota: number;
    trocasPendentes: number;
  };
  proximaAula: {
    turmaId: string;
    turmaNome: string;
    cursoNome: string;
    diaLabel: string;
    horaInicio: string;
    horaFim: string;
    startsInMinutes: number;
  } | null;
  agendaDidatica:
    | ({
        turmaId: string;
        turmaNome: string;
        cursoNome: string;
        diaLabel: string;
        horaInicio: string;
        horaFim: string;
        startsInMinutes: number;
      } & {
        materiaisRecentes: number;
        planoAulaMaisRecente: string | null;
      })
    | null;
  filaAcoes: {
    id: string;
    titulo: string;
    href: string;
    tipo: "CHAMADA" | "NOTA" | "TROCA" | "ALERTA";
  }[];
  lancamentosRecentes: {
    id: string;
    tipo: "AVALIACAO" | "CHAMADA" | "NOTA";
    titulo: string;
    turmaNome: string;
    createdAt: string;
  }[];
  inboxPedagogica: {
    id: string;
    titulo: string;
    tipo: string;
    lida: boolean;
    createdAt: string;
    mensagemPreview: string;
  }[];
  resumoTurmas: {
    turmaId: string;
    turmaNome: string;
    cursoNome: string;
    frequenciaAtual: number;
    frequenciaTendencia: number;
    mediaAtual: number;
    mediaTendencia: number;
  }[];
  metasPorDisciplina: {
    disciplinaId: string;
    disciplinaNome: string;
    aulas: { concluidas: number; meta: number };
    avaliacoes: { concluidas: number; meta: number };
  }[];
  alertasPedagogicos: {
    id: string;
    tipo: "FREQUENCIA_BAIXA" | "RENDIMENTO_BAIXO";
    alunoNome: string;
    turmaNome: string;
    detalhe: string;
    explicacao: string;
  }[];
  relatorioSemanal: {
    resumo: string;
    prioridades: string[];
  };
  checklistSemanal: {
    chamadas: { concluidas: number; total: number };
    avaliacoes: { concluidas: number; total: number };
    notas: { concluidas: number; total: number };
  };
};

type DashboardConfig = {
  minAttendancePercent: number;
  minAttendanceSamples: number;
  minGrade: number;
  minGradeSamples: number;
  weeklyCallsTarget: number;
  weeklyAssessmentsTarget: number;
  weeklyGradesTarget: number;
};

function WorkspaceTileLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTurmas = href.includes("#turmas-docente");
  return (
    <Link
      href={href}
      scroll={isTurmas ? false : undefined}
      className={className}
      onClick={(e) => {
        if (isTurmas && pathname === "/docente") {
          e.preventDefault();
          window.location.hash = "turmas-docente";
        }
      }}
    >
      {children}
    </Link>
  );
}

export function DocenteDashboardPage() {
  const searchParams = useSearchParams();
  const initialAiPrompt = searchParams.get("ai")?.trim() ?? "";

  const [data, setData] = useState<OverviewResponse | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState<DashboardConfig | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkWorking, setLinkWorking] = useState(false);
  const [editingShortcuts, setEditingShortcuts] = useState(false);
  const [editingThresholds, setEditingThresholds] = useState(false);
  const [turmaView, setTurmaView] = useState<"all" | "today" | "attention">("all");
  const [visualTheme, setVisualTheme] = useState<"elegante" | "colorido" | "aurora" | "sunset">(
    "elegante"
  );
  const [configDraft, setConfigDraft] = useState<DashboardConfig>(
    DEFAULT_DASHBOARD_CONFIG
  );
  const [shortcutIds, setShortcutIds] = useState<string[]>([
    "agenda",
    "turmas",
    "avaliacao",
    "mensagens",
  ]);
  const autoLinkAttempted = useRef(false);
  const hasLocalProfileConfig = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/docente/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Não foi possível carregar.");
      }
      setData(json as OverviewResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("docente.dashboard.shortcuts");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const valid = parsed
        .map((id) => String(id))
        .filter((id) => WORKSPACE_TILES.some((tile) => tile.id === id))
        .slice(0, 4);
      if (valid.length > 0) setShortcutIds(valid);
    } catch {
      /* noop */
    }
    try {
      const rawConfig = window.localStorage.getItem("docente.dashboard.profileConfig");
      if (!rawConfig) return;
      const parsed = JSON.parse(rawConfig) as Partial<DashboardConfig>;
      hasLocalProfileConfig.current = true;
      setConfigDraft((current) => ({
        ...current,
        ...parsed,
      }));
    } catch {
      /* noop */
    }
    try {
      const rawTheme = window.localStorage.getItem("docente.dashboard.visualTheme");
      if (rawTheme === "colorido" || rawTheme === "aurora" || rawTheme === "sunset" || rawTheme === "elegante") {
        setVisualTheme(rawTheme);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("docente.dashboard.visualTheme", visualTheme);
    } catch {
      /* noop */
    }
  }, [visualTheme]);

  useEffect(() => {
    if (loading || !data?.needsLink || autoLinkAttempted.current) return;
    autoLinkAttempted.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/docente/link-professor", {
          method: "POST",
        });
        const j = (await res.json()) as { ok?: boolean };
        if (res.ok && j.ok) await load();
      } catch {
        /* falha silenciosa */
      }
    })();
  }, [loading, data?.needsLink, load]);

  async function manualTryLink() {
    try {
      setLinkWorking(true);
      const res = await fetch("/api/docente/link-professor", { method: "POST" });
      const j = await res.json();
      if (res.ok && j.ok) {
        toast.success("Conta vinculada ao seu cadastro de professor.");
        await load();
        return;
      }
      toast.error(
        typeof j.message === "string"
          ? j.message
          : "Ainda não foi possível vincular. Confira o checklist abaixo."
      );
    } catch {
      toast.error("Erro de rede. Tente novamente.");
    } finally {
      setLinkWorking(false);
    }
  }

  useEffect(() => {
    if (!data || loading) return;
    if (typeof window === "undefined") return;

    const scrollTurmas = () => {
      if (window.location.hash !== "#turmas-docente") return;
      requestAnimationFrame(() => {
        document
          .getElementById("turmas-docente")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    scrollTurmas();
    window.addEventListener("hashchange", scrollTurmas);
    return () => window.removeEventListener("hashchange", scrollTurmas);
  }, [data, loading]);

  useEffect(() => {
    if (loading || !data || data.needsLink) {
      setInsights(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setInsightsLoading(true);
        const params = new URLSearchParams({
          minAttendancePercent: String(configDraft.minAttendancePercent),
          minAttendanceSamples: String(configDraft.minAttendanceSamples),
          minGrade: String(configDraft.minGrade),
          minGradeSamples: String(configDraft.minGradeSamples),
          weeklyCallsTarget: String(configDraft.weeklyCallsTarget),
          weeklyAssessmentsTarget: String(configDraft.weeklyAssessmentsTarget),
          weeklyGradesTarget: String(configDraft.weeklyGradesTarget),
        });
        const res = await fetch(`/api/docente/dashboard-insights?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Falha ao carregar insights.");
        }
        if (!cancelled) setInsights(json as DashboardInsights);
      } catch {
        if (!cancelled) setInsights(null);
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, data, configDraft]);

  useEffect(() => {
    if (loading || !data || data.needsLink) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings/docente-dashboard", {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.schoolConfig) return;
        if (!cancelled) setSchoolConfig(json.schoolConfig as DashboardConfig);
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, data]);

  useEffect(() => {
    if (!schoolConfig || hasLocalProfileConfig.current) return;
    setConfigDraft(schoolConfig);
  }, [schoolConfig]);

  const metricas = data?.metricas ?? {
    turmasAtivas: 0,
    alunosTotal: 0,
    turmasComAulaHoje: 0,
  };
  const proximaAula = insights?.proximaAula ?? null;
  const agendaDidatica = insights?.agendaDidatica ?? null;

  const trocaLabel =
    (data?.trocasPendentes ?? 0) > 0 ? String(data?.trocasPendentes) : undefined;

  const tilesWithTrocas: TileSpec[] =
    (data?.trocasPendentes ?? 0) > 0 ?
      [
        ...WORKSPACE_TILES,
        {
          id: "trocas",
          title: "Trocas de turma",
          description: "Convites da escola para assumir titularidade — confirme aqui.",
          href: "/docente/trocas",
          icon: Shuffle,
          badge: trocaLabel,
        },
      ]
    : WORKSPACE_TILES;

  const shortcutTiles = shortcutIds
    .map((id) => tilesWithTrocas.find((t) => t.id === id))
    .filter((tile): tile is TileSpec => Boolean(tile));

  const resumoTurmaById = new Map(
    (insights?.resumoTurmas ?? []).map((t) => [t.turmaId, t] as const)
  );
  const turmasComAlerta = new Set(
    (insights?.alertasPedagogicos ?? []).map((alerta) => alerta.turmaNome)
  );
  const filteredTurmas = (data?.turmas ?? []).filter((turma) => {
    if (turmaView === "today") return turma.horariosHoje.length > 0;
    if (turmaView === "attention") {
      const resumo = resumoTurmaById.get(turma.id);
      const hasTrendDrop =
        (resumo?.frequenciaTendencia ?? 0) < 0 || (resumo?.mediaTendencia ?? 0) < 0;
      return hasTrendDrop || turmasComAlerta.has(turma.nome);
    }
    return true;
  });
  const resumoDoDia = (data?.turmas ?? [])
    .flatMap((turma) =>
      turma.horariosHoje.map((h) => ({
        turmaId: turma.id,
        turmaNome: turma.nome,
        horaInicio: h.horaInicio,
        horaFim: h.horaFim,
      }))
    )
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  const themeHeroClass =
    visualTheme === "colorido"
      ? "bg-[linear-gradient(125deg,rgba(96,165,250,0.07),rgba(129,140,248,0.085))]"
      : visualTheme === "aurora"
      ? "bg-[linear-gradient(125deg,rgba(34,211,238,0.065),rgba(99,102,241,0.085))]"
      : visualTheme === "sunset"
      ? "bg-[linear-gradient(125deg,rgba(251,191,36,0.065),rgba(251,207,232,0.09))]"
      : "bg-card/55";
  const isColorfulTheme = visualTheme !== "elegante";
  const tone = (index: number) =>
    isColorfulTheme ? COLOR_CARD_TONES[index % COLOR_CARD_TONES.length] : "border-border/60 bg-card/55";

  function toggleShortcut(tileId: string) {
    setShortcutIds((current) => {
      const exists = current.includes(tileId);
      const next = exists
        ? current.filter((id) => id !== tileId)
        : [...current, tileId].slice(0, 4);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "docente.dashboard.shortcuts",
          JSON.stringify(next)
        );
      }
      return next;
    });
  }

  function updateConfig<K extends keyof DashboardConfig>(
    key: K,
    rawValue: string,
    integer = true
  ) {
    const parsed = integer ? Number.parseInt(rawValue, 10) : Number(rawValue);
    if (Number.isNaN(parsed)) return;
    setConfigDraft((current) => ({ ...current, [key]: parsed }));
  }

  function saveProfileConfig() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "docente.dashboard.profileConfig",
      JSON.stringify(configDraft)
    );
    toast.success("Critérios do seu perfil salvos.");
  }

  async function saveSchoolConfig() {
    try {
      const res = await fetch("/api/settings/docente-dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configDraft),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Falha ao salvar configuração da escola.");
      }
      setSchoolConfig(json.schoolConfig as DashboardConfig);
      toast.success("Padrão da escola atualizado para perfil professor.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sem permissão para salvar na escola.");
    }
  }

  function resetFromSchoolConfig() {
    setConfigDraft(schoolConfig ?? DEFAULT_DASHBOARD_CONFIG);
  }

  return (
    <DashboardLayout>
      <Header
        title="Painel docente"
        description="Gestão premium de turmas, avaliações, materiais e rotina pedagógica."
      />

      <DashboardMainLayout
        rightPanel={
          <DocenteEduiaSidePanel
            professorNome={data?.professor?.nome ?? null}
            loading={loading}
            needsLink={data?.needsLink ?? false}
            initialPrompt={initialAiPrompt}
            layout="sidebar"
          />
        }
      >
        <div className="relative space-y-10 pb-16 pt-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-6 h-72 rounded-[28px] bg-[radial-gradient(ellipse_72%_52%_at_50%_-8%,hsl(var(--primary)/0.12),transparent)] dark:bg-[radial-gradient(ellipse_72%_52%_at_50%_-8%,hsl(var(--primary)/0.2),transparent)]"
          />

          <section className={`relative overflow-hidden rounded-2xl border border-border/55 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl dark:border-white/[0.07] sm:p-8 ${themeHeroClass}`}>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl flex-1 space-y-4">
                <DocenteGreeting
                  variant="workspace"
                  loading={loading}
                  needsLink={data?.needsLink ?? false}
                  professorNome={data?.professor?.nome}
                  diaHojeLabel={data?.diaHojeLabel ?? "—"}
                  footer={
                    !loading &&
                    data &&
                    !data.needsLink &&
                    (data.trocasPendentes ?? 0) > 0 ? (
                      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 font-mono text-[11px] text-foreground">
                        <span className="font-semibold tracking-wide">
                          {data.trocasPendentes}{" "}
                          {data.trocasPendentes === 1 ? "convite de troca" : "convites de troca"}
                        </span>
                        .{" "}
                        <Link
                          href="/docente/trocas"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Responder agora
                        </Link>
                      </div>
                    ) : null
                  }
                />

                {!loading && data?.needsLink ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Conclua o vínculo com seu cadastro de professor para liberar turmas, avaliações e mensagens.
                  </p>
                ) : null}
              </div>

              <div className="flex w-full flex-col gap-4 lg:w-auto lg:min-w-[280px] lg:items-end">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-md lg:max-w-none">
                  <MetricPill
                    label="Turmas"
                    value={String(metricas.turmasAtivas)}
                    loading={loading}
                    tone={isColorfulTheme ? tone(0) : undefined}
                  />
                  <MetricPill
                    label="Alunos"
                    value={String(metricas.alunosTotal)}
                    loading={loading}
                    tone={isColorfulTheme ? tone(1) : undefined}
                  />
                  <MetricPill
                    label="Hoje"
                    value={String(metricas.turmasComAulaHoje)}
                    loading={loading}
                    tone={isColorfulTheme ? tone(2) : undefined}
                  />
                </div>

                {!loading && data && !data.needsLink ? (
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    <Button size="sm" variant="secondary" className="rounded-xl font-medium" asChild>
                      <Link href="/docente/avaliacoes/nova">
                        <PenLine className="mr-2 h-3.5 w-3.5" />
                        Nova avaliação
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl border-border/70 dark:border-white/[0.08]" asChild>
                      <Link href="/mensagens">
                        <MessageSquare className="mr-2 h-3.5 w-3.5" />
                        Mensagens
                      </Link>
                    </Button>
                    <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/70 p-1 backdrop-blur">
                      {[
                        { id: "elegante", label: "Elegante" },
                        { id: "colorido", label: "Colorido" },
                        { id: "aurora", label: "Aurora" },
                        { id: "sunset", label: "Sunset" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setVisualTheme(opt.id as typeof visualTheme)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                            visualTheme === opt.id
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {false ? <DocenteQuickPanel
            sticky={false}
            diaHojeLabel={data?.diaHojeLabel ?? "—"}
            turmas={data?.turmas ?? []}
            needsLink={data?.needsLink ?? false}
            loading={loading}
          /> : null}

          {!loading && data && !data.needsLink ? (
            <section className={`space-y-4 rounded-2xl border p-5 ${
              visualTheme === "colorido"
                ? "border-blue-200/55 bg-[linear-gradient(165deg,rgba(191,219,254,0.35),rgba(199,210,254,0.28))] dark:border-blue-400/22 dark:bg-[linear-gradient(165deg,rgba(37,99,235,0.12),rgba(79,70,229,0.1))]"
                : visualTheme === "aurora"
                ? "border-teal-200/50 bg-[linear-gradient(165deg,rgba(167,243,208,0.32),rgba(199,210,254,0.26))] dark:border-teal-400/20 dark:bg-[linear-gradient(165deg,rgba(20,184,166,0.11),rgba(79,70,229,0.09))]"
                : visualTheme === "sunset"
                ? "border-amber-200/50 bg-[linear-gradient(165deg,rgba(254,215,170,0.38),rgba(252,231,243,0.3))] dark:border-amber-400/22 dark:bg-[linear-gradient(165deg,rgba(245,158,11,0.1),rgba(219,39,119,0.07))]"
                : "border-border/60 bg-card/70 dark:bg-zinc-900/55"
            }`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Resumo do dia
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.diaHojeLabel}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {resumoDoDia.length === 0 ? (
                  <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
                    Sem aulas no dia de hoje.
                  </div>
                ) : (
                  resumoDoDia.map((item) => (
                    <Link
                      key={`${item.turmaId}-${item.horaInicio}`}
                      href={`/docente/turmas/${item.turmaId}`}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-4 py-3 transition",
                        isColorfulTheme
                          ? "border-white/40 bg-white/45 hover:bg-white/65 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                          : "border-border/60 bg-muted/10 hover:bg-muted/20"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.turmaNome}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.horaInicio}-{item.horaFim}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))
                )}
              </div>

              <div className="border-t border-border/50 pt-4">
                <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Atalhos
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { href: "/calendario/eventos", label: "Calendário" },
                    { href: "/notificacoes", label: "Notificações" },
                    { href: "/mensagens", label: "Mensagens" },
                    { href: "/docente/avaliacoes/nova", label: "Avaliações" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm transition hover:text-foreground",
                        isColorfulTheme
                          ? "border-white/40 bg-white/45 text-foreground/80 hover:bg-white/65 dark:border-white/15 dark:bg-white/5"
                          : "border-border/60 bg-muted/10 text-muted-foreground hover:bg-muted/20"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {!loading && data && !data.needsLink && false ? (
            <section className="grid gap-4 xl:grid-cols-3">
              <Card className="rounded-2xl border-border/60 bg-card/55 xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pendências do dia</CardTitle>
                  <CardDescription>
                    O que precisa da sua atenção imediata.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Chamadas para fechar
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {insightsLoading ? "..." : (insights?.pendenciasDia.chamadasParaFechar ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Avaliações sem nota
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {insightsLoading ? "..." : (insights?.pendenciasDia.avaliacoesSemNota ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Trocas pendentes
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {insightsLoading ? "..." : (insights?.pendenciasDia.trocasPendentes ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                    Próxima aula
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!proximaAula ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma aula futura com horário cadastrado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        {proximaAula?.turmaNome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {proximaAula?.cursoNome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {proximaAula?.diaLabel} • {proximaAula?.horaInicio} –{" "}
                        {proximaAula?.horaFim}
                      </p>
                      <Button size="sm" variant="secondary" className="mt-2 rounded-xl" asChild>
                        <Link href={`/docente/turmas/${proximaAula!.turmaId}`}>
                          Abrir turma
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {!loading && data && !data.needsLink && false ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Fila de ação (1 clique)</CardTitle>
                  <CardDescription>Prioridades recomendadas para agora.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(insights?.filaAcoes ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem ações urgentes.</p>
                  ) : (
                    (insights?.filaAcoes ?? []).map((acao) => (
                      <Link
                        key={acao.id}
                        href={acao.href}
                        className="block rounded-xl border border-border/50 bg-muted/15 px-3 py-2 text-sm hover:bg-muted/30"
                      >
                        {acao.titulo}
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Agenda didática integrada</CardTitle>
                  <CardDescription>
                    Próxima aula com contexto de planejamento e materiais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {!agendaDidatica ? (
                    <p className="text-sm text-muted-foreground">Sem próxima aula definida.</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">
                          {agendaDidatica?.turmaNome} • {agendaDidatica?.diaLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                          {agendaDidatica?.horaInicio} – {agendaDidatica?.horaFim}
                      </p>
                      <p className="text-xs text-muted-foreground">
                          Materiais recentes: {agendaDidatica?.materiaisRecentes}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Plano mais recente:{" "}
                          {agendaDidatica?.planoAulaMaisRecente ?? "não encontrado"}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {!loading && data && !data.needsLink && false ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Lançamentos recentes</CardTitle>
                  <CardDescription>Últimas ações no seu fluxo docente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(insights?.lancamentosRecentes ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem lançamentos recentes.</p>
                  ) : (
                    (insights?.lancamentosRecentes ?? []).map((item) => (
                      <div key={item.id} className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2">
                        <p className="text-sm font-medium">{item.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.turmaNome} • {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    Alertas pedagógicos
                  </CardTitle>
                  <CardDescription>Frequência e rendimento que merecem atenção.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(insights?.alertasPedagogicos ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum alerta crítico no momento.
                    </p>
                  ) : (
                    (insights?.alertasPedagogicos ?? []).map((alerta) => (
                      <div key={alerta.id} className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2">
                        <p className="text-sm font-medium">
                          {alerta.alunoNome} · {alerta.turmaNome}
                        </p>
                        <p className="text-xs text-muted-foreground">{alerta.detalhe}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/90">{alerta.explicacao}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {!loading && data && !data.needsLink && false ? (
            <section className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Centro pedagógico
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Inbox, metas por disciplina e relatório semanal em um só lugar.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-1">
                    Inbox: {(insights?.inboxPedagogica ?? []).length}
                  </span>
                  <span className="rounded-full border border-border/70 bg-muted/20 px-2 py-1">
                    Disciplinas: {(insights?.metasPorDisciplina ?? []).length}
                  </span>
                </div>
              </div>
            </section>
          ) : null}

          {!loading && data && !data.needsLink && false ? (
            <section className="grid gap-4 xl:grid-cols-3">
              <Card className="rounded-2xl border-border/60 bg-card/55 xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Resumo por turma (tendência)</CardTitle>
                  <CardDescription>Comparativo recente de frequência e média.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {(insights?.resumoTurmas ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sem dados de tendência suficientes nas turmas.
                    </p>
                  ) : (
                    (insights?.resumoTurmas ?? []).map((t) => (
                      <div key={t.turmaId} className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2">
                        <p className="text-sm font-medium">{t.turmaNome}</p>
                        <p className="text-xs text-muted-foreground">
                          Frequência {t.frequenciaAtual}% ({t.frequenciaTendencia >= 0 ? "+" : ""}
                          {t.frequenciaTendencia}pp)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Média {t.mediaAtual} ({t.mediaTendencia >= 0 ? "+" : ""}
                          {t.mediaTendencia})
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Inbox className="h-4 w-4 text-muted-foreground" />
                    Inbox pedagógica
                  </CardTitle>
                  <CardDescription>Avisos recentes relevantes ao seu dia a dia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(insights?.inboxPedagogica ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Caixa pedagógica vazia no momento.
                    </p>
                  ) : (
                    (insights?.inboxPedagogica ?? []).slice(0, 5).map((item) => (
                      <div key={item.id} className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{item.titulo}</p>
                          {!item.lida ? (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                              nova
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.mensagemPreview}</p>
                      </div>
                    ))
                  )}
                  <Button variant="outline" size="sm" className="w-full rounded-xl" asChild>
                    <Link href="/notificacoes">Abrir notificações</Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {!loading && data && !data.needsLink && false ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Metas por disciplina
                  </CardTitle>
                  <CardDescription>Progresso semanal por matéria vinculada.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(insights?.metasPorDisciplina ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sem disciplinas ativas para cálculo de metas.
                    </p>
                  ) : (
                    (insights?.metasPorDisciplina ?? []).slice(0, 8).map((d) => (
                      <div key={d.disciplinaId} className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2">
                        <p className="text-sm font-medium">{d.disciplinaNome}</p>
                        <div className="mt-1 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Aulas: {d.aulas.concluidas}/{d.aulas.meta}
                          </p>
                          <div className="h-1.5 rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-foreground/70"
                              style={{
                                width: `${Math.min((d.aulas.concluidas / Math.max(d.aulas.meta, 1)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Avaliações: {d.avaliacoes.concluidas}/{d.avaliacoes.meta}
                          </p>
                          <div className="h-1.5 rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-foreground/70"
                              style={{
                                width: `${Math.min((d.avaliacoes.concluidas / Math.max(d.avaliacoes.meta, 1)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Relatório semanal automático
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {insights?.relatorioSemanal.resumo ?? "Sem dados suficientes."}
                  </p>
                  <div className="space-y-1">
                    {(insights?.relatorioSemanal.prioridades ?? []).map((p) => (
                      <p key={p} className="text-xs text-foreground/90">
                        - {p}
                      </p>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" size="sm" className="rounded-xl" asChild>
                      <Link href="/docente#turmas-docente">
                        <BookOpenText className="mr-1.5 h-3.5 w-3.5" />
                        Revisar turmas
                      </Link>
                    </Button>
                    <Button variant="secondary" size="sm" className="rounded-xl" asChild>
                      <Link href="/docente/avaliacoes/nova">Planejar próxima avaliação</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {!loading && data && !data.needsLink && false ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    Checklist semanal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Chamadas registradas", value: insights?.checklistSemanal.chamadas },
                    { label: "Avaliações criadas", value: insights?.checklistSemanal.avaliacoes },
                    { label: "Notas lançadas", value: insights?.checklistSemanal.notas },
                  ].map((item) => {
                    const concluidas = item.value?.concluidas ?? 0;
                    const total = Math.max(item.value?.total ?? 0, 1);
                    const pct = Math.min((concluidas / total) * 100, 100);
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-foreground">
                            {concluidas}/{item.value?.total ?? 0}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-foreground/80 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60 bg-card/55">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Atalhos configuráveis</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={() => setEditingThresholds((v) => !v)}
                      >
                        Critérios
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={() => setEditingShortcuts((v) => !v)}
                      >
                        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                        {editingShortcuts ? "Concluir" : "Configurar"}
                      </Button>
                    </div>
                  </div>
                  <CardDescription>Escolha até 4 atalhos fixos do seu topo de rotina.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {shortcutTiles.map((tile) => (
                      <WorkspaceTileLink
                        key={`shortcut-${tile.id}`}
                        href={tile.href}
                        className="rounded-xl border border-border/55 bg-muted/15 px-3 py-2 text-sm hover:bg-muted/30"
                      >
                        {tile.title}
                      </WorkspaceTileLink>
                    ))}
                  </div>
                  {editingShortcuts ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {tilesWithTrocas.map((tile) => (
                        <button
                          key={`picker-${tile.id}`}
                          type="button"
                          onClick={() => toggleShortcut(tile.id)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-left text-xs transition",
                            shortcutIds.includes(tile.id)
                              ? "border-foreground bg-foreground/5 text-foreground"
                              : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {tile.title}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {editingThresholds ? (
                    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/15 p-3">
                      <p className="text-xs font-medium text-foreground">
                        Limiares e metas (perfil + escola)
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Freq. mínima (%)</span>
                          <input
                            type="number"
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                            value={configDraft.minAttendancePercent}
                            onChange={(e) =>
                              updateConfig("minAttendancePercent", e.target.value)
                            }
                          />
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Amostra freq. mínima</span>
                          <input
                            type="number"
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                            value={configDraft.minAttendanceSamples}
                            onChange={(e) =>
                              updateConfig("minAttendanceSamples", e.target.value)
                            }
                          />
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Nota mínima</span>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                            value={configDraft.minGrade}
                            onChange={(e) =>
                              updateConfig("minGrade", e.target.value, false)
                            }
                          />
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Amostra notas mínima</span>
                          <input
                            type="number"
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                            value={configDraft.minGradeSamples}
                            onChange={(e) => updateConfig("minGradeSamples", e.target.value)}
                          />
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Meta semanal chamadas</span>
                          <input
                            type="number"
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                            value={configDraft.weeklyCallsTarget}
                            onChange={(e) => updateConfig("weeklyCallsTarget", e.target.value)}
                          />
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground">
                          <span>Meta semanal avaliações</span>
                          <input
                            type="number"
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                            value={configDraft.weeklyAssessmentsTarget}
                            onChange={(e) =>
                              updateConfig("weeklyAssessmentsTarget", e.target.value)
                            }
                          />
                        </label>
                        <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
                          <span>Meta semanal notas</span>
                          <input
                            type="number"
                            className="w-full rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                            value={configDraft.weeklyGradesTarget}
                            onChange={(e) => updateConfig("weeklyGradesTarget", e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="rounded-xl"
                          onClick={saveProfileConfig}
                        >
                          Salvar no meu perfil
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => void saveSchoolConfig()}
                        >
                          Salvar para escola
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={resetFromSchoolConfig}
                        >
                          Restaurar padrão da escola
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </section>
          ) : null}

          {!loading && data && !data.needsLink && data.professor?.id ? (
            <DocenteDashboardCalendar
              professorId={data.professor.id}
              colorful={isColorfulTheme}
            />
          ) : null}

          {!loading && data && !data.needsLink ? (
            <section className="relative space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Áreas do workspace
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Atalhos no estilo painel moderno — cada bloco leva a uma ferramenta da sua rotina.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {tilesWithTrocas.map((tile) => (
                  <WorkspaceTileLink
                    key={`${tile.href}-${tile.title}`}
                    href={tile.href}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-200",
                      isColorfulTheme ?
                        `${tone(Number(tile.id.length + tile.title.length))} hover:brightness-[1.03]` :
                        "border-border/55 bg-card/40 hover:border-primary/25 hover:bg-card/70 hover:shadow-md dark:border-white/[0.06] dark:bg-zinc-900/35 dark:hover:border-primary/35 dark:hover:bg-zinc-900/55"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn(
                        "rounded-xl border p-2 text-muted-foreground",
                        isColorfulTheme
                          ? "border-white/45 bg-white/55 dark:border-white/15 dark:bg-white/10"
                          : "border-border/50 bg-muted/35 dark:border-white/[0.06] dark:bg-zinc-950/45"
                      )}>
                        <tile.icon className="h-4 w-4 opacity-90 transition-colors group-hover:text-foreground" />
                      </div>
                      {tile.badge ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                          {tile.badge}
                        </span>
                      ) : (
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </div>
                    <p className="mt-4 text-[15px] font-semibold leading-snug text-foreground">
                      {tile.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {tile.description}
                    </p>
                  </WorkspaceTileLink>
                ))}
              </div>
            </section>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {!loading && data?.needsLink ? (
            <Card className="rounded-2xl border-amber-500/25 bg-amber-500/[0.06] shadow-sm backdrop-blur-sm dark:bg-amber-500/[0.09]">
              <CardHeader>
                <CardTitle className="text-lg">Conta ainda não vinculada</CardTitle>
                <CardDescription className="space-y-3 text-sm leading-relaxed">
                  <span className="block text-foreground/90">
                    O convite criou seu login, mas o sistema só associa a conta ao professor quando existe uma{" "}
                    <strong>ficha de professor na mesma escola</strong> com o <strong>mesmo e-mail</strong> da conta que você usou no convite.
                  </span>
                  <span className="block font-medium text-foreground">
                    Peça à secretaria para conferir:
                  </span>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Você já aparece em <strong>Professores</strong> (cadastro da escola)?</li>
                    <li>
                      O campo <strong>e-mail</strong> na ficha é <strong>exatamente o mesmo</strong> do convite (sem typo)?
                    </li>
                    <li>O cadastro está <strong>ativo</strong>?</li>
                  </ul>
                  <span className="block">
                    Depois que corrigirem, clique em <strong>Tentar vincular de novo</strong> ou atualize esta página.
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 pt-0">
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={linkWorking}
                  onClick={() => void manualTryLink()}
                >
                  {linkWorking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar vincular de novo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {!loading && data && !data.needsLink ? (
            <section id="turmas-docente" className="scroll-mt-24 space-y-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Minhas turmas
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Visualização dinâmica por contexto: rotina do dia, atenção e acompanhamento.
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-fit rounded-xl text-muted-foreground" asChild>
                    <Link href="/docente">Ver todas</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={turmaView === "all" ? "secondary" : "outline"}
                    className="rounded-xl"
                    onClick={() => setTurmaView("all")}
                  >
                    Todas ({data.turmas.length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={turmaView === "today" ? "secondary" : "outline"}
                    className="rounded-xl"
                    onClick={() => setTurmaView("today")}
                  >
                    Com aula hoje ({data.turmas.filter((t) => t.horariosHoje.length > 0).length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={turmaView === "attention" ? "secondary" : "outline"}
                    className="rounded-xl"
                    onClick={() => setTurmaView("attention")}
                  >
                    Pedem atenção ({data.turmas.filter((t) => {
                      const r = resumoTurmaById.get(t.id);
                      return (r?.frequenciaTendencia ?? 0) < 0 || (r?.mediaTendencia ?? 0) < 0 || turmasComAlerta.has(t.nome);
                    }).length})
                  </Button>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  {filteredTurmas.slice(0, 3).map((t) => {
                    const resumo = resumoTurmaById.get(t.id);
                    const progressoChecklist =
                      insights ?
                        Math.min(
                          Math.round(
                            ((insights.checklistSemanal.chamadas.concluidas +
                              insights.checklistSemanal.avaliacoes.concluidas +
                              insights.checklistSemanal.notas.concluidas) /
                              Math.max(
                                insights.checklistSemanal.chamadas.total +
                                  insights.checklistSemanal.avaliacoes.total +
                                  insights.checklistSemanal.notas.total,
                                1
                              )) *
                              100
                          ),
                          100
                        )
                      : 0;
                    return (
                      <div
                        key={`snapshot-${t.id}`}
                        className={cn(
                          "rounded-2xl border p-4 shadow-sm",
                          isColorfulTheme ? tone(Number(t.nome.length + t.id.length)) : "border-border/55 bg-card/45"
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">{t.nome}</p>
                        <p className="text-xs text-muted-foreground">{t.cursoNome}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Alunos: {t.alunosAtivos}</span>
                          <span>Hoje: {t.horariosHoje.length > 0 ? "Sim" : "Nao"}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Frequencia: {resumo ? `${resumo.frequenciaAtual}%` : "—"}</span>
                          <span>Media: {resumo ? resumo.mediaAtual.toFixed(1) : "—"}</span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-white/60 dark:bg-white/15">
                          <div className="h-1.5 rounded-full bg-foreground/80" style={{ width: `${progressoChecklist}%` }} />
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">Progresso semanal consolidado: {progressoChecklist}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filteredTurmas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-6 py-12 text-center dark:border-white/[0.08] dark:bg-zinc-950/30">
                  <p className="text-sm font-medium text-foreground">Nenhuma turma para esse filtro</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Ajuste para “Todas” ou aguarde novas movimentações pedagógicas.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredTurmas.map((t, idx) => (
                    <div
                      key={t.id}
                      className={cn(
                        "group overflow-hidden rounded-2xl border shadow-sm backdrop-blur-md transition-all hover:shadow-md",
                        isColorfulTheme ?
                          `${tone(idx)} hover:brightness-[1.02]` :
                          "border-border/55 bg-card/45 hover:border-primary/25 dark:border-white/[0.06] dark:bg-zinc-900/38 dark:hover:border-primary/35",
                        t.horariosHoje.length > 0 && "ring-1 ring-primary/25"
                      )}
                    >
                      <div className={cn(
                        "border-b px-5 py-4",
                        isColorfulTheme ? "border-white/35 dark:border-white/15" : "border-border/45 dark:border-white/[0.06]"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Turma
                            </p>
                            <p className="mt-1 text-lg font-semibold leading-tight text-foreground">{t.nome}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{t.cursoNome}</p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
                              t.horariosHoje.length > 0
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/70 bg-muted/20 text-muted-foreground"
                            )}
                          >
                            {t.horariosHoje.length > 0 ? "Aula hoje" : "Sem aula hoje"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4 px-5 py-4 text-sm">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className={cn(
                            "rounded-xl border px-3 py-2",
                            isColorfulTheme
                              ? "border-white/40 bg-white/45 dark:border-white/15 dark:bg-white/5"
                              : "border-border/50 bg-muted/15"
                          )}>
                            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                              Alunos ativos
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-foreground">
                              <Users className="h-4 w-4 shrink-0 opacity-70" />
                              <span className="text-sm font-medium">
                                {t.alunosAtivos} {t.alunosAtivos === 1 ? "aluno" : "alunos"}
                              </span>
                            </div>
                          </div>
                          <div className={cn(
                            "rounded-xl border px-3 py-2",
                            isColorfulTheme
                              ? "border-white/40 bg-white/45 dark:border-white/15 dark:bg-white/5"
                              : "border-border/50 bg-muted/15"
                          )}>
                            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                              Carga semanal
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-foreground">
                              <TimerReset className="h-4 w-4 shrink-0 opacity-70" />
                              <span className="text-sm font-medium">
                                {t.horarios.length} {t.horarios.length === 1 ? "encontro" : "encontros"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={cn(
                          "flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-muted-foreground",
                          isColorfulTheme
                            ? "border-white/45 bg-white/35 dark:border-white/15 dark:bg-white/5"
                            : "border-border/60 bg-muted/10"
                        )}>
                          <Users className="h-4 w-4 shrink-0 opacity-70" />
                          <span>
                            Dica rápida: abra a turma para chamada, notas e materiais no mesmo workspace.
                          </span>
                        </div>

                        {t.horariosHoje.length > 0 ? (
                          <div className="rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 dark:bg-primary/[0.09]">
                            <div className="mb-1 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-primary">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Hoje
                            </div>
                            <ul className="space-y-0.5 font-mono text-xs text-foreground/90">
                              {t.horariosHoje.map((h, i) => (
                                <li key={`${h.horaInicio}-${i}`}>
                                  {h.horaInicio} – {h.horaFim}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className={cn(
                            "rounded-xl border px-3 py-2 text-xs text-muted-foreground",
                            isColorfulTheme
                              ? "border-white/45 bg-white/35 dark:border-white/15 dark:bg-white/5"
                              : "border-border/60 bg-muted/15"
                          )}>
                            Sem aulas hoje. Use o botão abaixo para adiantar planejamento e lançamentos.
                          </div>
                        )}

                        <div>
                          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Grade semanal
                          </p>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {t.horarios.length === 0 ? (
                              <li>Horários não cadastrados.</li>
                            ) : (
                              t.horarios.map((h) => (
                                <li key={`${h.diaSemana}-${h.horaInicio}`}>
                                  <span className="font-medium text-foreground/85">{h.diaLabel}</span>:{" "}
                                  {h.horaInicio} – {h.horaFim}
                                </li>
                              ))
                            )}
                          </ul>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button variant="secondary" size="sm" className="w-full rounded-xl font-medium" asChild>
                            <Link href={`/docente/turmas/${t.id}`}>
                              Abrir turma
                              <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="w-full rounded-xl font-medium" asChild>
                            <Link href="/docente/avaliacoes/nova">
                              Nova avaliação
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
