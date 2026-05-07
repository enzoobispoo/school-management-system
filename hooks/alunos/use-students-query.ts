"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  guardianCpf?: string;
  paymentStatus: StudentPaymentStatus;
  enrollmentDate: string;
  address?: string;
  birthDate?: string;
  fotoUrl?: string;
  alunoStatus?: string;
  motivoSaida?: string;
  dataSaida?: string;
  observacoesGerais?: string;
  indicacao?: string;
  nivelInicial?: string;
  idiomaNativo?: string;
  health?: {
    possuiLaudo: boolean;
    laudoTipo?: string;
    laudoCid?: string;
    laudoNivel?: string;
    laudoProfissional?: string;
    laudoData?: string;
    laudoDataRaw?: string;
    laudoDescricao?: string;
    adaptacaoNecessaria: boolean;
    adaptacaoDescricao?: string;
    alergias?: string;
    medicamentos?: string;
    condicoesCronicas?: string;
    planoSaude?: string;
    contatoEmergenciaNome?: string;
    contatoEmergenciaTelefone?: string;
    observacoesMedicas?: string;
    observacoesProf?: string;
    tratamentos?: string;
  };
  financialHistory?: {
    id?: string;
    date: string;
    description: string;
    amount: number;
    status: StudentPaymentStatus;
  }[];
  situacaoResumo?: {
    mediaGeral?: number | null;
    frequenciaGeral?: number | null;
    faltas: number;
    totalNotas: number;
    advertencias: number;
    possuiObservacoes: boolean;
    risco: "ok" | "atencao";
  };
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
    responsavelCpf: string | null;
    endereco: string | null;
    cursos: string[];
    status: string;
    fotoUrl: string | null;
    observacoesGerais: string | null;
    indicacao: string | null;
    nivelInicial: string | null;
    idiomaNativo: string | null;
    motivoSaida: string | null;
    dataSaida: string | null;
    possuiLaudo: boolean;
    laudoTipo: string | null;
    laudoCid: string | null;
    laudoNivel: string | null;
    laudoProfissional: string | null;
    laudoData: string | null;
    laudoDescricao: string | null;
    adaptacaoNecessaria: boolean;
    adaptacaoDescricao: string | null;
    alergias: string | null;
    medicamentos: string | null;
    condicoesCronicas: string | null;
    planoSaude: string | null;
    contatoEmergenciaNome: string | null;
    contatoEmergenciaTelefone: string | null;
    observacoesMedicas: string | null;
    observacoesProf: string | null;
    tratamentos: string | null;
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
    situacaoResumo?: {
      mediaGeral?: number | null;
      frequenciaGeral?: number | null;
      faltas: number;
      totalNotas: number;
      advertencias: number;
      possuiObservacoes: boolean;
      risco: "ok" | "atencao";
    };
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
      guardianCpf: aluno.responsavelCpf ?? undefined,
      paymentStatus,
      enrollmentDate: aluno.matriculas[0]?.dataMatricula
        ? formatDate(aluno.matriculas[0].dataMatricula)
        : "-",
      address: aluno.endereco ?? undefined,
      birthDate: aluno.dataNascimento ? formatDate(aluno.dataNascimento) : undefined,
      fotoUrl: aluno.fotoUrl ?? undefined,
      alunoStatus: aluno.status ?? undefined,
      observacoesGerais: aluno.observacoesGerais ?? undefined,
      indicacao: aluno.indicacao ?? undefined,
      nivelInicial: aluno.nivelInicial ?? undefined,
      idiomaNativo: aluno.idiomaNativo ?? undefined,
      motivoSaida: aluno.motivoSaida ?? undefined,
      dataSaida: aluno.dataSaida ? new Date(aluno.dataSaida).toLocaleDateString("pt-BR") : undefined,
      health: {
        possuiLaudo: aluno.possuiLaudo,
        laudoTipo: aluno.laudoTipo ?? undefined,
        laudoCid: aluno.laudoCid ?? undefined,
        laudoNivel: aluno.laudoNivel ?? undefined,
        laudoProfissional: aluno.laudoProfissional ?? undefined,
        laudoData: aluno.laudoData ? formatDate(aluno.laudoData) : undefined,
        laudoDataRaw: aluno.laudoData ? new Date(aluno.laudoData).toISOString().slice(0, 10) : undefined,
        laudoDescricao: aluno.laudoDescricao ?? undefined,
        adaptacaoNecessaria: aluno.adaptacaoNecessaria,
        adaptacaoDescricao: aluno.adaptacaoDescricao ?? undefined,
        alergias: aluno.alergias ?? undefined,
        medicamentos: aluno.medicamentos ?? undefined,
        condicoesCronicas: aluno.condicoesCronicas ?? undefined,
        planoSaude: aluno.planoSaude ?? undefined,
        contatoEmergenciaNome: aluno.contatoEmergenciaNome ?? undefined,
        contatoEmergenciaTelefone: aluno.contatoEmergenciaTelefone ?? undefined,
        observacoesMedicas: aluno.observacoesMedicas ?? undefined,
        observacoesProf: aluno.observacoesProf ?? undefined,
        tratamentos: aluno.tratamentos ?? undefined,
      },
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
      situacaoResumo: aluno.situacaoResumo
        ? {
            ...aluno.situacaoResumo,
            mediaGeral:
              aluno.situacaoResumo.mediaGeral !== null &&
              aluno.situacaoResumo.mediaGeral !== undefined
                ? Number(aluno.situacaoResumo.mediaGeral)
                : null,
            frequenciaGeral:
              aluno.situacaoResumo.frequenciaGeral !== null &&
              aluno.situacaoResumo.frequenciaGeral !== undefined
                ? Number(aluno.situacaoResumo.frequenciaGeral)
                : null,
          }
        : undefined,
    };
  });
}

export function useStudentsQuery() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "";
  const turmaId = searchParams.get("turmaId") || "";
  const selectedId = searchParams.get("id") || "";
  const matriculaStatus = searchParams.get("matriculaStatus") || "";
  const recent = searchParams.get("recent") || "";
  const statusFromUrl = searchParams.get("status") || "";

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

  useEffect(() => {
    if (
      statusFromUrl === "paid" ||
      statusFromUrl === "pending" ||
      statusFromUrl === "overdue"
    ) {
      setStatusFilter(statusFromUrl);
    }
  }, [statusFromUrl]);

  const fetchStudents = useCallback(async () => {
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
      if (turmaId) params.set("turmaId", turmaId);
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
  }, [page, search, statusQuery, courseId, turmaId, selectedId, matriculaStatus, recent]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchStudents();
    }, 350);
    return () => clearTimeout(timeout);
  }, [fetchStudents]);

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
