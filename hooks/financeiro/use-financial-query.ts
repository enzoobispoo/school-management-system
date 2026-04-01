"use client";

import { useEffect, useMemo, useState } from "react";

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
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function formatCompetence(month: number, year: number) {
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

function normalizePayments(
  apiData: PagamentosResponse["data"]
): PaymentTableItem[] {
  const normalized: PaymentTableItem[] = apiData
    .filter((payment) => payment.status !== "CANCELADO")
    .map((payment) => ({
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
    }));

  const order: Record<PaymentTableItem["status"], number> = {
    overdue: 0,
    pending: 1,
    paid: 2,
  };

  return normalized.sort((a, b) => order[a.status] - order[b.status]);
}

export function useFinancialQuery() {
  const [payments, setPayments] = useState<PaymentTableItem[]>([]);
  const [rawPayments, setRawPayments] = useState<PagamentosResponse["data"]>([]);
  const [tabStatus, setTabStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PagamentosResponse["meta"]>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

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

  async function fetchPayments() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "10");

      if (search.trim()) params.set("search", search.trim());
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
      setRawPayments(result.data);
      setPayments(normalizePayments(result.data));
      setMeta(result.meta);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os pagamentos.");
    } finally {
      setLoading(false);
    }
  }

  const financialTotals = useMemo(() => {
    const validPayments = rawPayments.filter(
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
  }, [rawPayments]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPayments();
    }, 300);

    return () => clearTimeout(timeout);
  }, [page, search, statusQuery, month]);

  return {
    payments,
    rawPayments,
    tabStatus,
    setTabStatus,
    search,
    setSearch,
    month,
    setMonth,
    loading,
    error,
    setError,
    page,
    setPage,
    meta,
    fetchPayments,
    financialTotals,
  };
}