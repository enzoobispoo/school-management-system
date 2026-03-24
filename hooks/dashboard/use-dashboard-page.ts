"use client";

import { useEffect, useState } from "react";

interface DashboardResponse {
  metricas: {
    totalAlunos: number;
    matriculasAtivas: number;
    receitaMensal: number;
    pagamentosPendentes: number;
    valoresAtrasados: number;
    quantidadePagamentosPendentes: number;
    quantidadePagamentosAtrasados: number;
  };
  receitaAoLongoDoTempo: Array<{
    month: string;
    receita: number;
  }>;
  alunosPorCurso: Array<{
    curso: string;
    alunos: number;
  }>;
  atividadesRecentes: Array<{
    id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    lida: boolean;
    createdAt: string;
  }>;
  notificacoes: Array<{
    id: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    lida: boolean;
    createdAt: string;
  }>;
}

type RecentActivityItem = {
  id: string;
  type: "enrollment" | "payment" | "new_student";
  name: string;
  description: string;
  time: string;
  initials: string;
};

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / 1000 / 60);
  const hours = Math.floor(diffMs / 1000 / 60 / 60);
  const days = Math.floor(diffMs / 1000 / 60 / 60 / 24);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function getActivityType(
  tipo: string
): "enrollment" | "payment" | "new_student" {
  if (tipo === "NOVA_MATRICULA") return "enrollment";
  if (tipo === "PAGAMENTO") return "payment";
  return "new_student";
}

function getInitialsFromMessage(mensagem: string) {
  const words = mensagem.trim().split(" ");
  const initials = words
    .filter((word) => word.length > 1)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "AT";
}

export function useDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar dashboard");
      }

      const result: DashboardResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metricas = data?.metricas;

  const metrics = {
    totalAlunos: loading ? "..." : String(metricas?.totalAlunos ?? 0),
    matriculasAtivas: loading ? "..." : String(metricas?.matriculasAtivas ?? 0),
    receitaMensal: loading
      ? "..."
      : formatCurrency(metricas?.receitaMensal ?? 0),
    pagamentosAtrasados: loading
      ? "..."
      : formatCurrency(metricas?.valoresAtrasados ?? 0),
    quantidadePagamentosAtrasados:
      metricas?.quantidadePagamentosAtrasados ?? 0,
    quantidadePagamentosPendentes:
      metricas?.quantidadePagamentosPendentes ?? 0,
  };

  const recentActivities: RecentActivityItem[] =
    data?.atividadesRecentes.map((item) => ({
      id: item.id,
      type: getActivityType(item.tipo),
      name: item.titulo,
      description: item.mensagem,
      time: formatRelativeTime(item.createdAt),
      initials: getInitialsFromMessage(item.mensagem),
    })) ?? [];

  return {
    data,
    loading,
    error,
    metrics,
    recentActivities,
    refreshDashboard: fetchDashboard,
  };
}