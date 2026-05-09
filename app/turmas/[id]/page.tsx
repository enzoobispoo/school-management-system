import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ResourcePageHeader } from "@/components/dashboard/resource-page-header";
import { TurmaProfileContent } from "@/components/turmas/turma-profile-content";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const t = await prisma.turma.findUnique({ where: { id }, select: { nome: true } });
  return { title: t ? t.nome : "Turma" };
}

export default async function TurmaPage({ params }: PageProps) {
  const { id } = await params;

  const turma = await prisma.turma.findUnique({
    where: { id },
    include: {
      curso: true,
      professor: true,
      horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
      matriculas: {
        include: {
          aluno: true,
          pagamentos: { orderBy: { vencimento: "desc" }, take: 3 },
        },
        orderBy: { createdAt: "desc" },
      },
      historicoProfessores: {
        include: { professor: true },
        orderBy: { dataInicio: "desc" },
        take: 10,
      },
    },
  });

  if (!turma) notFound();

  return (
    <DashboardLayout>
      <ResourcePageHeader
        title={turma.nome}
        variant="class"
        courseName={turma.curso.nome}
      />
      <TurmaProfileContent turma={turma as any} />
    </DashboardLayout>
  );
}
