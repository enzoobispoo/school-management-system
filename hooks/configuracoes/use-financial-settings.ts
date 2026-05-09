"use client";

import { useEffect, useState } from "react";
import type { PlanTier } from "@/lib/school-plan";

interface FinancialSettingsForm {
  planTier: PlanTier;
  diaVencimentoPadrao: string;
  metodoPagamentoPadrao: string;
  multaAtrasoPercentual: string;
  jurosMensalPercentual: string;
  metaMensal: string;
  gerarMensalidadeAuto: boolean;

  billingProvider: string;
  billingEnabled: boolean;
  asaasApiKey: string;
  asaasWalletId: string;
  asaasEnvironment: string;
  defaultChargeMethod: string;
  autoGenerateBoleto: boolean;

  enviarLembreteAuto: boolean;
  autoSendBoletoWhatsApp: boolean;
  reguaCobrancaDias: string;
  suspenderAposInadimplenciaDias: string;
  subscriptionInadimplenciaAction: "SUSPENDER" | "CANCELAR";
  subscriptionInadimplenciaDias: string;
  /** Plano Full: instituição onde a escola prefere receber mensalidades (preferência operacional). */
  payoutBankSlug: string;
}

export function useFinancialSettings() {
  const [form, setForm] = useState<FinancialSettingsForm>({
    planTier: "starter",
    diaVencimentoPadrao: "10",
    metodoPagamentoPadrao: "",
    multaAtrasoPercentual: "",
    jurosMensalPercentual: "",
    metaMensal: "",
    gerarMensalidadeAuto: false,

    billingProvider: "asaas",
    billingEnabled: false,
    asaasApiKey: "",
    asaasWalletId: "",
    asaasEnvironment: "sandbox",
    defaultChargeMethod: "boleto",
    autoGenerateBoleto: false,

    enviarLembreteAuto: false,
    autoSendBoletoWhatsApp: false,
    reguaCobrancaDias: "1,3,7",
    suspenderAposInadimplenciaDias: "30",
    subscriptionInadimplenciaAction: "SUSPENDER",
    subscriptionInadimplenciaDias: "45",
    payoutBankSlug: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof FinancialSettingsForm>(
    field: K,
    value: FinancialSettingsForm[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/settings/escola", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error || "Não foi possível carregar as configurações."
          );
        }

        const school = result?.school ?? result;
        const tier = (school?.planTier ?? "starter") as PlanTier;

        setForm({
          planTier: tier,
          diaVencimentoPadrao: String(school?.diaVencimentoPadrao ?? "10"),
          metodoPagamentoPadrao: school?.metodoPagamentoPadrao ?? "",
          multaAtrasoPercentual:
            school?.multaAtrasoPercentual !== null &&
            school?.multaAtrasoPercentual !== undefined
              ? String(school.multaAtrasoPercentual)
              : "",
          jurosMensalPercentual:
            school?.jurosMensalPercentual !== null &&
            school?.jurosMensalPercentual !== undefined
              ? String(school.jurosMensalPercentual)
              : "",
          metaMensal: school?.metaMensal ? String(school.metaMensal) : "",
          gerarMensalidadeAuto: Boolean(school?.gerarMensalidadeAuto),

          billingProvider: school?.billingProvider ?? "asaas",
          billingEnabled: Boolean(school?.billingEnabled),
          asaasApiKey: school?.asaasApiKey ?? "",
          asaasWalletId: school?.asaasWalletId ?? "",
          asaasEnvironment: school?.asaasEnvironment ?? "sandbox",
          defaultChargeMethod: school?.defaultChargeMethod ?? "boleto",
          autoGenerateBoleto: Boolean(school?.autoGenerateBoleto),

          enviarLembreteAuto: Boolean(school?.enviarLembreteAuto),
          autoSendBoletoWhatsApp: Boolean(school?.autoSendBoletoWhatsApp),
          reguaCobrancaDias: school?.reguaCobrancaDias ?? "1,3,7",
          suspenderAposInadimplenciaDias: String(
            school?.suspenderAposInadimplenciaDias ?? 30
          ),
          subscriptionInadimplenciaAction:
            school?.subscriptionInadimplenciaAction === "CANCELAR"
              ? "CANCELAR"
              : "SUSPENDER",
          subscriptionInadimplenciaDias: String(
            school?.subscriptionInadimplenciaDias ?? 45
          ),
          payoutBankSlug:
            typeof school?.payoutBankSlug === "string" ?
              school.payoutBankSlug
            : "",
        });
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as configurações."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setSuccess("");
      setError("");

      const payload: Record<string, unknown> = {
        diaVencimentoPadrao: Number(form.diaVencimentoPadrao || 10),
        metodoPagamentoPadrao: form.metodoPagamentoPadrao || null,
        multaAtrasoPercentual: form.multaAtrasoPercentual || null,
        jurosMensalPercentual: form.jurosMensalPercentual || null,
        metaMensal: form.metaMensal ? Number(form.metaMensal) : null,
        gerarMensalidadeAuto: form.gerarMensalidadeAuto,
        enviarLembreteAuto: form.enviarLembreteAuto,
        autoSendBoletoWhatsApp: form.autoSendBoletoWhatsApp,
        reguaCobrancaDias: form.reguaCobrancaDias || "1,3,7",
        suspenderAposInadimplenciaDias: Number(
          form.suspenderAposInadimplenciaDias || 30
        ),
        subscriptionInadimplenciaAction:
          form.subscriptionInadimplenciaAction,
        subscriptionInadimplenciaDias: Number(
          form.subscriptionInadimplenciaDias || 45
        ),
      };

      if (form.planTier === "full") {
        payload.payoutBankSlug =
          form.payoutBankSlug.trim() === "" ? null : form.payoutBankSlug.trim();
      }

      const response = await fetch("/api/settings/escola", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Não foi possível salvar as configurações."
        );
      }

      setSuccess("settings.financial.saveSuccess");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar as configurações."
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    loading,
    saving,
    success,
    error,
    updateField,
    handleSave,
  };
}
