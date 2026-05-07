import type { DiaSemana } from "@prisma/client";

export type TurmaHorarioLike = {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
};

export type OutraTurmaConflito = {
  id: string;
  nome: string;
  curso: { nome: string };
  horarios: TurmaHorarioLike[];
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
}

/** Retorna mensagem de erro se houver choque de horário com outras turmas do professor. */
export function mensagemConflitoHorarioProfessor(
  horariosTitularidade: TurmaHorarioLike[],
  turmasDoNovoProfessor: OutraTurmaConflito[]
): string | null {
  for (const outraTurma of turmasDoNovoProfessor) {
    for (const horarioAtual of horariosTitularidade) {
      for (const horarioOutraTurma of outraTurma.horarios) {
        const sameDay = horarioAtual.diaSemana === horarioOutraTurma.diaSemana;
        const overlap = hasTimeOverlap(
          horarioAtual.horaInicio,
          horarioAtual.horaFim,
          horarioOutraTurma.horaInicio,
          horarioOutraTurma.horaFim
        );
        if (sameDay && overlap) {
          return `Conflito de horário: o professor já está vinculado à turma "${outraTurma.nome}" (${outraTurma.curso.nome}) em ${horarioOutraTurma.diaSemana}, ${horarioOutraTurma.horaInicio}-${horarioOutraTurma.horaFim}.`;
        }
      }
    }
  }
  return null;
}
