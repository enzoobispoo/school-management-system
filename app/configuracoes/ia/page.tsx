"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AiProviderMode = "PLATFORM" | "CUSTOM";

interface AiSettingsResponse {
  aiProviderMode: AiProviderMode;
  hasCustomKey: boolean;
  maskedCustomKey: string | null;
  aiMonthlyLimit: number;
  aiUsageCount: number;
  aiUsageResetAt: string;
  hasPlatformKey: boolean;
  error?: string;
}

export default function ConfiguracoesIaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [aiProviderMode, setAiProviderMode] =
    useState<AiProviderMode>("PLATFORM");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [maskedCustomKey, setMaskedCustomKey] = useState<string | null>(null);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [hasPlatformKey, setHasPlatformKey] = useState(false);
  const [aiMonthlyLimit, setAiMonthlyLimit] = useState("1000");
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const [aiUsageResetAt, setAiUsageResetAt] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/configuracoes/ia", {
        cache: "no-store",
      });

      const result: AiSettingsResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Não foi possível carregar as configurações de IA."
        );
      }

      setAiProviderMode(result.aiProviderMode);
      setMaskedCustomKey(result.maskedCustomKey);
      setHasCustomKey(result.hasCustomKey);
      setHasPlatformKey(result.hasPlatformKey);
      setAiMonthlyLimit(String(result.aiMonthlyLimit));
      setAiUsageCount(result.aiUsageCount);
      setAiUsageResetAt(result.aiUsageResetAt);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as configurações de IA."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/configuracoes/ia", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aiProviderMode,
          openaiApiKey,
          aiMonthlyLimit: Number(aiMonthlyLimit),
        }),
      });

      const result: AiSettingsResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Não foi possível salvar as configurações de IA."
        );
      }

      setMaskedCustomKey(result.maskedCustomKey);
      setHasCustomKey(result.hasCustomKey);
      setAiUsageCount(result.aiUsageCount);
      setAiUsageResetAt(result.aiUsageResetAt);
      setOpenaiApiKey("");
      setSuccess("Configurações de IA salvas com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar as configurações de IA."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Configurações de IA"
        description="Defina se o sistema usa a chave da plataforma ou a chave do cliente."
      />

      <div className="p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-semibold text-black">
              Modo de utilização da IA
            </h2>
            <p className="mt-2 text-sm text-black/55">
              Escolha se a IA será cobrada da sua conta da OpenAI ou da chave do
              cliente.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAiProviderMode("PLATFORM")}
                className={`rounded-[24px] border p-4 text-left transition ${
                  aiProviderMode === "PLATFORM"
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-black"
                }`}
              >
                <p className="font-medium">Modo Plataforma</p>
                <p
                  className={`mt-1 text-sm ${
                    aiProviderMode === "PLATFORM"
                      ? "text-white/80"
                      : "text-black/55"
                  }`}
                >
                  Usa a OPENAI_API_KEY do ambiente da Vercel/.env.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAiProviderMode("CUSTOM")}
                className={`rounded-[24px] border p-4 text-left transition ${
                  aiProviderMode === "CUSTOM"
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-black"
                }`}
              >
                <p className="font-medium">Modo Chave do Cliente</p>
                <p
                  className={`mt-1 text-sm ${
                    aiProviderMode === "CUSTOM"
                      ? "text-white/80"
                      : "text-black/55"
                  }`}
                >
                  Usa uma OPENAI_API_KEY salva dentro do sistema.
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-lg font-semibold text-black">
              Status atual da IA
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] bg-black/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-black/45">
                  Chave da plataforma
                </p>
                <p className="mt-1 text-sm font-medium text-black">
                  {hasPlatformKey ? "Configurada" : "Não configurada"}
                </p>
              </div>

              <div className="rounded-[20px] bg-black/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-black/45">
                  Chave personalizada
                </p>
                <p className="mt-1 text-sm font-medium text-black">
                  {hasCustomKey
                    ? maskedCustomKey || "Configurada"
                    : "Não configurada"}
                </p>
              </div>

              <div className="rounded-[20px] bg-black/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-black/45">
                  Uso mensal da plataforma
                </p>
                <p className="mt-1 text-sm font-medium text-black">
                  {aiUsageCount} / {aiMonthlyLimit}
                </p>
              </div>

              <div className="rounded-[20px] bg-black/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-black/45">
                  Reinício da contagem
                </p>
                <p className="mt-1 text-sm font-medium text-black">
                  {aiUsageResetAt
                    ? new Date(aiUsageResetAt).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-lg font-semibold text-black">
              Configuração operacional
            </h3>

            <div className="mt-6 grid gap-5">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-black">
                  OPENAI_API_KEY do cliente
                </label>
                <Input
                  type="password"
                  placeholder="Cole aqui a chave do cliente, se necessário"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  className="h-11 rounded-2xl"
                />
                <p className="text-xs text-black/45">
                  Preencha apenas se quiser usar uma chave personalizada no modo
                  do cliente.
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-black">
                  Limite mensal da IA da plataforma
                </label>
                <Input
                  type="number"
                  min={1}
                  value={aiMonthlyLimit}
                  onChange={(e) => setAiMonthlyLimit(e.target.value)}
                  className="h-11 rounded-2xl"
                />
                <p className="text-xs text-black/45">
                  Esse limite é usado apenas quando o sistema estiver operando em
                  modo plataforma.
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-5 rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm text-black">
                {success}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleSave}
                disabled={saving || loading}
                className="h-11 rounded-2xl bg-black px-5 text-white hover:bg-black/90"
              >
                {saving ? "Salvando..." : "Salvar configurações"}
              </Button>

              <Button
                variant="outline"
                onClick={loadSettings}
                disabled={saving || loading}
                className="h-11 rounded-2xl"
              >
                Recarregar
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-lg font-semibold text-black">
              Como isso funciona na venda
            </h3>
            <div className="mt-3 space-y-2 text-sm text-black/60">
              <p>
                • <strong>Modo Plataforma:</strong> você fornece a IA e controla
                o custo via limite mensal.
              </p>
              <p>
                • <strong>Modo Chave do Cliente:</strong> o cliente paga a própria
                OpenAI e você apenas integra a chave no sistema.
              </p>
              <p>
                • Esse modelo é ideal para vender planos diferentes do sistema no
                futuro.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}