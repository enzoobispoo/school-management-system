import { DocenteProvaQuadroPage } from "@/components/docente/docente-prova-quadro-page";

interface PageProps {
  params: Promise<{ avaliacaoId: string }>;
}

export default async function DocenteProvaQuadroRoutePage({ params }: PageProps) {
  const { avaliacaoId } = await params;
  return <DocenteProvaQuadroPage avaliacaoId={avaliacaoId} />;
}
