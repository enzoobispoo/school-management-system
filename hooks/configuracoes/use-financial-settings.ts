"use client";

import { useEffect, useState } from "react";

interface FinancialSettingsForm {
  diaVencimentoPadrao: string;
  metodoPagamentoPadrao: string;
  multaAtrasoPercentual: string;
  jurosMensalPercentual: string;
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
}

export function useFinancialSettings() {
  const [form, setForm] = useState<FinancialSettingsForm>({
    diaVencimentoPadrao: "10",
    metodoPagamentoPadrao: "",
    multaAtrasoPercentual: "",
    jurosMensalPercentual: "",
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

        setForm({
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

      const response = await fetch("/api/settings/escola", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeEscola: "default",
          diaVencimentoPadrao: Number(form.diaVencimentoPadrao || 10),
          metodoPagamentoPadrao: form.metodoPagamentoPadrao || null,
          multaAtrasoPercentual: form.multaAtrasoPercentual || null,
          jurosMensalPercentual: form.jurosMensalPercentual || null,
          gerarMensalidadeAuto: form.gerarMensalidadeAuto,

          billingProvider: form.billingProvider,
          billingEnabled: form.billingEnabled,
          asaasApiKey: form.asaasApiKey || null,
          asaasWalletId: form.asaasWalletId || null,
          asaasEnvironment: form.asaasEnvironment,
          defaultChargeMethod: form.defaultChargeMethod,
          autoGenerateBoleto: form.autoGenerateBoleto,

          enviarLembreteAuto: form.enviarLembreteAuto,
          autoSendBoletoWhatsApp: form.autoSendBoletoWhatsApp,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Não foi possível salvar as configurações."
        );
      }

      setSuccess("Configurações financeiras salvas com sucesso.");
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