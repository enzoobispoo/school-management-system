"use client";

import { useEffect, useState } from "react";

export type UserItem = {
  id: string;
  nome: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";
  ativo: boolean;
};

interface SystemSettings {
  billingProvider: string;
  billingEnabled: boolean;
  asaasApiKey: string;
  asaasWalletId: string;
  asaasEnvironment: string;
  defaultChargeMethod: string;
  autoGenerateBoleto: boolean;
  autoSendBoletoWhatsApp: boolean;
  aiProviderMode: string;
  openaiApiKey: string;
  aiMonthlyLimit: string;
}

const defaultSystem: SystemSettings = {
  billingProvider: "asaas",
  billingEnabled: false,
  asaasApiKey: "",
  asaasWalletId: "",
  asaasEnvironment: "sandbox",
  defaultChargeMethod: "boleto",
  autoGenerateBoleto: false,
  autoSendBoletoWhatsApp: false,
  aiProviderMode: "PLATFORM",
  openaiApiKey: "",
  aiMonthlyLimit: "1000",
};

export function useUsersSettings() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [systemSettings, setSystemSettings] =
    useState<SystemSettings>(defaultSystem);
  const [savingSystem, setSavingSystem] = useState(false);
  const [systemSuccess, setSystemSuccess] = useState("");
  const [systemError, setSystemError] = useState("");

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        const isSuperAdmin = res.ok && data.user?.role === "SUPER_ADMIN";
        setHasAccess(isSuperAdmin);
      } catch {
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    }
    checkAccess();
  }, []);

  useEffect(() => {
    if (!hasAccess) return;

    async function loadAll() {
      try {
        setLoading(true);
        const [usersRes, schoolRes, iaRes] = await Promise.all([
          fetch("/api/users", { cache: "no-store" }),
          fetch("/api/settings/escola", { cache: "no-store" }),
          fetch("/api/settings/ia", { cache: "no-store" }),
        ]);

        const usersData = await usersRes.json();
        const schoolData = await schoolRes.json();
        const iaData = await iaRes.json();

        if (usersRes.ok) setUsers(usersData);

        setSystemSettings({
          billingProvider: schoolData.billingProvider ?? "asaas",
          billingEnabled: Boolean(schoolData.billingEnabled),
          asaasApiKey: schoolData.asaasApiKey ?? "",
          asaasWalletId: schoolData.asaasWalletId ?? "",
          asaasEnvironment: schoolData.asaasEnvironment ?? "sandbox",
          defaultChargeMethod: schoolData.defaultChargeMethod ?? "boleto",
          autoGenerateBoleto: Boolean(schoolData.autoGenerateBoleto),
          autoSendBoletoWhatsApp: Boolean(schoolData.autoSendBoletoWhatsApp),
          aiProviderMode: iaData.aiProviderMode ?? "PLATFORM",
          openaiApiKey: iaData.openaiApiKey ?? "",
          aiMonthlyLimit: String(iaData.aiMonthlyLimit ?? 1000),
        });
      } catch {
        setError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [hasAccess]);

  function updateSystemField<K extends keyof SystemSettings>(
    field: K,
    value: SystemSettings[K]
  ) {
    setSystemSettings((prev) => ({ ...prev, [field]: value }));
  }

  async function saveSystemSettings(): Promise<void> {
    try {
      setSavingSystem(true);
      setSystemError("");
      setSystemSuccess("");

      const [schoolRes, iaRes] = await Promise.all([
        fetch("/api/settings/escola", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billingProvider: systemSettings.billingProvider,
            billingEnabled: systemSettings.billingEnabled,
            asaasApiKey: systemSettings.asaasApiKey || null,
            asaasWalletId: systemSettings.asaasWalletId || null,
            asaasEnvironment: systemSettings.asaasEnvironment,
            defaultChargeMethod: systemSettings.defaultChargeMethod,
            autoGenerateBoleto: systemSettings.autoGenerateBoleto,
            autoSendBoletoWhatsApp: systemSettings.autoSendBoletoWhatsApp,
          }),
        }),
        fetch("/api/settings/ia", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aiProviderMode: systemSettings.aiProviderMode,
            openaiApiKey: systemSettings.openaiApiKey || null,
            aiMonthlyLimit: Number(systemSettings.aiMonthlyLimit),
          }),
        }),
      ]);

      if (!schoolRes.ok || !iaRes.ok) {
        throw new Error("Erro ao salvar configurações.");
      }

      setSystemSuccess("Configurações salvas com sucesso.");
    } catch (err) {
      setSystemError(
        err instanceof Error ? err.message : "Erro ao salvar configurações."
      );
    } finally {
      setSavingSystem(false);
    }
  }

  async function updateUser(
    id: string,
    payload: Partial<Pick<UserItem, "role" | "ativo">>
  ) {
    try {
      setSavingId(id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao atualizar usuário.");

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...data } : u))
      );
      setSuccess("Usuário atualizado com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar usuário.");
    } finally {
      setSavingId("");
    }
  }

  return {
    users,
    loading,
    checkingAccess,
    hasAccess,
    savingId,
    success,
    error,
    updateUser,
    systemSettings,
    savingSystem,
    systemSuccess,
    systemError,
    updateSystemField,
    saveSystemSettings,
  };
}
