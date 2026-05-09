import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ResourcePageHeader } from "@/components/dashboard/resource-page-header";
import { TeacherProfileContent } from "@/components/professores/profile/teacher-profile-content";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const p = await prisma.professor.findUnique({ where: { id }, select: { nome: true } });
  return { title: p ? p.nome : "Professor" };
}

export default async function ProfessorPage({ params }: PageProps) {
  const { id } = await params;

  const professor = await prisma.professor.findUnique({
    where: { id },
    include: {
      turmas: {
        include: {
          curso: true,
          horarios: true,
          matriculas: {
            where: { status: "ATIVA" },
            select: { id: true },
          },
        },
        orderBy: { nome: "asc" },
      },
    },
  });

  if (!professor) notFound();

  const cursosUnicos = Array.from(
    new Map(professor.turmas.map((t) => [t.curso.id, { id: t.curso.id, nome: t.curso.nome }])).values()
  );

  const data = {
    id: professor.id,
    nome: professor.nome,
    email: professor.email,
    telefone: professor.telefone,
    ativo: professor.ativo,
    createdAt: professor.createdAt.toISOString(),
    updatedAt: professor.updatedAt.toISOString(),
    cursos: cursosUnicos,
    totalTurmas: professor.turmas.length,
    totalAlunos: professor.turmas.reduce((acc, t) => acc + t.matriculas.length, 0),
    turmas: professor.turmas.map((t) => ({
      id: t.id,
      nome: t.nome,
      ativo: t.ativo,
      curso: { nome: t.curso.nome },
      matriculas: t.matriculas,
    })),
    agenda: professor.turmas.flatMap((t) =>
      t.horarios.map((h) => ({
        turmaId: t.id,
        turmaNome: t.nome,
        cursoNome: t.curso.nome,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFim: h.horaFim,
      }))
    ),
  };

  return (
    <DashboardLayout>
      <ResourcePageHeader title={professor.nome} variant="teacher" />
      <TeacherProfileContent professor={data} />
    </DashboardLayout>
  );
}
