"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  LogOut, RefreshCw, TrendingUp, TrendingDown, BarChart3,
  Moon, Sun, Settings2,
} from "lucide-react";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─── Types ─────────────────────────────────────────────────── */
type Period = "7d" | "30d" | "90d" | "12m" | "ytd";

interface Metricas {
  totalSchools: number; activeSchools: number; inactiveSchools: number;
  newInPeriod: number; newVariacao: number;
  totalUsers: number;
  totalAlunos: number; newAlunosInPeriod: number; alunosVariacao: number;
  totalMatriculas: number; activeMatriculas: number;
  inadimplentes: number; taxaInadimplencia: number;
  receitaPeriodo: number; receitaVariacao: number; receitaPrevPeriodo: number;
  ticketMedio: number;
  mrrAtual: number;
}

interface DashboardData {
  period: Period;
  metricas: Metricas;
  chartData: { label: string; receita: number; escolas: number; alunos: number }[];
  planos: { plano: string; total: number }[];
  topSchools: {
    id: string; nome: string; slug: string; plano: string; ativo: boolean; createdAt: string;
  }[];
}

/* ─── Helpers ────────────────────────────────────────────────── */
const NUM = (v: number) => new Intl.NumberFormat("pt-BR").format(v);
const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 dias", "30d": "30 dias", "90d": "90 dias", "12m": "12 meses", "ytd": "Este ano",
};

const PERIOD_DELTA_LABEL: Record<Period, string> = {
  "7d": "% vs 7d anteriores",
  "30d": "% vs 30d anteriores",
  "90d": "% vs 90d anteriores",
  "12m": "% vs 12m anteriores",
  "ytd": "% vs ano anterior",
};

function Delta({ value, label }: { value: number; label: string }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">Sem variação</span>;
  const pos = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${pos ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
      {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pos ? "+" : ""}{value}{label}
    </span>
  );
}

function StatCard({ label, value, sub, delta, deltaLabel, icon: Icon, warn }:
  { label: string; value: string; sub?: string; delta?: number; deltaLabel?: string;
    icon: React.ElementType; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${warn ? "bg-red-100 dark:bg-red-900/30" : "bg-muted/60"}`}>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <p className="text-[22px] font-semibold tracking-tight text-foreground">{value}</p>
      <div className="mt-1.5 space-y-0.5">
        {delta !== undefined && <Delta value={delta} label={deltaLabel ?? "%"} />}
        {sub && <p className="text-[12px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

const TT = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12, fontSize: 12,
    color: "hsl(var(--foreground))",
  },
};

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const router = useRouter();
  const dark = useTheme();
  const [data, setData]         = useState<DashboardData | null>(null);
  const [schools, setSchools]   = useState<DashboardData["topSchools"]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const [tab, setTab]           = useState<"dashboard" | "escolas">("dashboard");
  const [period, setPeriod]     = useState<Period>("30d");
  const [theme, setTheme]       = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(dark ? "dark" : "light");
  }, [dark]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    fetch("/api/settings/aparencia", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temaPadrao: next, densidade: "comfortable" }),
    }).catch(() => {});
  }

  const load = useCallback(async (p: Period, silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(`/api/admin/metrics?period=${p}`),
        fetch("/api/admin/schools"),
      ]);
      if (mRes.ok) setData(await mRes.json());
      if (sRes.ok) setSchools((await sRes.json()).data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user?.role !== "SUPER_ADMIN") { router.push("/"); return; }
      setUserName(d.user.nome);
      load(period);
    });
  }, []);

  function changePeriod(p: Period) {
    setPeriod(p);
    load(p, true);
  }

  async function toggleSchool(id: string, ativo: boolean) {
    await fetch("/api/admin/schools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    load(period, true);
  }

  const m = data?.metricas;
  const dl = PERIOD_DELTA_LABEL[period];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 py-3">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground">
              <BarChart3 className="h-4 w-4 text-background" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">EduGestão</p>
              <p className="text-xs text-muted-foreground mt-0.5">Painel Administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              title={theme === "light" ? "Modo escuro" : "Modo claro"}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent transition">
              {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => load(period, true)} disabled={refreshing}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent disabled:opacity-50 transition">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <Link href="/admin/configuracoes"
              title="Configurações"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent transition">
              <Settings2 className="h-3.5 w-3.5" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border px-3 py-1.5">
              <div className="h-5 w-5 rounded-full bg-foreground flex items-center justify-center text-xs font-semibold text-background">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-foreground">{userName}</span>
            </div>
            <button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"))}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-sm text-muted-foreground hover:bg-accent transition">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-8">

        {/* ── Title + tabs + period selector ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Visão Geral da Plataforma</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Métricas consolidadas de todas as escolas.</p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
            {(["7d","30d","90d","12m","ytd"] as Period[]).map((p) => (
              <button key={p} onClick={() => changePeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  period === p
                    ? "bg-background text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(["dashboard","escolas"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t === "dashboard" ? "Dashboard" : "Escolas"}
            </button>
          ))}
        </div>

        {/* IMPORTANTE: manter este container visível no dashboard admin */}
        <div
          id="admin-dashboard-container"
          data-testid="admin-dashboard-container"
          className="mb-3 rounded-2xl bg-muted/40 p-5 sm:p-6 shadow-md"
          style={{ border: "2px solid color-mix(in oklab, currentColor 20%, transparent)" }}
        >
        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-border/60 bg-card animate-pulse" />
            ))}
          </div>
        )}

        {/* ══ DASHBOARD TAB ══ */}
        {!loading && tab === "dashboard" && m && data && (() => {
          const fg      = dark ? "#e8e8f0" : "#1a1a2e";
          const fgMuted = dark ? "#6b6b8a" : "#8888a0";
          const border  = dark ? "#2a2a3e" : "#e8e8f0";
          const cardBg  = dark ? "#1e1e2e" : "#ffffff";
          const tt = {
            contentStyle: {
              background: cardBg, border: `1px solid ${border}`,
              borderRadius: 12, fontSize: 12, color: fg,
            },
          };
          return (
          <div className="grid gap-6">

            {/* Period context banner */}
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border/40 px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                Exibindo dados dos últimos <strong className="text-foreground">{PERIOD_LABELS[period]}</strong>.
                Variações comparadas ao período anterior equivalente.
              </span>
            </div>

            {/* Empresa */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total de escolas" value={NUM(m.totalSchools)}
                delta={m.newVariacao} deltaLabel={dl}
                sub={`${NUM(m.newInPeriod)} novas no período`}
                icon={Building2} />
              <StatCard label="Escolas pagantes" value={NUM(m.totalUsers)}
                sub={`${NUM(m.activeMatriculas)} assinaturas ativas`} icon={Building2} />
              <StatCard label="MRR atual" value={BRL(m.mrrAtual)}
                sub="Soma das assinaturas ativas" icon={BarChart3} />
              <StatCard label="Ticket médio / escola" value={BRL(m.ticketMedio)}
                sub="MRR dividido por escolas pagantes" icon={TrendingUp} />
            </div>

            {/* Crescimento de escolas */}
            <div className="grid lg:grid-cols-1 gap-4">
              <div className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Receita de novos contratos</p>
                    <p className="text-xs text-muted-foreground">{PERIOD_LABELS[period]}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{BRL(m.receitaPeriodo)}</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={border} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: fgMuted }}
                      axisLine={false} tickLine={false}
                      interval={data.chartData.length > 15 ? Math.floor(data.chartData.length / 8) : 0} />
                    <YAxis tick={{ fontSize: 10, fill: fgMuted }}
                      axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...tt} />
                    <Bar dataKey="receita" name="Receita" fill={fg} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 4 — Planos + Top schools */}
            <div className="grid lg:grid-cols-3 gap-4">

              {/* Planos */}
              <div className="rounded-xl border border-border/60 bg-card p-5">
                <p className="text-sm font-medium text-foreground mb-4">Distribuição por plano</p>
                <div className="grid gap-3">
                  {data.planos.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sem dados.</p>
                  )}
                  {data.planos.map((p) => {
                    const share = m.totalSchools > 0 ? Math.round((p.total / m.totalSchools) * 100) : 0;
                    return (
                      <div key={p.plano}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize text-foreground">{p.plano}</span>
                          <span className="text-xs text-muted-foreground">{p.total} ({share}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-foreground transition-all duration-500"
                            style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Ativas</p>
                    <p className="text-lg font-semibold text-foreground">{NUM(m.activeSchools)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Inativas</p>
                    <p className="text-lg font-semibold text-foreground">{NUM(m.inactiveSchools)}</p>
                  </div>
                </div>
              </div>

              {/* Top schools */}
              <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card p-5">
                <p className="text-sm font-medium text-foreground mb-4">Escolas mais recentes</p>
                <div className="grid gap-2">
                  {data.topSchools.slice(0, 6).map((school) => (
                    <div key={school.id}
                      className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{school.nome}</p>
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            school.ativo
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          }`}>{school.ativo ? "Ativa" : "Inativa"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {school.slug}
                        </p>
                      </div>
                      <div className="shrink-0 ml-3 text-right">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {school.plano}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(school.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
        })()}

        {/* ══ ESCOLAS TAB ══ */}
        {!loading && tab === "escolas" && (
          <div className="grid gap-3">
            {schools.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma escola cadastrada ainda.</p>
            )}
            {schools.map((school) => (
              <div key={school.id}
                className="flex items-center justify-between rounded-[20px] border border-border bg-card px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{school.nome}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      school.ativo
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}>{school.ativo ? "Ativa" : "Inativa"}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {school.plano}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{school.slug}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Criada em {new Date(school.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <button onClick={() => toggleSchool(school.id, school.ativo)}
                  className="ml-4 shrink-0 rounded-2xl border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent transition">
                  {school.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
