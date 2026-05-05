"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  Landmark,
  LogOut,
  MessageCircle,
  Moon,
  RefreshCw,
  Settings2,
  Sparkles,
  Sun,
  Tag,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { effectiveAiMonthlyLimit, type PlanTier } from "@/lib/school-plan";

type Tab = "usuarios" | "financeiro" | "planos";

type SchoolRow = {
  id: string;
  nome: string;
  slug: string;
  plano: string;
  ativo: boolean;
};

type AdminUserRow = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  school: { id: string; nome: string; slug: string } | null;
};

type PlanRow = {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  descricao: string | null;
  limiteAlunos: number | null;
  limiteTurmas: number | null;
  limiteUsuarios: number | null;
  ativo: boolean;
  assinantesAtivos?: number;
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

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  SECRETARIA: "Secretaria",
  PROFESSOR: "Professor",
};

export default function AdminConfiguracoesPage() {
  const router = useRouter();
  const dark = useTheme();
  const [userName, setUserName] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState<Tab>("usuarios");
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [finSchoolId, setFinSchoolId] = useState("");
  const [finLoading, setFinLoading] = useState(false);
  const [finSaving, setFinSaving] = useState(false);
  const [finEnv, setFinEnv] = useState("sandbox");
  const [finKey, setFinKey] = useState("");
  const [finWallet, setFinWallet] = useState("");
  const [finBilling, setFinBilling] = useState(false);
  const [finMethod, setFinMethod] = useState("boleto");
  const [finAutoBoleto, setFinAutoBoleto] = useState(false);
  const [finAutoWa, setFinAutoWa] = useState(false);
  const [finMaskedKey, setFinMaskedKey] = useState<string | null>(null);
  const [finHasKey, setFinHasKey] = useState(false);
  const [finHasWallet, setFinHasWallet] = useState(false);
  const [finMaskedWallet, setFinMaskedWallet] = useState<string | null>(null);
  const [finPlatformFallback, setFinPlatformFallback] = useState(false);
  const [finPlanTier, setFinPlanTier] = useState<string>("starter");
  const [finSchoolPlano, setFinSchoolPlano] = useState("");
  const [finBillingProvider, setFinBillingProvider] = useState("asaas");
  const [finOpenaiKey, setFinOpenaiKey] = useState("");
  const [finOpenaiLimit, setFinOpenaiLimit] = useState("");
  const [finMaskedOpenai, setFinMaskedOpenai] = useState<string | null>(null);
  const [finHasOpenai, setFinHasOpenai] = useState(false);
  const [finAiUsage, setFinAiUsage] = useState({ count: 0, limit: 0 });
  const [finTwilioSid, setFinTwilioSid] = useState("");
  const [finTwilioToken, setFinTwilioToken] = useState("");
  const [finTwilioFrom, setFinTwilioFrom] = useState("");
  const [finMaskedTwilio, setFinMaskedTwilio] = useState<string | null>(null);
  const [finHasTwilio, setFinHasTwilio] = useState(false);

  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planDrafts, setPlanDrafts] = useState<Record<string, { preco: string; limiteAlunos: string; limiteTurmas: string; limiteUsuarios: string }>>({});

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

  const loadSchools = useCallback(async () => {
    const r = await fetch("/api/admin/schools");
    if (!r.ok) return;
    const j = await r.json();
    const list: SchoolRow[] = j.data ?? [];
    setSchools(list);
    setFinSchoolId((prev) => prev || list[0]?.id || "");
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const q = schoolFilter ? `?schoolId=${encodeURIComponent(schoolFilter)}` : "";
      const r = await fetch(`/api/admin/users${q}`);
      if (r.ok) {
        const j = await r.json();
        setUsers(j.data ?? []);
      }
    } finally {
      setUsersLoading(false);
    }
  }, [schoolFilter]);

  const loadFinanceiro = useCallback(async (schoolId: string) => {
    if (!schoolId) return;
    setFinLoading(true);
    try {
      const r = await fetch(`/api/admin/school-settings?schoolId=${encodeURIComponent(schoolId)}`);
      if (!r.ok) return;
      const d = await r.json();
      setFinEnv(d.asaasEnvironment === "production" ? "production" : "sandbox");
      setFinBilling(Boolean(d.billingEnabled));
      setFinMethod(d.defaultChargeMethod || "boleto");
      setFinAutoBoleto(Boolean(d.autoGenerateBoleto));
      setFinAutoWa(Boolean(d.autoSendBoletoWhatsApp));
      setFinMaskedKey(d.maskedAsaasApiKey);
      setFinHasKey(d.hasAsaasApiKey);
      setFinHasWallet(d.hasAsaasWallet);
      setFinMaskedWallet(d.maskedAsaasWalletId);
      setFinPlatformFallback(Boolean(d.hasPlatformAsaasFallback));
      setFinPlanTier(d.planTier ?? "starter");
      setFinSchoolPlano(d.schoolPlano ?? "");
      setFinBillingProvider(typeof d.billingProvider === "string" ? d.billingProvider : "asaas");
      setFinHasOpenai(Boolean(d.hasOpenaiApiKey));
      setFinMaskedOpenai(d.maskedOpenaiApiKey ?? null);
      setFinOpenaiKey("");
      setFinOpenaiLimit(
        d.aiMonthlyLimitOverride != null ? String(d.aiMonthlyLimitOverride) : ""
      );
      const tier = (d.planTier ?? "starter") as PlanTier;
      setFinAiUsage({
        count: Number(d.aiUsageCount) || 0,
        limit: effectiveAiMonthlyLimit(tier, d.aiMonthlyLimitOverride),
      });
      setFinTwilioSid(typeof d.twilioAccountSid === "string" ? d.twilioAccountSid : "");
      setFinTwilioToken("");
      setFinTwilioFrom(typeof d.twilioWhatsAppFrom === "string" ? d.twilioWhatsAppFrom : "");
      setFinHasTwilio(Boolean(d.hasTwilioAuthToken));
      setFinMaskedTwilio(d.maskedTwilioAuthToken ?? null);
      setFinKey("");
      setFinWallet("");
    } finally {
      setFinLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const r = await fetch("/api/admin/plans");
      if (!r.ok) return;
      const list: PlanRow[] = await r.json();
      setPlans(list);
      const next: Record<string, { preco: string; limiteAlunos: string; limiteTurmas: string; limiteUsuarios: string }> = {};
      for (const p of list) {
        next[p.id] = {
          preco: String(p.preco),
          limiteAlunos: p.limiteAlunos != null ? String(p.limiteAlunos) : "",
          limiteTurmas: p.limiteTurmas != null ? String(p.limiteTurmas) : "",
          limiteUsuarios: p.limiteUsuarios != null ? String(p.limiteUsuarios) : "",
        };
      }
      setPlanDrafts(next);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role !== "SUPER_ADMIN") {
          router.push("/");
          return;
        }
        setUserName(d.user.nome);
        loadSchools();
        loadUsers();
        loadPlans();
      });
  }, [router, loadSchools, loadUsers, loadPlans]);

  useEffect(() => {
    if (finSchoolId) loadFinanceiro(finSchoolId);
  }, [finSchoolId, loadFinanceiro]);

  async function patchUser(id: string, patch: { ativo?: boolean; role?: string }) {
    setNotice(null);
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      setNotice({ type: "err", text: e.error || "Erro ao atualizar usuário." });
      return;
    }
    setNotice({ type: "ok", text: "Usuário atualizado." });
    loadUsers();
  }

  async function saveFinanceiro() {
    if (!finSchoolId) return;
    setFinSaving(true);
    setNotice(null);
    try {
      const body: Record<string, unknown> = {
        schoolId: finSchoolId,
        asaasEnvironment: finEnv,
        billingEnabled: finBilling,
        defaultChargeMethod: finMethod,
        autoGenerateBoleto: finAutoBoleto,
        autoSendBoletoWhatsApp: finAutoWa,
        billingProvider: finPlanTier === "full" ? finBillingProvider : "asaas",
      };
      if (finKey.trim()) body.asaasApiKey = finKey.trim();
      if (finWallet.trim()) body.asaasWalletId = finWallet.trim();
      if (finOpenaiKey.trim()) body.openaiApiKey = finOpenaiKey.trim();
      if (finOpenaiLimit.trim() !== "") {
        const n = Number(finOpenaiLimit.replace(",", "."));
        if (Number.isFinite(n) && n > 0) body.aiMonthlyLimitOverride = Math.floor(n);
      }
      if (finPlanTier === "full") {
        body.twilioAccountSid = finTwilioSid.trim() || null;
        if (finTwilioToken.trim()) body.twilioAuthToken = finTwilioToken.trim();
        body.twilioWhatsAppFrom = finTwilioFrom.trim() || null;
      }
      const r = await fetch("/api/admin/school-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setNotice({ type: "err", text: d.error || "Erro ao salvar financeiro." });
        return;
      }
      setNotice({ type: "ok", text: "Cobrança / Asaas atualizado para a escola." });
      await loadFinanceiro(finSchoolId);
    } finally {
      setFinSaving(false);
    }
  }

  async function clearSchoolAsaasKey() {
    if (!finSchoolId) return;
    setNotice(null);
    const r = await fetch("/api/admin/school-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: finSchoolId, asaasApiKey: null }),
    });
    if (r.ok) {
      setNotice({ type: "ok", text: "Chave Asaas da escola removida (fallback do servidor, se houver)." });
      loadFinanceiro(finSchoolId);
    } else {
      const d = await r.json().catch(() => ({}));
      setNotice({ type: "err", text: d.error || "Erro ao remover chave." });
    }
  }

  async function savePlan(plan: PlanRow) {
    const draft = planDrafts[plan.id];
    if (!draft) return;
    const preco = Number(String(draft.preco).replace(",", "."));
    if (!Number.isFinite(preco) || preco <= 0) {
      setNotice({ type: "err", text: "Preço inválido." });
      return;
    }
    const parseLim = (s: string) => {
      if (s.trim() === "") return null;
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0) return NaN;
      return Math.floor(n);
    };
    const limiteAlunos = parseLim(draft.limiteAlunos);
    const limiteTurmas = parseLim(draft.limiteTurmas);
    const limiteUsuarios = parseLim(draft.limiteUsuarios);
    if ([limiteAlunos, limiteTurmas, limiteUsuarios].some((x) => x !== null && Number.isNaN(x))) {
      setNotice({ type: "err", text: "Limites devem ser números inteiros ≥ 0 ou vazio." });
      return;
    }
    setNotice(null);
    const r = await fetch("/api/admin/plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: plan.id,
        preco,
        limiteAlunos,
        limiteTurmas,
        limiteUsuarios,
      }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setNotice({ type: "err", text: d.error || "Erro ao salvar plano." });
      return;
    }
    setNotice({ type: "ok", text: `Plano "${plan.nome}" atualizado.` });
    loadPlans();
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "financeiro", label: "Integrações (escola)", icon: Wallet },
    { id: "planos", label: "Planos", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 py-3">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground">
              <Settings2 className="h-4 w-4 text-background" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-none truncate">Configurações</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">Painel administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin"
              className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-accent transition"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Visão geral
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "light" ? "Modo escuro" : "Modo claro"}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent transition"
            >
              {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (tab === "usuarios") loadUsers();
                if (tab === "financeiro" && finSchoolId) loadFinanceiro(finSchoolId);
                if (tab === "planos") loadPlans();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-border px-3 py-1.5">
              <div className="h-5 w-5 rounded-full bg-foreground flex items-center justify-center text-xs font-semibold text-background">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-foreground max-w-[120px] truncate">{userName}</span>
            </div>
            <button
              type="button"
              onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"))}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-sm text-muted-foreground hover:bg-accent transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Configurações da plataforma</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Usuários das escolas, integrações por escola (Asaas, OpenAI, Twilio) e preços dos planos.
          </p>
        </div>

        {notice && (
          <div
            className={`mb-4 rounded-xl border px-4 py-2.5 text-sm ${
              notice.type === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-6 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "usuarios" && (
          <section className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="schoolFilter">Filtrar por escola</Label>
                <select
                  id="schoolFilter"
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="h-8 w-full max-w-md rounded-md border border-border bg-card px-2 text-[13px] text-foreground"
                >
                  <option value="">Todas as escolas</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => loadUsers()}>
                Atualizar lista
              </Button>
            </div>

            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Nome</th>
                      <th className="px-3 py-2 font-medium">E-mail</th>
                      <th className="px-3 py-2 font-medium">Escola</th>
                      <th className="px-3 py-2 font-medium">Função</th>
                      <th className="px-3 py-2 font-medium">Ativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-border/60">
                        <td className="px-3 py-2 text-foreground">{u.nome}</td>
                        <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                        <td className="px-3 py-2 text-muted-foreground">{u.school?.nome ?? "—"}</td>
                        <td className="px-3 py-2">
                          <select
                            value={u.role}
                            onChange={(e) => patchUser(u.id, { role: e.target.value })}
                            className="h-7 rounded-md border border-border bg-background px-1.5 text-[12px]"
                          >
                            {(["ADMIN", "FINANCEIRO", "SECRETARIA", "PROFESSOR"] as const).map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABEL[role] ?? role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => patchUser(u.id, { ativo: !u.ativo })}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              u.ativo
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {u.ativo ? "Sim" : "Não"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === "financeiro" && (
          <div className="max-w-3xl w-full space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
              <div className="flex gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-foreground">Escola</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Todas as integrações abaixo valem para a escola selecionada.
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <Label htmlFor="finSchool">Selecionar escola</Label>
                <select
                  id="finSchool"
                  value={finSchoolId}
                  onChange={(e) => setFinSchoolId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Fallback Asaas: se não houver chave nesta escola, usa-se{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">ASAAS_API_KEY</code> no servidor —{" "}
                  {finPlatformFallback ? "definida." : "não definida."}
                </p>
              </div>
            </div>

            {finLoading ? (
              <p className="text-sm text-muted-foreground px-1">Carregando integrações…</p>
            ) : (
              <>
                <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
                  <div className="flex gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
                    <Tag className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Plano e provedor</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Recursos liberados conforme o contrato da escola.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {finPlanTier}
                      </span>
                      <span className="text-[13px] text-foreground font-medium">{finSchoolPlano}</span>
                    </div>
                    {finPlanTier === "full" && (
                      <div className="space-y-1.5 pt-1 border-t border-border/50">
                        <Label htmlFor="finBillProv">Provedor de cobrança</Label>
                        <select
                          id="finBillProv"
                          value={finBillingProvider}
                          onChange={(e) => setFinBillingProvider(e.target.value)}
                          className="h-9 w-full max-w-md rounded-lg border border-border bg-background px-3 text-[13px]"
                        >
                          <option value="asaas">Asaas</option>
                        </select>
                        <p className="text-[11px] text-muted-foreground">
                          Planos Starter e Basic usam apenas Asaas. Outros provedores podem ser adicionados depois.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
                  <div className="flex gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
                    <Landmark className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Asaas</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        API e carteira para boletos, PIX e cobranças desta escola.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="finEnv">Ambiente</Label>
                      <select
                        id="finEnv"
                        value={finEnv}
                        onChange={(e) => setFinEnv(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px]"
                      >
                        <option value="sandbox">Sandbox</option>
                        <option value="production">Produção</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="finKey">API Key</Label>
                      <Input
                        id="finKey"
                        type="password"
                        autoComplete="off"
                        placeholder={finHasKey ? "Nova chave (deixe vazio para manter)" : "Cole a chave"}
                        value={finKey}
                        onChange={(e) => setFinKey(e.target.value)}
                        className="h-9"
                      />
                      {finHasKey && (
                        <p className="text-[12px] text-muted-foreground">Armazenada: {finMaskedKey ?? "••••"}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="finWallet">Wallet ID</Label>
                      <Input
                        id="finWallet"
                        autoComplete="off"
                        placeholder={finHasWallet ? "Novo ID (opcional)" : "Opcional"}
                        value={finWallet}
                        onChange={(e) => setFinWallet(e.target.value)}
                        className="h-9"
                      />
                      {finHasWallet && (
                        <p className="text-[12px] text-muted-foreground">Atual: {finMaskedWallet ?? "—"}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSchoolAsaasKey}
                        disabled={!finHasKey}
                        className="text-destructive hover:text-destructive"
                      >
                        Remover chave Asaas desta escola
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
                  <div className="flex gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
                    <Sparkles className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">EduIA (OpenAI)</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Assistente com modelo GPT quando o plano permitir; Starter não usa esta API.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="finOpenai">Chave OpenAI</Label>
                      <Input
                        id="finOpenai"
                        type="password"
                        autoComplete="off"
                        placeholder={finHasOpenai ? "Nova chave (opcional)" : "sk-…"}
                        value={finOpenaiKey}
                        onChange={(e) => setFinOpenaiKey(e.target.value)}
                        className="h-9"
                      />
                      {finHasOpenai && (
                        <p className="text-[12px] text-muted-foreground">Armazenada: {finMaskedOpenai ?? "••••"}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="finOpenaiLim">Limite mensal (até o teto do plano)</Label>
                      <Input
                        id="finOpenaiLim"
                        inputMode="numeric"
                        placeholder="Vazio = usar padrão do plano"
                        value={finOpenaiLimit}
                        onChange={(e) => setFinOpenaiLimit(e.target.value)}
                        className="h-9 max-w-xs"
                      />
                      <p className="text-[12px] text-muted-foreground">
                        Consumo no período:{" "}
                        <span className="font-medium text-foreground">
                          {finAiUsage.count} / {finAiUsage.limit}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {finPlanTier === "full" && (
                  <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
                    <div className="flex gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
                      <MessageCircle className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">WhatsApp (Twilio)</h3>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          Número próprio para lembretes e envio de boletos (substitui o número da plataforma).
                        </p>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="finTwSid">Account SID</Label>
                        <Input
                          id="finTwSid"
                          value={finTwilioSid}
                          onChange={(e) => setFinTwilioSid(e.target.value)}
                          className="h-9 font-mono text-[12px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="finTwTok">Auth token</Label>
                        <Input
                          id="finTwTok"
                          type="password"
                          autoComplete="off"
                          placeholder={finHasTwilio ? "Novo token (opcional)" : ""}
                          value={finTwilioToken}
                          onChange={(e) => setFinTwilioToken(e.target.value)}
                          className="h-9"
                        />
                        {finHasTwilio && (
                          <p className="text-[12px] text-muted-foreground">Token: {finMaskedTwilio ?? "••••"}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="finTwFrom">WhatsApp From</Label>
                        <Input
                          id="finTwFrom"
                          value={finTwilioFrom}
                          onChange={(e) => setFinTwilioFrom(e.target.value)}
                          placeholder="whatsapp:+5511999990000"
                          className="h-9 font-mono text-[12px]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
                  <div className="flex gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
                    <Zap className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Automação de cobrança</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Comportamento padrão ao gerar e enviar cobranças.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent py-1 hover:bg-muted/30">
                      <input
                        id="finBill"
                        type="checkbox"
                        checked={finBilling}
                        onChange={(e) => setFinBilling(e.target.checked)}
                        className="mt-1 rounded border-border"
                      />
                      <span>
                        <span className="text-[13px] font-medium text-foreground">Cobrança habilitada</span>
                        <span className="block text-[12px] text-muted-foreground">
                          Permite gerar e registrar cobranças via Asaas para esta escola.
                        </span>
                      </span>
                    </label>
                    <div className="space-y-1.5">
                      <Label htmlFor="finMethod">Método de pagamento padrão</Label>
                      <select
                        id="finMethod"
                        value={finMethod}
                        onChange={(e) => setFinMethod(e.target.value)}
                        className="h-9 w-full max-w-md rounded-lg border border-border bg-background px-3 text-[13px]"
                      >
                        <option value="boleto">Boleto</option>
                        <option value="pix">PIX</option>
                        <option value="credit_card">Cartão</option>
                      </select>
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent py-1 hover:bg-muted/30">
                      <input
                        id="finAuto"
                        type="checkbox"
                        checked={finAutoBoleto}
                        onChange={(e) => setFinAutoBoleto(e.target.checked)}
                        className="mt-1 rounded border-border"
                      />
                      <span>
                        <span className="text-[13px] font-medium text-foreground">Gerar boleto automaticamente</span>
                        <span className="block text-[12px] text-muted-foreground">
                          Ao criar mensalidade, já emite boleto quando aplicável.
                        </span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent py-1 hover:bg-muted/30">
                      <input
                        id="finWa"
                        type="checkbox"
                        checked={finAutoWa}
                        onChange={(e) => setFinAutoWa(e.target.checked)}
                        className="mt-1 rounded border-border"
                      />
                      <span>
                        <span className="text-[13px] font-medium text-foreground">Enviar boleto por WhatsApp</span>
                        <span className="block text-[12px] text-muted-foreground">
                          Dispara mensagem com link ao gerar o boleto (usa Twilio da escola ou da plataforma).
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-4 py-4">
                  <p className="text-[12px] text-muted-foreground mb-3">
                    Salva Asaas, OpenAI, Twilio e automações desta escola de uma vez.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={saveFinanceiro} disabled={finSaving || !finSchoolId}>
                      {finSaving ? "Salvando…" : "Salvar todas as integrações"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "planos" && (
          <section className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            {plansLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Plano</th>
                      <th className="px-3 py-2 font-medium">Preço (R$)</th>
                      <th className="px-3 py-2 font-medium">Lim. alunos</th>
                      <th className="px-3 py-2 font-medium">Lim. turmas</th>
                      <th className="px-3 py-2 font-medium">Lim. usuários</th>
                      <th className="px-3 py-2 font-medium">Ativos</th>
                      <th className="px-3 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => {
                      const d = planDrafts[p.id];
                      return (
                        <tr key={p.id} className="border-t border-border/60">
                          <td className="px-3 py-2">
                            <div className="font-medium text-foreground">{p.nome}</div>
                            <div className="text-[11px] text-muted-foreground">{p.slug}</div>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-7 w-24"
                              value={d?.preco ?? ""}
                              onChange={(e) =>
                                setPlanDrafts((prev) => ({
                                  ...prev,
                                  [p.id]: { ...prev[p.id], preco: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-7 w-20"
                              placeholder="∞"
                              value={d?.limiteAlunos ?? ""}
                              onChange={(e) =>
                                setPlanDrafts((prev) => ({
                                  ...prev,
                                  [p.id]: { ...prev[p.id], limiteAlunos: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-7 w-20"
                              placeholder="∞"
                              value={d?.limiteTurmas ?? ""}
                              onChange={(e) =>
                                setPlanDrafts((prev) => ({
                                  ...prev,
                                  [p.id]: { ...prev[p.id], limiteTurmas: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-7 w-20"
                              placeholder="∞"
                              value={d?.limiteUsuarios ?? ""}
                              onChange={(e) =>
                                setPlanDrafts((prev) => ({
                                  ...prev,
                                  [p.id]: { ...prev[p.id], limiteUsuarios: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{p.assinantesAtivos ?? 0}</td>
                          <td className="px-3 py-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => savePlan(p)}>
                              Salvar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[12px] text-muted-foreground">
              O preço do plano é usado como referência de MRR. Assinaturas já criadas mantêm o valor pago registrado na época.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
