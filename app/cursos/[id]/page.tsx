import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ResourcePageHeader } from "@/components/dashboard/resource-page-header";
import {
  CursoProfileContent,
  type CursoProfileData,
} from "@/components/cursos/curso-profile-content";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const c = await prisma.curso.findUnique({
    where: { id },
    select: { nome: true },
  });
  return { title: c ? c.nome : "Curso" };
}

export default async function CursoProfilePage({ params }: PageProps) {
  const { id } = await params;

  const curso = await prisma.curso.findUnique({
    where: { id },
    include: {
      turmas: {
        include: {
          professor: true,
          horarios: {
            orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
          },
          matriculas: {
            where: { status: "ATIVA" },
            select: { id: true },
          },
        },
        orderBy: { nome: "asc" },
      },
    },
  });

  if (!curso) notFound();

  const totalAlunos = curso.turmas.reduce(
    (acc, t) => acc + t.matriculas.length,
    0
  );

  const data: CursoProfileData = {
    id: curso.id,
    nome: curso.nome,
    categoria: curso.categoria,
    descricao: curso.descricao,
    duracaoTexto: curso.duracaoTexto,
    valorMensal: Number(curso.valorMensal),
    ativo: curso.ativo,
    totalTurmas: curso.turmas.length,
    totalAlunos,
    turmas: curso.turmas.map((t) => ({
      id: t.id,
      nome: t.nome,
      capacidadeMaxima: t.capacidadeMaxima,
      ativo: t.ativo,
      professorNome: t.professor.nome,
      scheduleText: formatSchedule(t.horarios),
      alunosAtivos: t.matriculas.length,
    })),
  };

  return (
    <DashboardLayout>
      <ResourcePageHeader title={curso.nome} variant="course" />
      <CursoProfileContent curso={data} />
    </DashboardLayout>
  );
}

function formatSchedule(
  horarios: Array<{ diaSemana: string; horaInicio: string; horaFim: string }>
) {
  const dayMap: Record<string, string> = {
    SEGUNDA: "Seg",
    TERCA: "Ter",
    QUARTA: "Qua",
    QUINTA: "Qui",
    SEXTA: "Sex",
    SABADO: "Sáb",
    DOMINGO: "Dom",
  };
  if (!horarios?.length) return "Sem horário";
  return horarios
    .map((h) => {
      const dia = dayMap[h.diaSemana] ?? h.diaSemana;
      return `${dia} ${h.horaInicio}-${h.horaFim}`;
    })
    .join(" • ");
}
