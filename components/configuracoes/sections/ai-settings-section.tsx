"use client";

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Info,
  MessageCircle,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EscolaIaPayload = {
  planTier: string;
  allowOpenAi: boolean;
  allowCustomTwilio: boolean;
  planDefaultAiMonthlyLimit: number;
  aiMonthlyLimit: number;
  aiMonthlyLimitOverride: number | null;
  aiUsageCount: number;
  aiUsageResetAt: string;
  hasOpenaiApiKey: boolean;
  maskedOpenaiApiKey: string | null;
  hasAnthropicApiKey: boolean;
  maskedAnthropicApiKey: string | null;
  hasGoogleGeminiApiKey: boolean;
  maskedGoogleGeminiApiKey: string | null;
  hasFalAiApiKey: boolean;
  maskedFalAiApiKey: string | null;
  twilioAccountSid: string | null;
  hasTwilioAuthToken: boolean;
  maskedTwilioAuthToken: string | null;
  twilioWhatsAppFrom: string | null;
  aiEvalReviewEnforced: boolean;
  aiEvalReviewMinScore: number;
};

const TIER_LABEL: Record<string, string> = {
  starter:
    "EduIA integrada ao sistema (sem OpenAI). WhatsApp pelo número da plataforma. Cobrança apenas Asaas.",
  basic:
    "OpenAI com a chave da sua escola. WhatsApp pelo número da plataforma. Cobrança apenas Asaas.",
  full: "OpenAI com limites maiores. Twilio próprio para WhatsApp e escolha do provedor de cobrança.",
};

function IntegrationCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
      <div className="flex gap-3 border-b border-border/60 bg-muted/25 px-4 py-3">
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

export function AiSettingsSection() {
  const [data, setData] = useState<EscolaIaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [falKey, setFalKey] = useState("");
  const [limitOverride, setLimitOverride] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");
  const [evalReviewEnforced, setEvalReviewEnforced] = useState(false);
  const [evalReviewMinScore, setEvalReviewMinScore] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/settings/escola-ia", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erro ao carregar.");
      setData(j);
      setOpenaiKey("");
      setAnthropicKey("");
      setGeminiKey("");
      setFalKey("");
      setLimitOverride(j.aiMonthlyLimitOverride != null ? String(j.aiMonthlyLimitOverride) : "");
      setTwilioSid(j.twilioAccountSid ?? "");
      setTwilioToken("");
      setTwilioFrom(j.twilioWhatsAppFrom ?? "");
      setEvalReviewEnforced(Boolean(j.aiEvalReviewEnforced));
      setEvalReviewMinScore(String(j.aiEvalReviewMinScore ?? 70));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body: Record<string, unknown> = {};
      if (data?.allowOpenAi) {
        if (openaiKey.trim()) body.openaiApiKey = openaiKey.trim();
        if (anthropicKey.trim()) body.anthropicApiKey = anthropicKey.trim();
        if (geminiKey.trim()) body.googleGeminiApiKey = geminiKey.trim();
        if (falKey.trim()) body.falAiApiKey = falKey.trim();
        if (limitOverride.trim() === "") body.aiMonthlyLimitOverride = null;
        else body.aiMonthlyLimitOverride = Number(limitOverride.replace(",", "."));
        body.aiEvalReviewEnforced = evalReviewEnforced;
        body.aiEvalReviewMinScore = Number(evalReviewMinScore || "70");
      }
      if (data?.allowCustomTwilio) {
        body.twilioAccountSid = twilioSid.trim() || null;
        if (twilioToken.trim()) body.twilioAuthToken = twilioToken.trim();
        body.twilioWhatsAppFrom = twilioFrom.trim() || null;
      }

      const r = await fetch("/api/settings/escola-ia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erro ao salvar.");
      setData(j);
      setOpenaiKey("");
      setAnthropicKey("");
      setGeminiKey("");
      setFalKey("");
      setTwilioToken("");
      setSuccess("Alterações salvas.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando integrações…</p>;
  }

  if (error && !data) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) return null;

  const hasEditableBlocks = data.allowOpenAi || data.allowCustomTwilio;

  return (
    <div className="max-w-3xl w-full space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">IA e integrações</h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Configure chaves e limites conforme o plano contratado.{" "}
          <span className="text-foreground/90">
            Alterações de plano são feitas pelo administrador da plataforma.
          </span>
        </p>
      </div>

      <IntegrationCard
        icon={Tag}
        title="Seu plano"
        description="Define quais integrações ficam disponíveis nesta página."
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {data.planTier}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
          {TIER_LABEL[data.planTier] ?? ""}
        </p>
      </IntegrationCard>

      {data.allowOpenAi && (
        <IntegrationCard
          icon={Sparkles}
          title="EduIA (OpenAI)"
          description="Modelo avançado para o assistente do dashboard. A chave fica apenas na sua escola."
        >
          <div className="space-y-1.5">
            <Label htmlFor="so-openai">Chave da API</Label>
            <Input
              id="so-openai"
              type="password"
              autoComplete="off"
              placeholder={data.hasOpenaiApiKey ? "Nova chave (opcional)" : "Cole a chave (sk-…)"}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="h-9"
            />
            {data.hasOpenaiApiKey && (
              <p className="text-[12px] text-muted-foreground">
                Chave atual: {data.maskedOpenaiApiKey ?? "••••"}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="so-limit">Limite mensal de uso (máx. {data.planDefaultAiMonthlyLimit})</Label>
            <Input
              id="so-limit"
              inputMode="numeric"
              placeholder={`Padrão do plano: ${data.planDefaultAiMonthlyLimit}`}
              value={limitOverride}
              onChange={(e) => setLimitOverride(e.target.value)}
              className="h-9 max-w-xs"
            />
            <p className="text-[12px] text-muted-foreground">
              Consumo no período:{" "}
              <span className="font-medium text-foreground">
                {data.aiUsageCount} / {data.aiMonthlyLimit}
              </span>
              {data.aiUsageResetAt && (
                <span className="text-muted-foreground">
                  {" "}
                  · base {new Date(data.aiUsageResetAt).toLocaleDateString("pt-BR")}
                </span>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">
                Exigir revisão IA antes de criar avaliação
              </span>
              <input
                type="checkbox"
                checked={evalReviewEnforced}
                onChange={(e) => setEvalReviewEnforced(e.target.checked)}
                className="h-4 w-4"
              />
            </label>
            <div className="mt-2">
              <Label htmlFor="so-eval-min">Nota mínima de qualidade (0-100)</Label>
              <Input
                id="so-eval-min"
                inputMode="numeric"
                value={evalReviewMinScore}
                onChange={(e) => setEvalReviewMinScore(e.target.value)}
                className="mt-1 h-9 max-w-[160px]"
              />
            </div>
          </div>
        </IntegrationCard>
      )}

      {data.allowOpenAi && (
        <IntegrationCard
          icon={Boxes}
          title="Outros provedores de IA (opcional)"
          description="Armazene chaves para integrações futuras (Claude, Gemini, Fal.ai). Hoje a EduIA docente usa apenas OpenAI; as demais podem ser ligadas em versões seguintes."
        >
          <div className="space-y-1.5">
            <Label htmlFor="so-anthropic">Anthropic (Claude)</Label>
            <Input
              id="so-anthropic"
              type="password"
              autoComplete="off"
              placeholder={data.hasAnthropicApiKey ? "Nova chave (opcional)" : "sk-ant-…"}
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="h-9 font-mono text-[12px]"
            />
            {data.hasAnthropicApiKey ?
              <p className="text-[12px] text-muted-foreground">
                Chave atual: {data.maskedAnthropicApiKey ?? "••••"}
              </p>
            : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="so-gemini">Google Gemini</Label>
            <Input
              id="so-gemini"
              type="password"
              autoComplete="off"
              placeholder={data.hasGoogleGeminiApiKey ? "Nova chave (opcional)" : "AIza…"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="h-9 font-mono text-[12px]"
            />
            {data.hasGoogleGeminiApiKey ?
              <p className="text-[12px] text-muted-foreground">
                Chave atual: {data.maskedGoogleGeminiApiKey ?? "••••"}
              </p>
            : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="so-fal">Fal.ai (imagens / vídeo)</Label>
            <Input
              id="so-fal"
              type="password"
              autoComplete="off"
              placeholder={data.hasFalAiApiKey ? "Novo token (opcional)" : "Token Fal…"}
              value={falKey}
              onChange={(e) => setFalKey(e.target.value)}
              className="h-9 font-mono text-[12px]"
            />
            {data.hasFalAiApiKey ?
              <p className="text-[12px] text-muted-foreground">
                Chave atual: {data.maskedFalAiApiKey ?? "••••"}
              </p>
            : null}
          </div>
          <p className="text-[12px] text-muted-foreground border-l-2 border-border pl-3 leading-relaxed">
            Campos em branco não alteram chaves já salvas. Para remover uma chave existente, use o endpoint administrativo enviando{" "}
            <span className="font-mono text-[11px]">null</span> ou peça ao suporte.
          </p>
        </IntegrationCard>
      )}

      {data.allowCustomTwilio && (
        <IntegrationCard
          icon={MessageCircle}
          title="WhatsApp (Twilio)"
          description="Use seu próprio número Twilio para lembretes e envio de boletos. Se estiver vazio, usa-se o número padrão da plataforma."
        >
          <div className="space-y-1.5">
            <Label htmlFor="tw-sid">Account SID</Label>
            <Input
              id="tw-sid"
              value={twilioSid}
              onChange={(e) => setTwilioSid(e.target.value)}
              className="h-9 font-mono text-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tw-token">Auth token</Label>
            <Input
              id="tw-token"
              type="password"
              autoComplete="off"
              placeholder={data.hasTwilioAuthToken ? "Novo token (opcional)" : ""}
              value={twilioToken}
              onChange={(e) => setTwilioToken(e.target.value)}
              className="h-9"
            />
            {data.hasTwilioAuthToken && (
              <p className="text-[12px] text-muted-foreground">Token atual: {data.maskedTwilioAuthToken}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tw-from">WhatsApp From</Label>
            <Input
              id="tw-from"
              value={twilioFrom}
              onChange={(e) => setTwilioFrom(e.target.value)}
              placeholder="whatsapp:+5511999990000"
              className="h-9 font-mono text-[12px]"
            />
          </div>
        </IntegrationCard>
      )}

      {!hasEditableBlocks && (
        <div className="flex gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
          <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            No plano atual não há integrações adicionais para configurar aqui. Ao fazer upgrade para{" "}
            <span className="font-medium text-foreground">Basic</span> ou{" "}
            <span className="font-medium text-foreground">Full</span>, OpenAI e/ou Twilio aparecem
            automaticamente.
          </p>
        </div>
      )}

      {hasEditableBlocks && (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-4 py-4 space-y-3">
          <div className="flex gap-2 text-[12px] text-muted-foreground">
            <Zap className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <span>
              As alterações abrangem EduIA e WhatsApp conforme os blocos acima. Revise cada seção antes de
              salvar.
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Salvando…" : "Salvar integrações"}
            </Button>
            <Button type="button" variant="outline" onClick={() => load()}>
              Recarregar
            </Button>
          </div>
        </div>
      )}

      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 px-1" role="status">
          {success}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 px-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
