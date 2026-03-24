"use client";

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
  if (!horarios?.length) return "Sem horário";

  const ordered = [...horarios].sort((a, b) => {
    if (a.diaSemana === b.diaSemana) {
      return a.horaInicio.localeCompare(b.horaInicio);
    }
    return a.diaSemana.localeCompare(b.diaSemana);
  });

  return ordered
    .map(
      (h) =>
        `${dayMap[h.diaSemana] ?? h.diaSemana} ${h.horaInicio}-${h.horaFim}`
    )
    .join(" • ");
}

interface EnrollmentDetailsCardProps {
  turma: {
    nome: string;
    capacidadeMaxima: number;
    vagasDisponiveis: number;
    curso: {
      nome: string;
      categoria: string;
      valorMensal: number;
    };
    professor: {
      nome: string;
    };
    horarios: Array<{
      diaSemana: string;
      horaInicio: string;
      horaFim: string;
    }>;
  };
}

export function EnrollmentDetailsCard({
  turma,
}: EnrollmentDetailsCardProps) {
  return (
    <div className="rounded-[22px] border border-border/50 bg-muted/30 p-4">
      <div className="grid gap-3 text-sm">
        <div>
          <span className="font-medium text-foreground">Curso:</span>{" "}
          <span className="text-muted-foreground">{turma.curso.nome}</span>
        </div>

        <div>
          <span className="font-medium text-foreground">Categoria:</span>{" "}
          <span className="text-muted-foreground">{turma.curso.categoria}</span>
        </div>

        <div>
          <span className="font-medium text-foreground">Professor:</span>{" "}
          <span className="text-muted-foreground">{turma.professor.nome}</span>
        </div>

        <div>
          <span className="font-medium text-foreground">Horários:</span>{" "}
          <span className="text-muted-foreground">
            {formatSchedule(turma.horarios)}
          </span>
        </div>

        <div>
          <span className="font-medium text-foreground">Vagas:</span>{" "}
          <span className="text-muted-foreground">
            {turma.vagasDisponiveis} disponíveis de {turma.capacidadeMaxima}
          </span>
        </div>

        <div>
          <span className="font-medium text-foreground">Mensalidade:</span>{" "}
          <span className="text-muted-foreground">
            R$ {turma.curso.valorMensal.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>
    </div>
  );
}