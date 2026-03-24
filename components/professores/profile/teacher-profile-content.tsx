"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const dayMap: Record<string, string> = {
  SEGUNDA: "Segunda-feira",
  TERCA: "Terça-feira",
  QUARTA: "Quarta-feira",
  QUINTA: "Quinta-feira",
  SEXTA: "Sexta-feira",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface TeacherProfileContentProps {
  professor: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    ativo: boolean;
    totalTurmas: number;
    totalAlunos: number;
    cursos: Array<{
      id: string;
      nome: string;
    }>;
    agenda: Array<{
      diaSemana: string;
      horaInicio: string;
      horaFim: string;
      cursoNome: string;
      turmaNome: string;
    }>;
    turmas: Array<{
      id: string;
      nome: string;
      ativo: boolean;
      curso: {
        nome: string;
      };
      matriculas: Array<{
        id: string;
      }>;
    }>;
  };
}

export function TeacherProfileContent({
  professor,
}: TeacherProfileContentProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/professores"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para professores
        </Link>
      </div>

      <div className="space-y-6">
        <div className="rounded-[28px] border border-black/[0.04] bg-[#fafafa] px-6 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.04] text-lg font-semibold text-black">
              {getInitials(professor.nome)}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-[30px] font-semibold tracking-[-0.04em] text-black">
                {professor.nome}
              </h2>
              <p className="mt-1 text-sm text-black/55">
                {professor.email || "Sem e-mail"} •{" "}
                {professor.telefone || "Sem telefone"}
              </p>
            </div>

            <Badge
              variant={professor.ativo ? "default" : "destructive"}
              className="rounded-full"
            >
              {professor.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[24px] border-border/50 shadow-sm">
            <CardHeader className="pb-2 text-sm text-muted-foreground">
              Total de Turmas
            </CardHeader>
            <CardContent className="text-[28px] font-semibold tracking-[-0.04em]">
              {professor.totalTurmas}
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-border/50 shadow-sm">
            <CardHeader className="pb-2 text-sm text-muted-foreground">
              Total de Alunos
            </CardHeader>
            <CardContent className="text-[28px] font-semibold tracking-[-0.04em]">
              {professor.totalAlunos}
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-border/50 shadow-sm">
            <CardHeader className="pb-2 text-sm text-muted-foreground">
              Cursos
            </CardHeader>
            <CardContent className="text-[28px] font-semibold tracking-[-0.04em]">
              {professor.cursos.length}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="text-base font-semibold">Cursos</CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {professor.cursos.length > 0 ? (
              professor.cursos.map((curso) => (
                <Badge
                  key={curso.id}
                  variant="secondary"
                  className="rounded-full"
                >
                  {curso.nome}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum curso vinculado.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="text-base font-semibold">Agenda</CardHeader>
          <CardContent className="space-y-2">
            {professor.agenda.length > 0 ? (
              professor.agenda.map((item) => (
                <div
                  key={`${item.diaSemana}-${item.horaInicio}-${item.horaFim}-${item.cursoNome}-${item.turmaNome}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3"
                >
                  <div>
                    <p className="font-medium">
                      {dayMap[item.diaSemana] || item.diaSemana}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.horaInicio} - {item.horaFim}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">{item.cursoNome}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.turmaNome}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum horário cadastrado.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="text-base font-semibold">Turmas</CardHeader>
          <CardContent className="space-y-3">
            {professor.turmas.length > 0 ? (
              professor.turmas.map((turma) => (
                <div
                  key={turma.id}
                  className="rounded-xl border border-border/50 bg-muted/20 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {turma.nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {turma.curso.nome}
                      </p>
                    </div>

                    <Badge
                      variant={turma.ativo ? "secondary" : "outline"}
                      className="rounded-full"
                    >
                      {turma.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {turma.matriculas.length} aluno(s)
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma turma vinculada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
