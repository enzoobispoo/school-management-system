"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Users, UserCircle, BookOpen, TrendingUp, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MatricularAlunoModal } from "@/components/turmas/matricular-aluno-modal";

const dayMap: Record<string, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const statusMatriculaLabel: Record<string, string> = {
  ATIVA: "Ativa",
  TRANCADA: "Trancada",
  CANCELADA: "Cancelada",
  CONCLUIDA: "Concluída",
};

const statusMatriculaVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ATIVA: "default",
  TRANCADA: "secondary",
  CANCELADA: "destructive",
  CONCLUIDA: "outline",
};

const statusPagamentoLabel: Record<string, string> = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
  ATRASADO: "Atrasado",
  CANCELADO: "Cancelado",
};

interface TurmaProfileContentProps {
  turma: {
    id: string;
    nome: string;
    capacidadeMaxima: number;
    ativo: boolean;
    createdAt: string;
    curso: { id: string; nome: string; categoria: string; valorMensal: number; duracaoTexto?: string | null };
    professor: { id: string; nome: string; email: string | null; telefone: string | null; ativo: boolean };
    horarios: Array<{ id: string; diaSemana: string; horaInicio: string; horaFim: string }>;
    matriculas: Array<{
      id: string;
      status: string;
      dataMatricula: string;
      aluno: { id: string; nome: string; email: string | null; telefone: string | null; status: string };
      pagamentos: Array<{ id: string; descricao: string; valor: number; status: string; vencimento: string }>;
    }>;
    historicoProfessores: Array<{
      id: string;
      dataInicio: string;
      dataFim: string | null;
      motivoTroca: string | null;
      professor: { id: string; nome: string };
    }>;
  };
}

export function TurmaProfileContent({ turma }: TurmaProfileContentProps) {
  const router = useRouter();
  const [matricularOpen, setMatricularOpen] = useState(false);
  const ativas = turma.matriculas.filter((m) => m.status === "ATIVA");
  const ocupacao = Math.round((ativas.length / turma.capacidadeMaxima) * 100);

  // status financeiro dos alunos ativos
  const inadimplentes = ativas.filter((m) =>
    m.pagamentos.some((p) => p.status === "ATRASADO")
  ).length;
  const emDia = ativas.length - inadimplentes;

  return (
    <div className="p-6 space-y-6">
      <Link
        href="/turmas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para turmas
      </Link>

      {/* Header */}
      <div className="rounded-[28px] border border-border bg-card px-6 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-[28px] font-semibold tracking-[-0.04em] text-foreground">{turma.nome}</h2>
              <Badge variant={turma.ativo ? "default" : "destructive"} className="rounded-full">
                {turma.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {turma.curso.nome} · {turma.curso.categoria}
              {turma.curso.duracaoTexto ? ` · ${turma.curso.duracaoTexto}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Valor mensal</p>
            <p className="text-lg font-semibold text-foreground">
              R$ {Number(turma.curso.valorMensal).toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Alunos ativos", value: ativas.length },
          { label: "Capacidade", value: turma.capacidadeMaxima },
          { label: "Vagas livres", value: Math.max(turma.capacidadeMaxima - ativas.length, 0) },
          { label: "Em dia", value: emDia, sub: inadimplentes > 0 ? `${inadimplentes} atrasado(s)` : undefined },
        ].map((s) => (
          <Card key={s.label} className="rounded-[24px] border-border/50 shadow-sm">
            <CardHeader className="pb-2 text-sm text-muted-foreground">{s.label}</CardHeader>
            <CardContent>
              <p className="text-[28px] font-semibold tracking-[-0.04em]">{s.value}</p>
              {s.sub && <p className="text-xs text-red-500 mt-0.5">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barra de ocupação */}
      <div className="rounded-[20px] border border-border/50 bg-card px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Ocupação da turma</span>
          <span className="text-sm font-semibold text-foreground">{ocupacao}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              ocupacao >= 90 ? "bg-red-500" : ocupacao >= 70 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(ocupacao, 100)}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {ativas.length} de {turma.capacidadeMaxima} vagas preenchidas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Professor */}
        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 text-base font-semibold">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            Professor
          </CardHeader>
          <CardContent>
            <Link
              href={`/professores/${turma.professor.id}`}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">{turma.professor.nome}</p>
                <p className="text-sm text-muted-foreground">{turma.professor.email || "Sem e-mail"}</p>
              </div>
              <Badge variant={turma.professor.ativo ? "secondary" : "outline"} className="rounded-full">
                {turma.professor.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </Link>
          </CardContent>
        </Card>

        {/* Horários */}
        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 text-base font-semibold">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Horários
          </CardHeader>
          <CardContent className="space-y-2">
            {turma.horarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum horário cadastrado.</p>
            ) : (
              turma.horarios.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3">
                  <p className="font-medium text-sm">{dayMap[h.diaSemana] ?? h.diaSemana}</p>
                  <p className="text-sm text-muted-foreground">{h.horaInicio} – {h.horaFim}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alunos matriculados */}
      <Card className="rounded-[24px] border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4 text-muted-foreground" />
            Alunos matriculados ({turma.matriculas.length})
          </div>
          <div className="flex items-center gap-2">
            {turma.ativo && ativas.length < turma.capacidadeMaxima && (
              <Button
                size="sm"
                className="rounded-2xl gap-1.5"
                onClick={() => setMatricularOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Matricular aluno
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl gap-1.5"
              onClick={() => router.push(`/alunos?turmaId=${turma.id}`)}
            >
              Ver todos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {turma.matriculas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno matriculado.</p>
          ) : (
            turma.matriculas.map((m) => {
              const ultimoPag = m.pagamentos[0];
              const statusColor = ultimoPag?.status === "ATRASADO"
                ? "text-red-500"
                : ultimoPag?.status === "PAGO"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400";
              return (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div>
                    <Link href={`/alunos/${m.aluno.id}`} className="font-medium text-foreground hover:underline">
                      {m.aluno.nome}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Desde {new Date(m.dataMatricula).toLocaleDateString("pt-BR")}
                      {m.aluno.email ? ` · ${m.aluno.email}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ultimoPag && (
                      <span className={`text-xs font-medium ${statusColor}`}>
                        {statusPagamentoLabel[ultimoPag.status] ?? ultimoPag.status}
                      </span>
                    )}
                    <Badge variant={statusMatriculaVariant[m.status] ?? "outline"} className="rounded-full">
                      {statusMatriculaLabel[m.status] ?? m.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <MatricularAlunoModal
        open={matricularOpen}
        onOpenChange={setMatricularOpen}
        turmaId={turma.id}
        turmaNome={turma.nome}
        onSuccess={() => router.refresh()}
      />

      {/* Histórico de professores */}
      {turma.historicoProfessores.length > 0 && (
        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 text-base font-semibold">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Histórico de professores
          </CardHeader>
          <CardContent className="space-y-2">
            {turma.historicoProfessores.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3">
                <div>
                  <p className="font-medium text-sm text-foreground">{h.professor.nome}</p>
                  {h.motivoTroca && <p className="text-xs text-muted-foreground">{h.motivoTroca}</p>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(h.dataInicio).toLocaleDateString("pt-BR")}
                  {h.dataFim ? ` → ${new Date(h.dataFim).toLocaleDateString("pt-BR")}` : " → atual"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
