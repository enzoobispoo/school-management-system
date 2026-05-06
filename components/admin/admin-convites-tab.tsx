"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  normalizePlanTier,
  planAllowsBillingProviderChoice,
  planAllowsCustomTwilio,
  planAllowsOpenAi,
  type PlanTier,
} from "@/lib/school-plan";

type UserRole = "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  SECRETARIA: "Secretaria",
  PROFESSOR: "Professor",
};

export type ConvitesSchoolRow = {
  id: string;
  nome: string;
  slug: string;
  plano: string;
};

export type ConvitesPlanRow = {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  limiteAlunos: number | null;
  limiteTurmas: number | null;
  limiteUsuarios: number | null;
  ativo?: boolean;
};

type PlanDraft = {
  preco: string;
  limiteAlunos: string;
  limiteTurmas: string;
  limiteUsuarios: string;
};

interface ConvitePendente {
  id: string;
  email: string;
  role: string;
  schoolId: string | null;
  school: { nome: string; slug: string } | null;
  expiresAt: string;
  createdAt: string;
}

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(n);
}

type Props = {
  schools: ConvitesSchoolRow[];
  plans: ConvitesPlanRow[];
  plansLoading: boolean;
  plansError: string | null;
  onReloadCatalog: () => void;
};

export function AdminConvitesTab({
  schools,
  plans,
  plansLoading,
  plansError,
  onReloadCatalog,
}: Props) {
  const [planDrafts, setPlanDrafts] = useState<Record<string, PlanDraft>>({});
  const [savingCatalogId, setSavingCatalogId] = useState<string | null>(null);

  const [schoolId, setSchoolId] = useState("");
  const [planId, setPlanId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("SECRETARIA");

  const [asaasApiKey, setAsaasApiKey] = useState("");
  const [asaasWalletId, setAsaasWalletId] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [aiMonthlyLimitOverride, setAiMonthlyLimitOverride] = useState("");
  const [billingProvider, setBillingProvider] = useState("asaas");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");

  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");

  const [convites, setConvites] = useState<ConvitePendente[]>([]);
  const [loadingConvites, setLoadingConvites] = useState(true);
  const [reenviando, setReenviando] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, PlanDraft> = {};
    for (const p of plans) {
      next[p.id] = {
        preco: String(p.preco),
        limiteAlunos: p.limiteAlunos != null ? String(p.limiteAlunos) : "",
        limiteTurmas: p.limiteTurmas != null ? String(p.limiteTurmas) : "",
        limiteUsuarios: p.limiteUsuarios != null ? String(p.limiteUsuarios) : "",
      };
    }
    setPlanDrafts(next);
  }, [plans]);

  useEffect(() => {
    setSchoolId((prev) => {
      if (prev && schools.some((s) => s.id === prev)) return prev;
      return schools[0]?.id ?? "";
    });
  }, [schools]);

  const fetchConvites = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/invites", { cache: "no-store" });
      if (res.ok) setConvites(await res.json());
    } finally {
      setLoadingConvites(false);
    }
  }, []);

  useEffect(() => {
    fetchConvites();
  }, [fetchConvites]);

  const selectedPlan = useMemo(
    () => (planId ? plans.find((p) => p.id === planId) : undefined),
    [planId, plans]
  );

  const tierChosen = Boolean(planId && selectedPlan);
  const effectiveTier: PlanTier = useMemo(() => {
    if (selectedPlan) return normalizePlanTier(selectedPlan.slug);
    return "starter";
  }, [selectedPlan]);

  const showOpenAi = tierChosen && planAllowsOpenAi(effectiveTier);
  const showBillingChoice = tierChosen && planAllowsBillingProviderChoice(effectiveTier);
  const showTwilio = tierChosen && planAllowsCustomTwilio(effectiveTier);

  async function handleSavePlanCatalog(plan: ConvitesPlanRow) {
    const draft = planDrafts[plan.id];
    if (!draft) return;
    const preco = Number(String(draft.preco).replace(",", "."));
    if (!Number.isFinite(preco) || preco <= 0) {
      toast.error("Preço inválido.");
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
      toast.error("Limites inválidos.");
      return;
    }
    setSavingCatalogId(plan.id);
    try {
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
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error(typeof d.error === "string" ? d.error : "Erro ao salvar.");
        return;
      }
      toast.success("Salvo.");
      onReloadCatalog();
    } finally {
      setSavingCatalogId(null);
    }
  }

  async function handleCreateInvite() {
    setLoading(true);
    setFormError("");
    setFormOk("");
    setInviteLink("");
    try {
      if (!schoolId) {
        setFormError("Selecione a escola.");
        return;
      }
      if (!planId) {
        setFormError("Selecione o plano.");
        return;
      }
      if (!email.trim()) {
        setFormError("Informe o e-mail.");
        return;
      }

      const body: Record<string, unknown> = {
        email: email.trim().toLowerCase(),
        role,
        schoolId,
        planId,
      };
      if (asaasApiKey.trim()) body.asaasApiKey = asaasApiKey.trim();
      if (asaasWalletId.trim()) body.asaasWalletId = asaasWalletId.trim();
      if (showOpenAi && openaiApiKey.trim()) body.openaiApiKey = openaiApiKey.trim();
      if (showOpenAi && aiMonthlyLimitOverride.trim()) {
        body.aiMonthlyLimitOverride = aiMonthlyLimitOverride.trim();
      }
      if (showBillingChoice) body.billingProvider = billingProvider;
      if (showTwilio) {
        if (twilioSid.trim()) body.twilioAccountSid = twilioSid.trim();
        if (twilioToken.trim()) body.twilioAuthToken = twilioToken.trim();
        if (twilioFrom.trim()) body.twilioWhatsAppFrom = twilioFrom.trim();
      }

      const response = await fetch("/api/auth/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar convite.");
      }
      setInviteLink(result.inviteLink as string);
      setFormOk("Enviado.");
      setEmail("");
      setPlanId("");
      setAsaasApiKey("");
      setAsaasWalletId("");
      setOpenaiApiKey("");
      setAiMonthlyLimitOverride("");
      setTwilioToken("");
      onReloadCatalog();
      fetchConvites();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setFormOk("Copiado.");
  }

  async function handleReenviar(convite: ConvitePendente) {
    setReenviando(convite.id);
    try {
      const res = await fetch("/api/auth/invites/reenviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: convite.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro");
        return;
      }
      toast.success("Reenviado.");
      fetchConvites();
    } finally {
      setReenviando(null);
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const activePlans = plans.filter((p) => p.ativo !== false);
  const metaLoading = plansLoading;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/10 space-y-6">
        <h2 className="text-sm font-semibold text-foreground">Novo convite</h2>

        {metaLoading && plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : schools.length === 0 ? (
          <p className="text-sm text-destructive">Nenhuma escola.</p>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="convSchool">Escola</Label>
              <select
                id="convSchool"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="h-9 w-full max-w-xl rounded-lg border border-border bg-background px-3 text-[13px]"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} ({s.slug}) — {s.plano}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label>Plano</Label>

              {plansError && (
                <p className="text-sm text-destructive">{plansError}</p>
              )}

              {!plansError && !metaLoading && activePlans.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem planos.</p>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {activePlans.map((p) => {
                  const t = normalizePlanTier(p.slug);
                  const sel = planId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanId(p.id)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition hover:bg-muted/40",
                        sel
                          ? "border-foreground ring-2 ring-foreground/20 bg-muted/30"
                          : "border-border/60 bg-background"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-tight">{p.nome}</p>
                        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          {t}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{p.slug}</p>
                      <p className="text-[13px] font-medium text-foreground mt-2">{formatBRL(p.preco)}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {p.limiteAlunos ?? "∞"} / {p.limiteTurmas ?? "∞"} / {p.limiteUsuarios ?? "∞"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPlan && (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 p-4 space-y-3">
                <p className="text-[12px] font-medium text-foreground">{selectedPlan.nome}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-[11px]">R$</Label>
                    <Input
                      className="h-8 text-[13px]"
                      value={planDrafts[selectedPlan.id]?.preco ?? ""}
                      onChange={(e) =>
                        setPlanDrafts((prev) => ({
                          ...prev,
                          [selectedPlan.id]: {
                            ...prev[selectedPlan.id],
                            preco: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Alunos</Label>
                    <Input
                      className="h-8 text-[13px]"
                      placeholder="∞"
                      value={planDrafts[selectedPlan.id]?.limiteAlunos ?? ""}
                      onChange={(e) =>
                        setPlanDrafts((prev) => ({
                          ...prev,
                          [selectedPlan.id]: {
                            ...prev[selectedPlan.id],
                            limiteAlunos: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Turmas</Label>
                    <Input
                      className="h-8 text-[13px]"
                      placeholder="∞"
                      value={planDrafts[selectedPlan.id]?.limiteTurmas ?? ""}
                      onChange={(e) =>
                        setPlanDrafts((prev) => ({
                          ...prev,
                          [selectedPlan.id]: {
                            ...prev[selectedPlan.id],
                            limiteTurmas: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Usuários</Label>
                    <Input
                      className="h-8 text-[13px]"
                      placeholder="∞"
                      value={planDrafts[selectedPlan.id]?.limiteUsuarios ?? ""}
                      onChange={(e) =>
                        setPlanDrafts((prev) => ({
                          ...prev,
                          [selectedPlan.id]: {
                            ...prev[selectedPlan.id],
                            limiteUsuarios: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={savingCatalogId === selectedPlan.id}
                  onClick={() => handleSavePlanCatalog(selectedPlan)}
                >
                  {savingCatalogId === selectedPlan.id ? "…" : "Salvar"}
                </Button>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="convEmail">E-mail</Label>
                <Input
                  id="convEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="convRole">Perfil</Label>
                <select
                  id="convRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-[13px]"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="FINANCEIRO">Financeiro</option>
                  <option value="SECRETARIA">Secretaria</option>
                  <option value="PROFESSOR">Professor</option>
                </select>
              </div>
            </div>

            {tierChosen && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <p className="text-[12px] font-medium text-foreground">Integrações</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="convAsaas">Asaas API</Label>
                    <Input
                      id="convAsaas"
                      type="password"
                      autoComplete="off"
                      value={asaasApiKey}
                      onChange={(e) => setAsaasApiKey(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="convWallet">Wallet</Label>
                    <Input
                      id="convWallet"
                      autoComplete="off"
                      value={asaasWalletId}
                      onChange={(e) => setAsaasWalletId(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {showOpenAi && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="convOpenai">OpenAI</Label>
                      <Input
                        id="convOpenai"
                        type="password"
                        autoComplete="off"
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="convAiLim">Limite IA / mês</Label>
                      <Input
                        id="convAiLim"
                        inputMode="numeric"
                        value={aiMonthlyLimitOverride}
                        onChange={(e) => setAiMonthlyLimitOverride(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}

                {showBillingChoice && (
                  <div className="grid gap-2 max-w-md">
                    <Label htmlFor="convBillProv">Cobrança</Label>
                    <select
                      id="convBillProv"
                      value={billingProvider}
                      onChange={(e) => setBillingProvider(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-background px-3 text-[13px]"
                    >
                      <option value="asaas">Asaas</option>
                    </select>
                  </div>
                )}

                {showTwilio && (
                  <div className="space-y-2 rounded-lg border border-border/40 p-3 bg-background/50">
                    <p className="text-[11px] font-medium text-foreground">Twilio</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={twilioSid}
                        onChange={(e) => setTwilioSid(e.target.value)}
                        className="h-9 font-mono text-[12px]"
                      />
                      <Input
                        type="password"
                        autoComplete="off"
                        value={twilioToken}
                        onChange={(e) => setTwilioToken(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Input
                      value={twilioFrom}
                      onChange={(e) => setTwilioFrom(e.target.value)}
                      className="h-9 font-mono text-[12px] max-w-md"
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              type="button"
              onClick={handleCreateInvite}
              disabled={loading || !schoolId || !planId || !email.trim()}
            >
              {loading ? "…" : "Enviar convite"}
            </Button>

            {inviteLink && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">Link</p>
                <p className="mt-2 break-all text-xs text-muted-foreground">{inviteLink}</p>
                <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="mt-3">
                  Copiar
                </Button>
              </div>
            )}

            {formError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
            {formOk && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
                {formOk}
              </div>
            )}
          </>
        )}
      </section>

      <div className="pt-6 border-t border-border/60">
        <h3 className="text-sm font-semibold text-foreground mb-4">Pendentes</h3>
        {loadingConvites ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : convites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum.</p>
        ) : (
          <div className="space-y-2">
            {convites.map((c) => {
              const expirado = isExpired(c.expiresAt);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.school?.nome ?? "—"} · {ROLE_LABEL[c.role] ?? c.role} ·{" "}
                      {expirado ? (
                        <span className="text-destructive">Expirado</span>
                      ) : (
                        <span>{new Date(c.expiresAt).toLocaleDateString("pt-BR")}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={reenviando === c.id}
                    onClick={() => handleReenviar(c)}
                  >
                    {reenviando === c.id ? "…" : "Reenviar"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
