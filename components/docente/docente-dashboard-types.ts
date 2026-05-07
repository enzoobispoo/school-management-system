export type OverviewTurmaLike = {
  id: string;
  nome: string;
  cursoNome: string;
  alunosAtivos: number;
  horarios: {
    diaSemana: string;
    diaLabel: string;
    horaInicio: string;
    horaFim: string;
  }[];
  horariosHoje: { horaInicio: string; horaFim: string }[];
};
