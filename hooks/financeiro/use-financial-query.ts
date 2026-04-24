"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/shared/use-debounced-value";

interface PagamentosResponse {
  data: Array<{
    id: string;
    descricao: string;
    valor: number;
    status: "PAGO" | "PENDENTE" | "ATRASADO" | "CANCELADO";
    vencimento: string;
    dataPagamento: string | null;
    competenciaMes: number;
    competenciaAno: number;
    metodoPagamento?: string | null;
    observacoes?: string | null;
    billingProvider?: string | null;
    billingExternalId?: string | null;
    billingInvoiceUrl?: string | null;
    billingBankSlipUrl?: string | null;
    billingStatus?: string | null;
    boletoGeradoEm?: string | null;
    ultimoLembreteEnviadoEm?: string | null;
    ultimoEnvio?: {
      id: string;
      canal: "WHATSAPP" | "EMAIL" | "SMS" | "SISTEMA";
      tipo: "BOLETO" | "LEMBRETE" | "COBRANCA_ATRASO";
      destino: string;
      status: "PENDENTE" | "ENVIADO" | "FALHO";
      provedor?: string | null;
      externalId?: string | null;
      mensagem?: string | null;
      erro?: string | null;
      createdAt: string;
    } | null;
    matricula: {
      id: string;
      status: string;
      aluno: {
        id: string;
        nome: string;
        email: string | null;
        telefone: string | null;
        status: string;
      };
      turma: {
        id: string;
        nome: string;
        curso: {
          id: string;
          nome: string;
          categoria: string;
          valorMensal: number;
        };
        professor: {
          id: string;
          nome: string;
        };
      };
    };
  }>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface PaymentTableItem {
  id: string;
  student: string;
  studentInitials: string;
  description: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
  dueDate: string;
  competence: string;
  metodoPagamento?: string | null;
  billingProvider?: string | null;
  billingExternalId?: string | null;
  billingInvoiceUrl?: string | null;
  billingBankSlipUrl?: string | null;
  billingStatus?: string | null;
  boletoGeradoEm?: string | null;
  hasBoleto: boolean;
  wasPaidAutomatically: boolean;
  lastSendAt?: string | null;
  lastSendStatus?: "sent" | "failed" | "pending" | null;
  lastSendType?: "boleto" | "reminder" | "overdue" | null;
  lastSendError?: string | null;
}

interface FinancialTotals {
  receitaTotal: number;
  recebidoMes: number;
  valoresPendentes: number;
  valoresAtrasados: number;
  quantidadePendentes: number;
  quantidadeAtrasados: number;
}

export interface FinancialAdvancedMetrics {
  receitaPrevista: number;
  taxaRecebimento: number;
  taxaInadimplencia: number;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function formatDateTime(dateString?: string | null) {
  if (!dateString) return null;

  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompetence(month?: number, year?: number) {
  if (!month || !year) return "-";
  return `${String(month).padStart(2, "0")}/${year}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mapLastSendStatus(
  status?: "PENDENTE" | "ENVIADO" | "FALHO"
): "sent" | "failed" | "pending" | null {
  if (!status) return null;
  if (status === "ENVIADO") return "sent";
  if (status === "FALHO") return "failed";
  return "pending";
}

function mapLastSendType(
  type?: "BOLETO" | "LEMBRETE" | "COBRANCA_ATRASO"
): "boleto" | "reminder" | "overdue" | null {
  if (!type) return null;
  if (type === "BOLETO") return "boleto";
  if (type === "LEMBRETE") return "reminder";
  return "overdue";
}

function normalizePayments(
  apiData: PagamentosResponse["data"]
): PaymentTableItem[] {
  const normalized: PaymentTableItem[] = apiData
    .filter((payment) => payment.status !== "CANCELADO")
    .map((payment) => {
      const hasBoleto = Boolean(
        payment.billingExternalId &&
          (payment.billingBankSlipUrl || payment.billingInvoiceUrl)
      );

      const wasPaidAutomatically =
        payment.status === "PAGO" &&
        !payment.metodoPagamento &&
        payment.billingStatus === "RECEIVED";

      return {
        id: payment.id,
        student: payment.matricula.aluno.nome,
        studentInitials: getInitials(payment.matricula.aluno.nome),
        description: payment.descricao,
        amount: payment.valor,
        status:
          payment.status === "ATRASADO"
            ? "overdue"
            : payment.status === "PENDENTE"
            ? "pending"
            : "paid",
        date: payment.dataPagamento ? formatDate(payment.dataPagamento) : "-",
        dueDate: formatDate(payment.vencimento),
        competence: formatCompetence(
          payment.competenciaMes,
          payment.competenciaAno
        ),
        metodoPagamento: payment.metodoPagamento,
        billingProvider: payment.billingProvider,
        billingExternalId: payment.billingExternalId,
        billingInvoiceUrl: payment.billingInvoiceUrl,
        billingBankSlipUrl: payment.billingBankSlipUrl,
        billingStatus: payment.billingStatus,
        boletoGeradoEm: payment.boletoGeradoEm,
        hasBoleto,
        wasPaidAutomatically,
        lastSendAt: formatDateTime(payment.ultimoEnvio?.createdAt),
        lastSendStatus: mapLastSendStatus(payment.ultimoEnvio?.status),
        lastSendType: mapLastSendType(payment.ultimoEnvio?.tipo),
        lastSendError: payment.ultimoEnvio?.erro ?? null,
      };
    });

  const order: Record<PaymentTableItem["status"], number> = {
    overdue: 0,
    pending: 1,
    paid: 2,
  };

  return normalized.sort((a, b) => order[a.status] - order[b.status]);
}

function calculateFinancialTotals(
  payments: PagamentosResponse["data"]
): FinancialTotals {
  const validPayments = payments.filter(
    (payment) => payment.status !== "CANCELADO"
  );

  const receitaTotal = validPayments
    .filter((payment) => payment.status === "PAGO")
    .reduce((acc, payment) => acc + payment.valor, 0);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const recebidoMes = validPayments
    .filter(
      (payment) =>
        payment.status === "PAGO" &&
        payment.competenciaMes === currentMonth &&
        payment.competenciaAno === currentYear
    )
    .reduce((acc, payment) => acc + payment.valor, 0);

  const pendentes = validPayments.filter(
    (payment) => payment.status === "PENDENTE"
  );

  const atrasados = validPayments.filter(
    (payment) => payment.status === "ATRASADO"
  );

  const valoresPendentes = pendentes.reduce(
    (acc, payment) => acc + payment.valor,
    0
  );

  const valoresAtrasados = atrasados.reduce(
    (acc, payment) => acc + payment.valor,
    0
  );

  return {
    receitaTotal,
    recebidoMes,
    valoresPendentes,
    valoresAtrasados,
    quantidadePendentes: pendentes.length,
    quantidadeAtrasados: atrasados.length,
  };
}

function calculateAdvancedMetrics(
  totals: FinancialTotals
): FinancialAdvancedMetrics {
  const receitaPrevista = totals.valoresPendentes + totals.valoresAtrasados;

  const baseRecebimento = totals.recebidoMes + totals.valoresPendentes;
  const taxaRecebimento =
    baseRecebimento > 0 ? (totals.recebidoMes / baseRecebimento) * 100 : 0;

  const baseInadimplencia =
    totals.receitaTotal + totals.valoresPendentes + totals.valoresAtrasados;
  const taxaInadimplencia =
    baseInadimplencia > 0
      ? (totals.valoresAtrasados / baseInadimplencia) * 100
      : 0;

  return {
    receitaPrevista,
    taxaRecebimento,
    taxaInadimplencia,
  };
}

export function useFinancialQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentId = searchParams.get("paymentId") || "";
  const tabStatus = searchParams.get("tab") || "all";
  const search = searchParams.get("search") || "";
  const month = searchParams.get("month") || "all";
  const page = Math.max(Number(searchParams.get("page") || "1"), 1);

  const debouncedSearch = useDebouncedValue(search, 400);

  const [payments, setPayments] = useState<PaymentTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<PagamentosResponse["meta"]>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  const [financialTotals, setFinancialTotals] = useState<FinancialTotals>({
    receitaTotal: 0,
    recebidoMes: 0,
    valoresPendentes: 0,
    valoresAtrasados: 0,
    quantidadePendentes: 0,
    quantidadeAtrasados: 0,
  });

  function updateParams(nextParams: Record<string, string | number | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextParams).forEach(([key, value]) => {
      if (
        value === null ||
        value === "" ||
        value === "all" ||
        (key === "page" && String(value) === "1")
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "?", { scroll: false });
  }

  const setTabStatus = (value: string) => {
    updateParams({
      tab: value,
      page: 1,
    });
  };

  const setSearch = (value: string) => {
    updateParams({
      search: value,
      page: 1,
    });
  };

  const setMonth = (value: string) => {
    updateParams({
      month: value,
      page: 1,
    });
  };

  const setPage = (value: number | ((prev: number) => number)) => {
    const nextPage = typeof value === "function" ? value(page) : value;

    updateParams({
      page: nextPage,
    });
  };

  const statusQuery = useMemo(() => {
    if (tabStatus === "all") return "";
    if (tabStatus === "paid") return "PAGO";
    if (tabStatus === "pending") return "PENDENTE";
    if (tabStatus === "overdue") return "ATRASADO";
    return "";
  }, [tabStatus]);

  const monthQuery = useMemo(() => {
    if (month === "all") return null;
    const [m, y] = month.split("-");
    return { month: m, year: y };
  }, [month]);

  const advancedMetrics = useMemo(
    () => calculateAdvancedMetrics(financialTotals),
    [financialTotals]
  );

  async function fetchPayments() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "10");

      if (paymentId) params.set("paymentId", paymentId);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (statusQuery) params.set("status", statusQuery);

      if (monthQuery) {
        params.set("competenciaMes", monthQuery.month);
        params.set("competenciaAno", monthQuery.year);
      }

      const response = await fetch(`/api/pagamentos?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar pagamentos");
      }

      const result: PagamentosResponse = await response.json();
      setPayments(normalizePayments(result.data));
      setMeta(result.meta);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os pagamentos.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchFinancialTotals() {
    try {
      setLoadingTotals(true);

      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "1000");

      const response = await fetch(`/api/pagamentos?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar totais financeiros");
      }

      const result: PagamentosResponse = await response.json();
      setFinancialTotals(calculateFinancialTotals(result.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTotals(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, [page, debouncedSearch, statusQuery, month, paymentId]);

  useEffect(() => {
    fetchFinancialTotals();
  }, []);

  return {
    payments,
    tabStatus,
    setTabStatus,
    search,
    setSearch,
    month,
    setMonth,
    loading,
    loadingTotals,
    error,
    setError,
    page,
    setPage,
    meta,
    fetchPayments,
    fetchFinancialTotals,
    financialTotals,
    advancedMetrics,
  };
}