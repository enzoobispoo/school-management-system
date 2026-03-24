import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { TeacherProfileContent } from "@/components/professores/profile/teacher-profile-content";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProfessorPage({ params }: PageProps) {
  const { id } = await params;

  const res = await fetch(`http://localhost:3000/api/professores/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return notFound();

  const professor = await res.json();

  return (
    <DashboardLayout>
      <Header title={professor.nome} description="Detalhes do professor" />
      <TeacherProfileContent professor={professor} />
    </DashboardLayout>
  );
}