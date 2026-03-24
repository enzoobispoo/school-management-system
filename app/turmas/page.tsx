"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Calendar, Search, UserCircle } from "lucide-react";

interface TurmasResponse {
  data: Array<{
    id: string;
    nome: string;
    capacidadeMaxima: number;
    ativo: boolean;
    createdAt: string;
    updatedAt: string;
    vagasOcupadas: number;
    vagasDisponiveis: number;
    curso: {
      id: string;
      nome: string;
      categoria: string;
      valorMensal: number;
      duracaoTexto?: string | null;
    };
    professor: {
      id: string;
      nome: string;
      email: string | null;
      telefone: string | null;
    };
    horarios: Array<{
      id: string;
      diaSemana: string;
      horaInicio: string;
      horaFim: string;
    }>;
    matriculas: Array<{
      id: string;
      status: string;
      dataMatricula: string;
      aluno: {
        id: string;
        nome: string;
        email: string | null;
        telefone: string | null;
        status: string;
      };
    }>;
  }>;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface TurmaCardItem {
  id: string;
  name: string;
  active: boolean;
  capacity: number;
  occupied: number;
  available: number;
  courseName: string;
  courseCategory: string;
  teacherId: string;
  teacherName: string;
  scheduleText: string;
  students: Array<{
    id: string;
    nome: string;
  }>;
}

const dayMap: Record<string, string> = {
  SEGUNDA: "Seg",
  TERCA: "Ter",
  QUARTA: "Qua",
  QUINTA: "Qui",
  SEXTA: "Sex",
  SABADO: "Sáb",
  DOMINGO: "Dom",
};

function formatSchedule(
  horarios: Array<{
    diaSemana: string;
    horaInicio: string;
    horaFim: string;
  }>
) {
  if (!horarios.length) return "Sem horário";

  return horarios
    .map((horario) => {
      const dia = dayMap[horario.diaSemana] ?? horario.diaSemana;
      return `${dia} ${horario.horaInicio}-${horario.horaFim}`;
    })
    .join(" • ");
}

function normalizeTurmas(apiData: TurmasResponse["data"]): TurmaCardItem[] {
  return apiData.map((turma) => ({
    id: turma.id,
    name: turma.nome,
    active: turma.ativo,
    capacity: turma.capacidadeMaxima,
    occupied: turma.vagasOcupadas,
    available: turma.vagasDisponiveis,
    courseName: turma.curso.nome,
    courseCategory: turma.curso.categoria,
    teacherId: turma.professor.id,
    teacherName: turma.professor.nome,
    scheduleText: formatSchedule(turma.horarios),
    students: turma.matriculas.map((matricula) => ({
      id: matricula.aluno.id,
      nome: matricula.aluno.nome,
    })),
  }));
}

export default function TurmasPage() {
  const searchParams = useSearchParams();
  const professorId = searchParams.get("professorId") || "";

  const [turmas, setTurmas] = useState<TurmaCardItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<TurmasResponse["meta"]>({
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  });

  const ativoQuery = useMemo(() => {
    if (statusFilter === "all") return "";
    if (statusFilter === "active") return "true";
    if (statusFilter === "inactive") return "false";
    return "";
  }, [statusFilter]);

  async function fetchTurmas() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "12");

      if (search.trim()) params.set("search", search.trim());
      if (professorId) params.set("professorId", professorId);
      if (ativoQuery) params.set("ativo", ativoQuery);

      const response = await fetch(`/api/turmas?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar turmas");
      }

      const result: TurmasResponse = await response.json();
      setTurmas(normalizeTurmas(result.data));
      setMeta(result.meta);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as turmas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTurmas();
    }, 300);

    return () => clearTimeout(timeout);
  }, [page, search, ativoQuery, professorId]);

  return (
    <DashboardLayout>
      <Header
        title="Turmas"
        description={
          professorId
            ? "Turmas vinculadas ao professor selecionado"
            : "Gerencie as turmas da escola"
        }
      />

{professorId && (
        <div className="px-6 pt-4">
          <Link
            href="/professores"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para professores
          </Link>
        </div>
      )}

      <div className="p-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar turma, curso ou professor..."
                className="bg-background pl-9"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setPage(1);
                setStatusFilter(value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-3xl border border-border/60 bg-card p-10 text-sm text-muted-foreground">
            Carregando turmas...
          </div>
        ) : turmas.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card p-10 text-sm text-muted-foreground">
            Nenhuma turma encontrada.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {turmas.map((turma) => (
              <div
                key={turma.id}
                className="group rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-foreground">
                        {turma.name}
                      </h3>

                      <span
                        className={
                          turma.active
                            ? "rounded-full border border-border/60 px-2.5 py-1 text-xs text-foreground"
                            : "rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-xs text-destructive"
                        }
                      >
                        {turma.active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <p className="truncate text-sm text-muted-foreground">
                      {turma.courseName}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {turma.courseCategory}
                  </span>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-muted/30 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Alunos
                    </p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {turma.occupied}/{turma.capacity}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-muted/30 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Vagas
                    </p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {turma.available}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/50 pt-5">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/40">
                      <UserCircle className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Professor</p>
                      <p className="truncate text-sm font-medium text-foreground">
                        {turma.teacherName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/40">
                      <Calendar className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Horários</p>
                      <p className="leading-5 text-sm text-foreground">
                        {turma.scheduleText}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-border/50 pt-5">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Alunos matriculados
                  </p>

                  {turma.students.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {turma.students.slice(0, 3).map((student) => (
                        <span
                          key={student.id}
                          className="rounded-full bg-muted/40 px-3 py-1.5 text-xs text-foreground"
                        >
                          {student.nome}
                        </span>
                      ))}

                      {turma.students.length > 3 && (
                        <span className="rounded-full bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
                          +{turma.students.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum aluno matriculado.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {turmas.length} de {meta.total} turmas
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}