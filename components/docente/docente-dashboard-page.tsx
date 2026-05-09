"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
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
import { DocenteOnboardingDialog } from "@/components/docente/docente-onboarding-dialog";
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
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

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
  pillVariant?: "default" | "studio";
}) {
  const { label, value, loading, tone, pillVariant = "default" } = props;
  return (
    <div
      className={cn(
        "border backdrop-blur-sm",
        pillVariant === "studio"
          ? "rounded-2xl px-4 py-3 shadow-[0_14px_36px_-22px_rgba(15,23,42,0.09)] dark:shadow-none"
          : "rounded-xl px-4 py-2.5",
        tone ??
          "border-indigo-200/55 bg-gradient-to-br from-white to-indigo-50/40 shadow-sm dark:border-indigo-400/18 dark:bg-gradient-to-br dark:from-zinc-900/85 dark:to-indigo-950/40 dark:shadow-none"
      )}
    >
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-400">
        {label}
      </p>
      {loading ? (
        <div className="mt-1 h-7 w-12 animate-pulse rounded bg-muted dark:bg-white/10" />
      ) : (
        <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-foreground dark:text-white">
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

type WorkspaceTileDef = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: LucideIcon;
};

const WORKSPACE_TILE_DEFS: WorkspaceTileDef[] = [
  {
    id: "eduia",
    titleKey: "docente.tile.eduia.title",
    descriptionKey: "docente.tile.eduia.desc",
    href: "/docente/eduia",
    icon: PanelRight,
  },
  {
    id: "materiais",
    titleKey: "docente.tile.materials.title",
    descriptionKey: "docente.tile.materials.desc",
    href: "/docente/materiais",
    icon: FileStack,
  },
  {
    id: "avaliacao",
    titleKey: "docente.tile.newAssessment.title",
    descriptionKey: "docente.tile.newAssessment.desc",
    href: "/docente/avaliacoes/nova",
    icon: PenLine,
  },
  {
    id: "mensagens",
    titleKey: "docente.tile.messages.title",
    descriptionKey: "docente.tile.messages.desc",
    href: "/mensagens",
    icon: MessageSquare,
  },
  {
    id: "turmas",
    titleKey: "docente.tile.classes.title",
    descriptionKey: "docente.tile.classes.desc",
    href: "/docente#turmas-docente",
    icon: ClipboardList,
  },
  {
    id: "agenda",
    titleKey: "docente.tile.agenda.title",
    descriptionKey: "docente.tile.agenda.desc",
    href: "/calendario/eventos",
    icon: CalendarDays,
  },
  {
    id: "avisos",
    titleKey: "docente.tile.notices.title",
    descriptionKey: "docente.tile.notices.desc",
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

const ELEGANT_SURFACE =
  "border-slate-200/78 bg-gradient-to-br from-white via-indigo-50/35 to-violet-50/45 shadow-[0_10px_38px_-22px_rgba(79,70,229,0.14)] dark:border-indigo-400/18 dark:bg-gradient-to-br dark:from-zinc-900/92 dark:via-indigo-950/55 dark:to-violet-950/35 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

/** Claro: pastéis. Escuro: cartões tipo vidro com borda colorida (referência painel). */
const ELEGANT_METRIC_TONES = [
  "border-lime-200/75 bg-gradient-to-br from-lime-50/95 to-lime-100/55 dark:border-emerald-400/55 dark:bg-zinc-950/65 dark:bg-none dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:backdrop-blur-md",
  "border-violet-200/72 bg-gradient-to-br from-violet-50/95 to-violet-100/50 dark:border-violet-400/55 dark:bg-zinc-950/65 dark:bg-none dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:backdrop-blur-md",
  "border-orange-200/70 bg-gradient-to-br from-orange-50/95 to-amber-100/48 dark:border-orange-400/50 dark:bg-zinc-950/65 dark:bg-none dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] dark:backdrop-blur-md",
];

function studioPastelIconShell(index: number) {
  const shells = [
    "border-lime-200/65 bg-lime-100 text-lime-800 shadow-[0_6px_18px_-10px_rgba(132,204,22,0.35)] dark:border-lime-400/22 dark:bg-lime-500/14 dark:text-lime-100 dark:shadow-none",
    "border-violet-200/65 bg-violet-100 text-violet-800 shadow-[0_6px_18px_-10px_rgba(139,92,246,0.28)] dark:border-violet-400/22 dark:bg-violet-500/14 dark:text-violet-100 dark:shadow-none",
    "border-orange-200/65 bg-orange-100 text-orange-800 shadow-[0_6px_18px_-10px_rgba(249,115,22,0.28)] dark:border-orange-400/22 dark:bg-orange-500/14 dark:text-orange-100 dark:shadow-none",
    "border-pink-200/65 bg-pink-100 text-pink-800 shadow-[0_6px_18px_-10px_rgba(236,72,153,0.25)] dark:border-pink-400/22 dark:bg-pink-500/14 dark:text-pink-100 dark:shadow-none",
    "border-sky-200/65 bg-sky-100 text-sky-800 shadow-[0_6px_18px_-10px_rgba(14,165,233,0.25)] dark:border-sky-400/22 dark:bg-sky-500/14 dark:text-sky-100 dark:shadow-none",
  ];
  return cn(
    "flex size-12 shrink-0 items-center justify-center rounded-2xl border",
    shells[index % shells.length]
  );
}

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
  const { t } = useDashboardLanguage();
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
  const [onboardingOpen, setOnboardingOpen] = useState(false);
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
      setError(e instanceof Error ? e.message : t("docente.loadError.generic"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading) return;
    if (window.localStorage.getItem("docente.onboarding.v1.done") === "1") return;
    if (
      window.sessionStorage.getItem("docente.onboarding.dismiss.session") === "1"
    ) {
      return;
    }
    setOnboardingOpen(true);
  }, [loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("docente.dashboard.shortcuts");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const valid = parsed
        .map((id) => String(id))
        .filter((id) => WORKSPACE_TILE_DEFS.some((tile) => tile.id === id))
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
        toast.success(t("docente.toast.linkSuccess"));
        await load();
        return;
      }
      toast.error(
        typeof j.message === "string"
          ? j.message
          : t("docente.toast.linkFailGeneric")
      );
    } catch {
      toast.error(t("docente.toast.networkError"));
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

  const baseWorkspaceTiles = useMemo<TileSpec[]>(
    () =>
      WORKSPACE_TILE_DEFS.map((def) => ({
        id: def.id,
        title: t(def.titleKey),
        description: t(def.descriptionKey),
        href: def.href,
        icon: def.icon,
      })),
    [t]
  );

  const tilesWithTrocas = useMemo<TileSpec[]>(() => {
    const trocaLabel =
      (data?.trocasPendentes ?? 0) > 0 ? String(data?.trocasPendentes) : undefined;
    return (data?.trocasPendentes ?? 0) > 0 ?
        [
          ...baseWorkspaceTiles,
          {
            id: "trocas",
            title: t("docente.tile.swaps.title"),
            description: t("docente.tile.swaps.desc"),
            href: "/docente/trocas",
            icon: Shuffle,
            badge: trocaLabel,
          },
        ]
      : baseWorkspaceTiles;
  }, [baseWorkspaceTiles, data?.trocasPendentes, t]);

  const shortcutTiles = shortcutIds
    .map((id) => tilesWithTrocas.find((tileRow) => tileRow.id === id))
    .filter((tile): tile is TileSpec => Boolean(tile));

  const resumoTurmaById = new Map(
    (insights?.resumoTurmas ?? []).map((row) => [row.turmaId, row] as const)
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
      : "bg-white ring-1 ring-stone-200/75 dark:bg-[linear-gradient(103deg,#09090b_0%,#18181b_46%,rgba(55,48,163,0.62)_80%,rgba(91,33,182,0.5)_100%)] dark:ring-1 dark:ring-white/[0.11] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]";
  const isColorfulTheme = visualTheme !== "elegante";
  const isStudioShell = visualTheme === "elegante";
  const tone = (index: number) =>
    isColorfulTheme
      ? COLOR_CARD_TONES[index % COLOR_CARD_TONES.length]
      : ELEGANT_SURFACE;

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
    toast.success(t("docente.toast.profileSaved"));
  }

  function resetFromSchoolConfig() {
    setConfigDraft(schoolConfig ?? DEFAULT_DASHBOARD_CONFIG);
  }

  return (
    <DashboardLayout>
      <DocenteOnboardingDialog
        open={onboardingOpen}
        onOpenChange={(next) => {
          setOnboardingOpen(next);
          if (
            !next &&
            typeof window !== "undefined" &&
            window.localStorage.getItem("docente.onboarding.v1.done") !== "1"
          ) {
            try {
              window.sessionStorage.setItem(
                "docente.onboarding.dismiss.session",
                "1"
              );
            } catch {
              /* noop */
            }
          }
        }}
        needsLink={data?.needsLink ?? false}
      />
      <Header titleKey="docente.page.title" descriptionKey="docente.page.description" />

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
        <div
          className={cn(
            isStudioShell &&
              "-mx-6 bg-[#F9F9F8] px-6 pb-14 pt-2 dark:mx-0 dark:bg-transparent dark:px-0 dark:pb-0 dark:pt-0"
          )}
        >
        <div className="relative space-y-10 pb-16 pt-2">
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 -top-8 h-[22rem] rounded-[28px]",
              isStudioShell
                ? "bg-[radial-gradient(ellipse_72%_54%_at_50%_-12%,rgba(163,230,53,0.09),transparent_58%),radial-gradient(ellipse_48%_42%_at_94%_4%,rgba(196,181,253,0.11),transparent)] dark:bg-[radial-gradient(ellipse_72%_56%_at_88%_-12%,rgba(139,92,246,0.28),transparent_58%),radial-gradient(ellipse_52%_44%_at_12%_8%,rgba(16,185,129,0.09),transparent)]"
                : "bg-[radial-gradient(ellipse_78%_56%_at_50%_-14%,hsl(var(--primary)/0.26),transparent_62%),radial-gradient(ellipse_52%_42%_at_92%_6%,rgba(139,92,246,0.12),transparent)] dark:bg-[radial-gradient(ellipse_74%_54%_at_50%_-10%,hsl(var(--primary)/0.28),transparent_58%),radial-gradient(ellipse_48%_38%_at_88%_4%,rgba(99,102,241,0.12),transparent)]"
            )}
          />

          <section
            className={cn(
              "relative overflow-hidden border p-6 backdrop-blur-xl sm:p-8",
              isStudioShell ? "rounded-3xl" : "rounded-2xl",
              visualTheme === "elegante"
                ? "border-stone-200/70 shadow-[0_32px_64px_-40px_rgba(15,23,42,0.14)] dark:border-white/[0.09] dark:shadow-[0_28px_80px_-38px_rgba(0,0,0,0.65)] dark:backdrop-blur-xl"
                : "border-border/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:border-white/[0.07]",
              themeHeroClass,
            )}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl flex-1 space-y-4">
                <DocenteGreeting
                  variant="workspace"
                  welcomeStyle={isStudioShell ? "studio" : "default"}
                  loading={loading}
                  needsLink={data?.needsLink ?? false}
                  professorNome={data?.professor?.nome}
                  diaHojeLabel={data?.diaHojeLabel ?? "—"}
                  footer={
                    !loading &&
                    data &&
                    !data.needsLink &&
                    (data.trocasPendentes ?? 0) > 0 ? (
                      <div className="rounded-full border border-amber-400/45 bg-amber-500/[0.12] px-3 py-2 font-mono text-[11px] text-foreground dark:border-amber-400/40 dark:bg-amber-950/35 dark:text-zinc-100">
                        <span className="font-semibold tracking-wide">
                          {data.trocasPendentes === 1 ?
                            t("docente.swapInvite.one", {
                              count: data.trocasPendentes ?? 0,
                            })
                          : t("docente.swapInvite.many", {
                              count: data.trocasPendentes ?? 0,
                            })}
                        </span>
                        .{" "}
                        <Link
                          href="/docente/trocas"
                          className="font-medium text-sky-600 underline-offset-4 hover:underline dark:text-sky-400"
                        >
                          {t("docente.swapRespondNow")}
                        </Link>
                      </div>
                    ) : null
                  }
                />

                {!loading && data?.needsLink ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("docente.needsLinkHint")}
                  </p>
                ) : null}
              </div>

              <div className="flex w-full flex-col gap-4 lg:w-auto lg:min-w-[280px] lg:items-end">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-md lg:max-w-none">
                  <MetricPill
                    label={t("docente.metric.classes")}
                    value={String(metricas.turmasAtivas)}
                    loading={loading}
                    pillVariant={isStudioShell ? "studio" : "default"}
                    tone={
                      isColorfulTheme ? tone(0) : ELEGANT_METRIC_TONES[0]
                    }
                  />
                  <MetricPill
                    label={t("docente.metric.students")}
                    value={String(metricas.alunosTotal)}
                    loading={loading}
                    pillVariant={isStudioShell ? "studio" : "default"}
                    tone={
                      isColorfulTheme ? tone(1) : ELEGANT_METRIC_TONES[1]
                    }
                  />
                  <MetricPill
                    label={t("docente.metric.today")}
                    value={String(metricas.turmasComAulaHoje)}
                    loading={loading}
                    pillVariant={isStudioShell ? "studio" : "default"}
                    tone={
                      isColorfulTheme ? tone(2) : ELEGANT_METRIC_TONES[2]
                    }
                  />
                </div>

                {!loading && data && !data.needsLink ? (
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      className={cn(
                        "rounded-full font-medium sm:rounded-xl",
                        isStudioShell &&
                          "dark:border dark:border-white/12 dark:bg-zinc-950 dark:text-white dark:shadow-lg dark:hover:bg-black"
                      )}
                      asChild
                    >
                      <Link href="/docente/avaliacoes/nova">
                        <PenLine className="mr-2 h-3.5 w-3.5" />
                        {t("docente.hero.newAssessment")}
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={cn(
                        "rounded-full border-border/70 sm:rounded-xl dark:border-white/[0.12]",
                        isStudioShell &&
                          "dark:bg-zinc-950/85 dark:text-white dark:hover:bg-black"
                      )}
                      asChild
                    >
                      <Link href="/mensagens">
                        <MessageSquare className="mr-2 h-3.5 w-3.5" />
                        {t("docente.hero.messages")}
                      </Link>
                    </Button>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-xl border p-1 backdrop-blur",
                        isStudioShell
                          ? "border-stone-200/80 bg-white/95 shadow-sm dark:border-white/[0.1] dark:bg-black/55 dark:backdrop-blur-sm"
                          : "border-border/60 bg-background/70"
                      )}
                    >
                      {[
                        { id: "elegante", labelKey: "docente.theme.elegant" as const },
                        { id: "colorido", labelKey: "docente.theme.colorful" as const },
                        { id: "aurora", labelKey: "docente.theme.aurora" as const },
                        { id: "sunset", labelKey: "docente.theme.sunset" as const },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setVisualTheme(opt.id as typeof visualTheme)}
                          className={cn(
                            "rounded-lg px-2 py-1 text-[11px] font-medium transition",
                            visualTheme === opt.id
                              ? "bg-primary text-primary-foreground dark:bg-indigo-600 dark:text-white"
                              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
                          )}
                        >
                          {t(opt.labelKey)}
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
            <section
              className={cn(
                "space-y-4 rounded-2xl border p-5",
                visualTheme === "colorido" &&
                  "border-blue-200/55 bg-[linear-gradient(165deg,rgba(191,219,254,0.35),rgba(199,210,254,0.28))] dark:border-blue-400/22 dark:bg-[linear-gradient(165deg,rgba(37,99,235,0.12),rgba(79,70,229,0.1))]",
                visualTheme === "aurora" &&
                  "border-teal-200/50 bg-[linear-gradient(165deg,rgba(167,243,208,0.32),rgba(199,210,254,0.26))] dark:border-teal-400/20 dark:bg-[linear-gradient(165deg,rgba(20,184,166,0.11),rgba(79,70,229,0.09))]",
                visualTheme === "sunset" &&
                  "border-amber-200/50 bg-[linear-gradient(165deg,rgba(254,215,170,0.38),rgba(252,231,243,0.3))] dark:border-amber-400/22 dark:bg-[linear-gradient(165deg,rgba(245,158,11,0.1),rgba(219,39,119,0.07))]",
                visualTheme === "elegante" &&
                  "rounded-3xl border border-stone-200/60 bg-white p-6 shadow-[0_28px_60px_-44px_rgba(15,23,42,0.14)] dark:border-white/[0.08] dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
                  <span
                    aria-hidden
                    className={cn(
                      "hidden h-10 w-1 shrink-0 rounded-full sm:block",
                      visualTheme === "elegante" &&
                        "bg-gradient-to-b from-lime-400 via-violet-400 to-orange-300 opacity-95 dark:from-lime-400 dark:via-violet-500 dark:to-orange-400 dark:opacity-75",
                      visualTheme === "colorido" && "bg-blue-400/80 dark:bg-blue-400/60",
                      visualTheme === "aurora" && "bg-teal-400/80 dark:bg-teal-400/55",
                      visualTheme === "sunset" && "bg-amber-400/85 dark:bg-amber-400/55"
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        "font-semibold uppercase tracking-[0.16em] text-muted-foreground",
                        isStudioShell ?
                          "text-[11px] text-stone-400 dark:text-muted-foreground"
                        : "font-mono text-[11px]"
                      )}
                    >
                      {isStudioShell ? "Agenda do dia" : "Resumo do dia"}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-sm text-muted-foreground",
                        isStudioShell && "text-stone-600 dark:text-muted-foreground"
                      )}
                    >
                      {data.diaHojeLabel}
                    </p>
                  </div>
                </div>
                {isStudioShell ? (
                  <WorkspaceTileLink
                    href="/docente#turmas-docente"
                    className="text-sm font-medium text-stone-700 underline-offset-4 transition hover:text-stone-900 hover:underline dark:text-muted-foreground dark:hover:text-foreground"
                  >
                    Ver turmas
                  </WorkspaceTileLink>
                ) : null}
              </div>

              <div className={cn("space-y-2", isStudioShell && "mt-5")}>
                {resumoDoDia.length === 0 ? (
                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-10 text-center text-sm text-muted-foreground",
                      isColorfulTheme
                        ? "border-white/45 bg-white/50 dark:border-white/12 dark:bg-white/[0.06]"
                        : "border-dashed border-stone-200/95 bg-stone-50/90 dark:border-white/[0.12] dark:bg-zinc-900/65"
                    )}
                  >
                    Sem aulas no dia de hoje.
                  </div>
                ) : (
                  resumoDoDia.map((item, idx) => (
                    <Link
                      key={`${item.turmaId}-${item.horaInicio}`}
                      href={`/docente/turmas/${item.turmaId}`}
                      className={cn(
                        "group flex items-center gap-4 transition",
                        isColorfulTheme
                          ? "rounded-xl border border-white/40 bg-white/45 px-4 py-3 hover:bg-white/65 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                          : cn(
                              "rounded-2xl border border-stone-100 bg-white p-4 shadow-[0_10px_34px_-24px_rgba(15,23,42,0.12)] hover:border-stone-200 hover:shadow-[0_14px_40px_-22px_rgba(15,23,42,0.14)]",
                              "dark:border-white/[0.08] dark:bg-zinc-900/82 dark:shadow-none dark:hover:border-white/[0.14] dark:hover:bg-zinc-800/88"
                            )
                      )}
                    >
                      {isColorfulTheme ? (
                        <>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{item.turmaNome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.horaInicio}-{item.horaFim}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </>
                      ) : (
                        <>
                          <div className={studioPastelIconShell(idx)}>
                            <CalendarClock className="size-5" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold leading-snug text-stone-900 dark:text-foreground">
                              {item.turmaNome}
                            </p>
                            <p className="mt-0.5 text-sm text-stone-500 dark:text-muted-foreground">
                              {t("docente.lessonSlot", {
                                start: item.horaInicio,
                                end: item.horaFim,
                              })}
                            </p>
                          </div>
                          <ChevronRight className="size-5 shrink-0 text-stone-300 opacity-70 transition group-hover:text-stone-500 group-hover:opacity-100 dark:text-zinc-600 dark:group-hover:text-zinc-400" />
                        </>
                      )}
                    </Link>
                  ))
                )}
              </div>

              <div className={cn("border-t pt-4 dark:border-white/[0.08]", isStudioShell ? "mt-6 border-stone-100" : "border-border/50")}>
                <p
                  className={cn(
                    "mb-3 font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                    isStudioShell ? "text-[11px] text-stone-400 dark:text-muted-foreground" : "font-mono text-[11px]"
                  )}
                >
                  {isStudioShell ? t("docente.shortcuts.quick") : t("docente.shortcuts.default")}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      href: "/calendario/eventos",
                      labelKey: "docente.shortcut.calendar" as const,
                    },
                    {
                      href: "/notificacoes",
                      labelKey: "docente.shortcut.notifications" as const,
                    },
                    { href: "/mensagens", labelKey: "docente.shortcut.messages" as const },
                    {
                      href: "/docente/avaliacoes/nova",
                      labelKey: "docente.shortcut.assessments" as const,
                    },
                  ].map((item, shortcutIdx) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "border px-3 py-2 text-sm transition hover:text-foreground",
                        isColorfulTheme
                          ? "rounded-xl border-white/40 bg-white/45 text-foreground/80 hover:bg-white/65 dark:border-white/15 dark:bg-white/5"
                          : cn(
                              "rounded-2xl border-transparent bg-white font-medium text-stone-600 shadow-[0_8px_26px_-18px_rgba(15,23,42,0.12)] hover:bg-stone-50 hover:shadow-md",
                              "dark:border-white/[0.06] dark:bg-zinc-900/78 dark:text-muted-foreground dark:hover:bg-zinc-800/85",
                              shortcutIdx % 4 === 0 &&
                                "ring-1 ring-lime-200/55 dark:ring-lime-400/15",
                              shortcutIdx % 4 === 1 &&
                                "ring-1 ring-violet-200/55 dark:ring-violet-400/15",
                              shortcutIdx % 4 === 2 &&
                                "ring-1 ring-orange-200/55 dark:ring-orange-400/15",
                              shortcutIdx % 4 === 3 &&
                                "ring-1 ring-sky-200/55 dark:ring-sky-400/15"
                            )
                      )}
                    >
                      {t(item.labelKey)}
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
                          {t("docente.turmas.openClass")}
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
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Os valores abaixo ficam salvos no seu navegador quando você usa{" "}
                        <span className="font-medium text-foreground/85">
                          {t("docente.config.saveProfile")}
                        </span>
                        . O padrão da escola para todos os professores é definido pela gestão no painel
                        administrativo — use{" "}
                        <span className="font-medium text-foreground/85">
                          {t("docente.config.restoreSchoolDefault")}
                        </span>{" "}
                        para voltar ao que a escola configurou.
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
                          {t("docente.config.saveProfile")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={resetFromSchoolConfig}
                        >
                          {t("docente.config.restoreSchoolDefault")}
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
                  <p
                    className={cn(
                      "font-semibold uppercase tracking-[0.16em] text-muted-foreground",
                      isStudioShell ?
                        "text-[11px] text-stone-400 dark:text-muted-foreground"
                      : "font-mono text-[11px]"
                    )}
                  >
                    {t("docente.section.workspaceAreas")}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-muted-foreground",
                      isStudioShell ?
                        "max-w-xl text-base font-semibold text-stone-900 dark:text-foreground"
                      : "text-sm"
                    )}
                  >
                    {isStudioShell ?
                      t("docente.section.workspaceSubtitleStudio")
                    : t("docente.section.workspaceSubtitleDefault")}
                  </p>
                  {isStudioShell ? (
                    <p className="mt-1 max-w-xl text-sm font-normal text-stone-500 dark:text-muted-foreground">
                      {t("docente.section.workspaceHintStudio")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {tilesWithTrocas.map((tile, tileIdx) => (
                  <WorkspaceTileLink
                    key={`${tile.href}-${tile.title}`}
                    href={tile.href}
                    className={cn(
                      "group relative overflow-hidden border p-5 transition-all duration-200",
                      isColorfulTheme ?
                        cn(
                          "rounded-2xl shadow-sm",
                          `${tone(Number(tile.id.length + tile.title.length))} hover:brightness-[1.03]`
                        )
                      : cn(
                          "rounded-3xl border-stone-100 bg-white shadow-[0_22px_52px_-38px_rgba(15,23,42,0.13)] hover:border-stone-200/90 hover:shadow-[0_26px_56px_-34px_rgba(15,23,42,0.15)]",
                          "dark:border-white/[0.08] dark:bg-zinc-900/88 dark:hover:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                        )
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          isColorfulTheme ?
                            cn(
                              "rounded-xl border p-2 text-muted-foreground",
                              "border-white/45 bg-white/55 dark:border-white/15 dark:bg-white/10"
                            )
                          : studioPastelIconShell(tileIdx)
                        )}
                      >
                        <tile.icon
                          className={cn(
                            "opacity-90 transition-colors group-hover:text-foreground",
                            isColorfulTheme ? "h-4 w-4" : "size-5"
                          )}
                          strokeWidth={isColorfulTheme ? 2 : 2.25}
                        />
                      </div>
                      {tile.badge ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                          {tile.badge}
                        </span>
                      ) : (
                        <ChevronRight className="size-5 shrink-0 text-stone-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-90 dark:text-zinc-600" />
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
                    <p
                      className={cn(
                        "font-semibold uppercase tracking-[0.16em] text-muted-foreground",
                        isStudioShell ?
                          "text-[11px] text-stone-400 dark:text-muted-foreground"
                        : "font-mono text-[11px]"
                      )}
                    >
                      Minhas turmas
                    </p>
                    <p
                      className={cn(
                        "text-sm text-muted-foreground",
                        isStudioShell && "text-stone-600 dark:text-muted-foreground"
                      )}
                    >
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
                  {filteredTurmas.slice(0, 3).map((snap) => {
                    const resumo = resumoTurmaById.get(snap.id);
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
                        key={`snapshot-${snap.id}`}
                        className={cn(
                          "border p-4 shadow-sm",
                          isStudioShell ? "rounded-3xl" : "rounded-2xl",
                          isColorfulTheme
                            ? tone(Number(snap.nome.length + snap.id.length))
                            : cn(
                                "border-stone-100 bg-white shadow-[0_14px_40px_-28px_rgba(15,23,42,0.09)] dark:border-white/[0.08] dark:bg-zinc-900/85 dark:shadow-none",
                                isStudioShell &&
                                  "ring-1 ring-stone-100/80 dark:ring-white/[0.04]"
                              )
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">{snap.nome}</p>
                        <p className="text-xs text-muted-foreground">{snap.cursoNome}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Alunos: {snap.alunosAtivos}</span>
                          <span>Hoje: {snap.horariosHoje.length > 0 ? "Sim" : "Nao"}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Frequencia: {resumo ? `${resumo.frequenciaAtual}%` : "—"}</span>
                          <span>Media: {resumo ? resumo.mediaAtual.toFixed(1) : "—"}</span>
                        </div>
                        <div className={cn(
                          "mt-3 h-1.5 rounded-full dark:bg-white/15",
                          isStudioShell ? "bg-stone-100/95" : "bg-white/60"
                        )}>
                          <div className="h-1.5 rounded-full bg-foreground/80" style={{ width: `${progressoChecklist}%` }} />
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">Progresso semanal consolidado: {progressoChecklist}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filteredTurmas.length === 0 ? (
                <div className={cn(
                  "border border-dashed border-border/70 bg-muted/15 px-6 py-12 text-center dark:border-white/[0.08] dark:bg-zinc-950/30",
                  isStudioShell ? "rounded-3xl border-stone-200/80 bg-stone-50/90 dark:bg-zinc-900/50" : "rounded-2xl"
                )}>
                  <p className="text-sm font-medium text-foreground">Nenhuma turma para esse filtro</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Ajuste para “Todas” ou aguarde novas movimentações pedagógicas.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredTurmas.map((turma, idx) => (
                    <div
                      key={turma.id}
                      className={cn(
                        "group overflow-hidden border shadow-sm backdrop-blur-md transition-all hover:shadow-md",
                        isStudioShell ? "rounded-3xl" : "rounded-2xl",
                        isColorfulTheme ?
                          `${tone(idx)} hover:brightness-[1.02]` :
                          cn(
                            "border-stone-100 bg-white shadow-[0_18px_48px_-32px_rgba(15,23,42,0.12)] hover:border-stone-200 dark:border-white/[0.08] dark:bg-zinc-900/88 dark:hover:border-white/[0.12] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                            isStudioShell && "hover:shadow-[0_22px_52px_-30px_rgba(15,23,42,0.14)]"
                          ),
                        turma.horariosHoje.length > 0 && "ring-1 ring-primary/25"
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
                            <p className="mt-1 text-lg font-semibold leading-tight text-foreground">{turma.nome}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{turma.cursoNome}</p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wide",
                              turma.horariosHoje.length > 0
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/70 bg-muted/20 text-muted-foreground"
                            )}
                          >
                            {turma.horariosHoje.length > 0 ? "Aula hoje" : "Sem aula hoje"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4 px-5 py-4 text-sm">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className={cn(
                            "rounded-xl border px-3 py-2",
                            isColorfulTheme
                              ? "border-white/40 bg-white/45 dark:border-white/15 dark:bg-white/5"
                              : "border-slate-200/60 bg-white/80 dark:border-border/50 dark:bg-muted/15"
                          )}>
                            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                              Alunos ativos
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-foreground">
                              <Users className="h-4 w-4 shrink-0 opacity-70" />
                              <span className="text-sm font-medium">
                                {turma.alunosAtivos}{" "}
                                {turma.alunosAtivos === 1 ? "aluno" : "alunos"}
                              </span>
                            </div>
                          </div>
                          <div className={cn(
                            "rounded-xl border px-3 py-2",
                            isColorfulTheme
                              ? "border-white/40 bg-white/45 dark:border-white/15 dark:bg-white/5"
                              : "border-slate-200/60 bg-white/80 dark:border-border/50 dark:bg-muted/15"
                          )}>
                            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                              Carga semanal
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-foreground">
                              <TimerReset className="h-4 w-4 shrink-0 opacity-70" />
                              <span className="text-sm font-medium">
                                {turma.horarios.length}{" "}
                                {turma.horarios.length === 1 ? "encontro" : "encontros"}
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

                        {turma.horariosHoje.length > 0 ? (
                          <div className="rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2 dark:bg-primary/[0.09]">
                            <div className="mb-1 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-primary">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Hoje
                            </div>
                            <ul className="space-y-0.5 font-mono text-xs text-foreground/90">
                              {turma.horariosHoje.map((h, i) => (
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
                            {t("docente.turmas.noClassesToday")}
                          </div>
                        )}

                        <div>
                          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("docente.turmas.weeklySchedule")}
                          </p>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {turma.horarios.length === 0 ? (
                              <li>{t("docente.turmas.noScheduleRegistered")}</li>
                            ) : (
                              turma.horarios.map((h) => (
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
                            <Link href={`/docente/turmas/${turma.id}`}>
                              {t("docente.turmas.openClass")}
                              <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="w-full rounded-xl font-medium" asChild>
                            <Link href="/docente/avaliacoes/nova">
                              {t("docente.hero.newAssessment")}
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
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
