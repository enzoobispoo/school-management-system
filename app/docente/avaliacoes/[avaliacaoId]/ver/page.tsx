import { DocenteVisualizarAvaliacaoPage } from "@/components/docente/docente-visualizar-avaliacao-page";

interface PageProps {
  params: Promise<{ avaliacaoId: string }>;
}

export default async function DocenteVerAvaliacaoRoutePage({ params }: PageProps) {
  const { avaliacaoId } = await params;
  return <DocenteVisualizarAvaliacaoPage avaliacaoId={avaliacaoId} />;
}
