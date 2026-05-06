"use client";

import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseCategoryBadge } from "@/components/cursos/card/course-category-badge";
import { cn } from "@/lib/utils";

export interface CursoProfileTurmaRow {
  id: string;
  nome: string;
  capacidadeMaxima: number;
  ativo: boolean;
  professorNome: string;
  scheduleText: string;
  alunosAtivos: number;
}

export interface CursoProfileData {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  duracaoTexto: string | null;
  valorMensal: number;
  ativo: boolean;
  totalTurmas: number;
  totalAlunos: number;
  turmas: CursoProfileTurmaRow[];
}

export function CursoProfileContent({ curso }: { curso: CursoProfileData }) {
  const money = curso.valorMensal.toFixed(2).replace(".", ",");

  return (
    <div className="space-y-6 px-6 pb-10">
      <Link
        href="/cursos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para cursos
      </Link>

      <Card
        className={cn(
          "rounded-[24px] border-border/50 shadow-sm",
          !curso.ativo && "opacity-90"
        )}
      >
        <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {curso.nome}
              </CardTitle>
              {!curso.ativo ? (
                <Badge variant="destructive" className="rounded-full">
                  Inativo
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full">
                  Ativo
                </Badge>
              )}
            </div>
            <CourseCategoryBadge category={curso.categoria} />
            {curso.descricao ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {curso.descricao}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                {curso.duracaoTexto ?? "Duração não informada"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0" />
                {curso.totalAlunos} aluno{curso.totalAlunos === 1 ? "" : "s"} ·{" "}
                {curso.totalTurmas} turma{curso.totalTurmas === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Mensalidade
            </p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">
              R$ {money}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Turmas deste curso
          </h3>
          {curso.turmas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma turma cadastrada ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {curso.turmas.map((t) => (
                <li
                  key={t.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between",
                    !t.ativo && "opacity-70"
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.scheduleText} · Prof. {t.professorNome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.alunosAtivos}/{t.capacidadeMaxima} vagas ocupadas
                      {!t.ativo ? " · Turma inativa" : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 rounded-full" asChild>
                    <Link href={`/turmas/${t.id}`} className="gap-1.5">
                      Ver turma
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
