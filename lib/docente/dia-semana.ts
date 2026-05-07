import type { DiaSemana } from "@prisma/client";

const ORDER: DiaSemana[] = [
  "DOMINGO",
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
];

export function jsWeekdayToDiaSemana(d: Date = new Date()): DiaSemana {
  return ORDER[d.getDay()]!;
}

export function labelDiaSemana(dia: DiaSemana): string {
  const map: Record<DiaSemana, string> = {
    DOMINGO: "Domingo",
    SEGUNDA: "Segunda",
    TERCA: "Terça",
    QUARTA: "Quarta",
    QUINTA: "Quinta",
    SEXTA: "Sexta",
    SABADO: "Sábado",
  };
  return map[dia];
}
