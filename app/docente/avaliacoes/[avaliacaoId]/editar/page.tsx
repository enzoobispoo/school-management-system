import { DocenteEditarAvaliacaoPage } from "@/components/docente/docente-editar-avaliacao-page";

interface PageProps {
  params: Promise<{ avaliacaoId: string }>;
}

export default async function DocenteEditarAvaliacaoRoutePage({ params }: PageProps) {
  const { avaliacaoId } = await params;
  return <DocenteEditarAvaliacaoPage avaliacaoId={avaliacaoId} />;
}
