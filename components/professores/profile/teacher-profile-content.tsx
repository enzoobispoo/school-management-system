"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeacherModal } from "@/components/professores/teacher-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

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
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
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
    cursos: Array<{ id: string; nome: string }>;
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
      curso: { nome: string };
      matriculas: Array<{ id: string }>;
    }>;
  };
}

export function TeacherProfileContent({ professor }: TeacherProfileContentProps) {
  const router = useRouter();
  const [data, setData] = useState(professor);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  async function handleEdit(payload: { nome: string; email?: string; telefone?: string; ativo?: boolean }) {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/professores/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setData((prev) => ({ ...prev, ...payload }));
        setEditOpen(false);
        router.refresh();
      }
    } finally {
      setEditLoading(false);
    }
  }

  async function handleToggleAtivo() {
    setToggleLoading(true);
    try {
      const res = await fetch(`/api/professores/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !data.ativo }),
      });
      if (res.ok) {
        setData((prev) => ({ ...prev, ativo: !prev.ativo }));
        setToggleOpen(false);
        router.refresh();
      }
    } finally {
      setToggleLoading(false);
    }
  }

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
        {/* Header */}
        <div className="rounded-[28px] border border-border bg-card px-6 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">
              {getInitials(data.nome)}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-[30px] font-semibold tracking-[-0.04em] text-foreground">
                {data.nome}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.email || "Sem e-mail"} · {data.telefone || "Sem telefone"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={data.ativo ? "default" : "destructive"} className="rounded-full">
                {data.ativo ? "Ativo" : "Inativo"}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl"
                onClick={() => setToggleOpen(true)}
              >
                {data.ativo ? "Inativar" : "Ativar"}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[24px] border-border/50 shadow-sm">
            <CardHeader className="pb-2 text-sm text-muted-foreground">Total de Turmas</CardHeader>
            <CardContent className="text-[28px] font-semibold tracking-[-0.04em]">{data.totalTurmas}</CardContent>
          </Card>
          <Card className="rounded-[24px] border-border/50 shadow-sm">
            <CardHeader className="pb-2 text-sm text-muted-foreground">Total de Alunos</CardHeader>
            <CardContent className="text-[28px] font-semibold tracking-[-0.04em]">{data.totalAlunos}</CardContent>
          </Card>
          <Card className="rounded-[24px] border-border/50 shadow-sm">
            <CardHeader className="pb-2 text-sm text-muted-foreground">Cursos</CardHeader>
            <CardContent className="text-[28px] font-semibold tracking-[-0.04em]">{data.cursos.length}</CardContent>
          </Card>
        </div>

        {/* Cursos */}
        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="text-base font-semibold">Cursos</CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.cursos.length > 0 ? (
              data.cursos.map((curso) => (
                <Badge key={curso.id} variant="secondary" className="rounded-full">{curso.nome}</Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum curso vinculado.</p>
            )}
          </CardContent>
        </Card>

        {/* Agenda */}
        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="text-base font-semibold">Agenda</CardHeader>
          <CardContent className="space-y-2">
            {data.agenda.length > 0 ? (
              data.agenda.map((item) => (
                <div
                  key={`${item.diaSemana}-${item.horaInicio}-${item.turmaNome}`}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3"
                >
                  <div>
                    <p className="font-medium">{dayMap[item.diaSemana] || item.diaSemana}</p>
                    <p className="text-sm text-muted-foreground">{item.horaInicio} - {item.horaFim}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.cursoNome}</p>
                    <p className="text-sm text-muted-foreground">{item.turmaNome}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum horário cadastrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Turmas */}
        <Card className="rounded-[24px] border-border/50 shadow-sm">
          <CardHeader className="text-base font-semibold">Turmas</CardHeader>
          <CardContent className="space-y-3">
            {data.turmas.length > 0 ? (
              data.turmas.map((turma) => (
                <div key={turma.id} className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <Link href={`/turmas/${turma.id}`} className="font-medium text-foreground hover:underline">
                        {turma.nome}
                      </Link>
                      <p className="text-sm text-muted-foreground">{turma.curso.nome}</p>
                    </div>
                    <Badge variant={turma.ativo ? "secondary" : "outline"} className="rounded-full">
                      {turma.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{turma.matriculas.length} aluno(s)</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma turma vinculada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal editar */}
      <TeacherModal
        open={editOpen}
        onOpenChange={setEditOpen}
        hideTrigger
        mode="edit"
        initialData={{ nome: data.nome, email: data.email ?? "", telefone: data.telefone ?? "", ativo: data.ativo }}
        onSubmit={handleEdit}
        loading={editLoading}
      />

      {/* Confirm toggle */}
      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={data.ativo ? "Inativar professor?" : "Ativar professor?"}
        description={
          data.ativo
            ? "O professor ficará inativo e não poderá ser vinculado a novas turmas."
            : "O professor voltará a ficar ativo."
        }
        confirmLabel={data.ativo ? "Inativar" : "Ativar"}
        variant={data.ativo ? "destructive" : "default"}
        loading={toggleLoading}
        onConfirm={handleToggleAtivo}
      />
    </div>
  );
}
