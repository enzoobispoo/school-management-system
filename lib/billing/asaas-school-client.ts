import "server-only";

import { prisma } from "@/lib/prisma";

function getAsaasBaseUrl(environment?: string | null) {
  return environment === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

export type SchoolAsaasConfig = {
  apiKey: string;
  baseUrl: string;
  environment: string;
  billingEnabled: boolean;
  billingProvider: string | null;
};

export async function getSchoolAsaasConfig(
  schoolId: string
): Promise<SchoolAsaasConfig> {
  const settings = await prisma.escolaSettings.findUnique({
    where: { schoolId },
    select: {
      billingEnabled: true,
      billingProvider: true,
      asaasApiKey: true,
      asaasEnvironment: true,
    },
  });

  if (!settings) {
    throw new Error("ESCOLA_SETTINGS_NOT_FOUND");
  }

  const apiKey = (
    settings.asaasApiKey?.trim() ||
    process.env.ASAAS_API_KEY ||
    ""
  ).trim();
  const environment = (
    settings.asaasEnvironment ||
    process.env.ASAAS_ENVIRONMENT ||
    "sandbox"
  ).trim();

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY_AUSENTE");
  }

  if (/[^\x00-\x7F]/.test(apiKey)) {
    throw new Error("ASAAS_API_KEY_INVALIDA");
  }

  return {
    apiKey,
    environment,
    baseUrl: getAsaasBaseUrl(environment),
    billingEnabled: settings.billingEnabled,
    billingProvider: settings.billingProvider ?? null,
  };
}

export async function fetchAsaasJson<T>(
  schoolId: string,
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 25_000, ...rest } = init;
  const { apiKey, baseUrl } = await getSchoolAsaasConfig(schoolId);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
        ...(rest.headers || {}),
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        data?.errors?.[0]?.description ||
        data?.message ||
        `Asaas HTTP ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Chamada real ao Asaas: saldo da conta (sanidade / conciliação). */
export async function fetchAsaasFinanceBalance(schoolId: string) {
  const cfg = await getSchoolAsaasConfig(schoolId);
  if (!cfg.billingEnabled) {
    throw new Error("BILLING_DISABLED");
  }
  if ((cfg.billingProvider || "asaas") !== "asaas") {
    throw new Error("PROVEDOR_NAO_ASAAS");
  }

  return fetchAsaasJson<{
    balance?: number;
    pendingBalance?: number;
  }>(schoolId, "/finance/balance", { method: "GET" });
}
