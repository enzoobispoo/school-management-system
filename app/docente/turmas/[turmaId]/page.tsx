import { DocenteTurmaPageClient } from "@/components/docente/docente-turma-page-client";

interface DocenteTurmaPageProps {
  params: Promise<{ turmaId: string }>;
}

export default async function DocenteTurmaPage({
  params,
}: DocenteTurmaPageProps) {
  const { turmaId } = await params;

  return <DocenteTurmaPageClient turmaId={turmaId} />;
}
