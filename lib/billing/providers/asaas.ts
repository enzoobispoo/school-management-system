import { prisma } from "@/lib/prisma";

interface AsaasCustomerInput {
  name: string;
  email?: string | null;
  cpfCnpj?: string | null;
  mobilePhone?: string | null;
  externalId?: string;
}

interface CreateAsaasBoletoInput {
  customer: AsaasCustomerInput;
  value: number;
  dueDate: string; // YYYY-MM-DD
  description: string;
  externalReference?: string;
  interestPercentage?: number;
  finePercentage?: number;
}

interface AsaasCustomerResponse {
  id: string;
  name: string;
}

interface AsaasCustomerListResponse {
  data: AsaasCustomerResponse[];
}

interface AsaasPaymentResponse {
  id: string;
  customer: string;
  status: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
}

interface AsaasIdentificationFieldResponse {
  identificationField: string;
  nossoNumero: string;
  barCode: string;
}

function getAsaasBaseUrl(environment?: string | null) {
  return environment === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

function sanitizeDigits(value?: string | null) {
  return value?.replace(/\D/g, "") || undefined;
}

async function getBillingConfig() {
  const school = await prisma.escolaSettings.findUnique({
    where: { id: "default" },
    select: {
      billingEnabled: true,
      billingProvider: true,
      asaasApiKey: true,
      asaasEnvironment: true,
    },
  });

  if (!school?.billingEnabled) {
    throw new Error("A integração de cobrança não está ativada.");
  }

  if (school.billingProvider !== "asaas") {
    throw new Error("O provedor de cobrança configurado não é o Asaas.");
  }

  const apiKey = (school.asaasApiKey || process.env.ASAAS_API_KEY || "").trim();
  const environment = (
    school.asaasEnvironment ||
    process.env.ASAAS_ENVIRONMENT ||
    "sandbox"
  ).trim();

  if (!apiKey) {
    throw new Error("ASAAS API Key não configurada.");
  }

  if (/[^\x00-\x7F]/.test(apiKey)) {
    throw new Error("A chave da API do Asaas contém caracteres inválidos.");
  }

  return {
    apiKey,
    environment,
    baseUrl: getAsaasBaseUrl(environment),
  };
}

async function requestAsaas<T>(
  path: string,
  init: RequestInit,
  apiKey: string,
  baseUrl: string
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.errors?.[0]?.description ||
      data?.message ||
      "Erro ao comunicar com o Asaas.";
    throw new Error(message);
  }

  return data as T;
}

async function getOrCreateCustomer(
  input: AsaasCustomerInput,
  apiKey: string,
  baseUrl: string
) {
  if (input.externalId) {
    const existing = await requestAsaas<AsaasCustomerListResponse>(
      `/customers?externalReference=${input.externalId}`,
      { method: "GET" },
      apiKey,
      baseUrl
    );

    if (existing?.data?.length > 0) {
      return existing.data[0];
    }
  }

  if (input.cpfCnpj) {
    const existingByCpf = await requestAsaas<AsaasCustomerListResponse>(
      `/customers?cpfCnpj=${sanitizeDigits(input.cpfCnpj)}`,
      { method: "GET" },
      apiKey,
      baseUrl
    );

    if (existingByCpf?.data?.length > 0) {
      return existingByCpf.data[0];
    }
  }

  const created = await requestAsaas<AsaasCustomerResponse>(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        email: input.email || undefined,
        cpfCnpj: sanitizeDigits(input.cpfCnpj),
        mobilePhone: sanitizeDigits(input.mobilePhone),
        externalReference: input.externalId,
      }),
    },
    apiKey,
    baseUrl
  );

  return created;
}

export async function createAsaasBoleto(input: CreateAsaasBoletoInput) {
  const { apiKey, baseUrl } = await getBillingConfig();

  const customer = await getOrCreateCustomer(input.customer, apiKey, baseUrl);

  const payment = await requestAsaas<AsaasPaymentResponse>(
    "/payments",
    {
      method: "POST",
      body: JSON.stringify({
        customer: customer.id,
        billingType: "BOLETO",
        value: input.value,
        dueDate: input.dueDate,
        description: input.description,
        externalReference: input.externalReference,
        interest:
          input.interestPercentage && input.interestPercentage > 0
            ? { value: input.interestPercentage }
            : undefined,
        fine:
          input.finePercentage && input.finePercentage > 0
            ? { value: input.finePercentage }
            : undefined,
      }),
    },
    apiKey,
    baseUrl
  );

  let identificationField: AsaasIdentificationFieldResponse | null = null;

  try {
    identificationField = await requestAsaas<AsaasIdentificationFieldResponse>(
      `/lean/payments/${payment.id}/identificationField`,
      {
        method: "GET",
      },
      apiKey,
      baseUrl
    );
  } catch {
    identificationField = null;
  }

  return {
    customerId: customer.id,
    paymentId: payment.id,
    status: payment.status,
    invoiceUrl: payment.invoiceUrl || null,
    bankSlipUrl: payment.bankSlipUrl || null,
    identificationField: identificationField?.identificationField || null,
    nossoNumero: identificationField?.nossoNumero || null,
    barCode: identificationField?.barCode || null,
  };
}