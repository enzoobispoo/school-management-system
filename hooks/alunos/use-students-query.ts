"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export type StudentPaymentStatus = "paid" | "pending" | "overdue";

export interface StudentTableItem {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone: string;
  courses: string[];
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  paymentStatus: StudentPaymentStatus;
  enrollmentDate: string;
  address?: string;
  birthDate?: string;
  financialHistory?: {
    id?: string;
    date: string;
    description: string;
    amount: number;
    status: StudentPaymentStatus;
  }[];
}

interface AlunosResponse {
  data: Array<{
    id: string;
    nome: string;
    cpf: string | null;
    email: string | null;
    telefone: string | null;
    dataNascimento: string | null;
    responsavelNome: string | null;
    responsavelTelefone: string | null;
    responsavelEmail: string | null;
    endereco: string | null;
    cursos: string[];
    matriculas: Array<{
      id: string;
      status: string;
      dataMatricula: string;
      turma: {
        id: string;
        nome: string;
        curso: {
          id: string;
          nome: string;
          categoria: string;
        };
      };
    }>;
    pagamentos: Array<{
      id: string;
      descricao: string;
      valor: number;
      status: string;
      vencimento: string;
      dataPagamento: string | null;
      competenciaMes: number;
      competenciaAno: number;
    }>;
  }>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

function mapPaymentStatus(statuses: string[]): StudentPaymentStatus {
  if (statuses.length === 0) return "pending";
  if (statuses.includes("ATRASADO")) return "overdue";
  if (statuses.includes("PENDENTE")) return "pending";
  return "paid";
}

function normalizeStudents(
  apiData: AlunosResponse["data"]
): StudentTableItem[] {
  return apiData.map((aluno) => {
    const paymentStatus = mapPaymentStatus(
      aluno.pagamentos.map((p) => p.status)
    );

    return {
      id: aluno.id,
      name: aluno.nome,
      cpf: aluno.cpf ?? undefined,
      email: aluno.email ?? "-",
      phone: aluno.telefone ?? "-",
      courses: aluno.cursos,
      guardianName: aluno.responsavelNome ?? undefined,
      guardianPhone: aluno.responsavelTelefone ?? undefined,
      guardianEmail: aluno.responsavelEmail ?? undefined,
      paymentStatus,
      enrollmentDate: aluno.matriculas[0]?.dataMatricula
        ? formatDate(aluno.matriculas[0].dataMatricula)
        : "-",
      address: aluno.endereco ?? undefined,
      birthDate: aluno.dataNascimento
        ? formatDate(aluno.dataNascimento)
        : undefined,
      financialHistory: aluno.pagamentos.map((pagamento) => ({
        id: pagamento.id,
        date: pagamento.dataPagamento
          ? formatDate(pagamento.dataPagamento)
          : formatDate(pagamento.vencimento),
        description: `Mensalidade ${new Date(
          pagamento.competenciaAno,
          pagamento.competenciaMes - 1
        )
          .toLocaleString("pt-BR", { month: "long" })
          .replace(/^./, (c) => c.toUpperCase())}`,
        amount: pagamento.valor,
        status:
          pagamento.status === "ATRASADO"
            ? "overdue"
            : pagamento.status === "PENDENTE"
            ? "pending"
            : "paid",
      })),
    };
  });
}

export function useStudentsQuery() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const selectedId = searchParams.get("id") || "";
  const matriculaStatus = searchParams.get("matriculaStatus") || "";
  const recent = searchParams.get("recent") || "";

  const [students, setStudents] = useState<StudentTableItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<AlunosResponse["meta"]>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  const statusQuery = useMemo(() => {
    if (statusFilter === "all") return "";
    return statusFilter;
  }, [statusFilter]);

  async function fetchStudents() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "10");

      if (selectedId) params.set("id", selectedId);
      if (search.trim()) params.set("search", search.trim());
      if (statusQuery) params.set("status", statusQuery);
      if (courseId) params.set("courseId", courseId);
      if (matriculaStatus) params.set("matriculaStatus", matriculaStatus);
      if (recent) params.set("recent", recent);

      const response = await fetch(`/api/alunos?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar alunos");
      }

      const result: AlunosResponse = await response.json();
      setStudents(normalizeStudents(result.data));
      setMeta(result.meta);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os alunos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStudents();
    }, 350);

    return () => clearTimeout(timeout);
  }, [
    page,
    search,
    statusQuery,
    courseId,
    selectedId,
    matriculaStatus,
    recent,
  ]);

  return {
    students,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    setError,
    page,
    setPage,
    meta,
    fetchStudents,
  };
}
