import { DocenteJogoHostPage } from "@/components/docente/docente-jogo-host-page";

interface PageProps {
  params: Promise<{ avaliacaoId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { avaliacaoId } = await params;
  return <DocenteJogoHostPage avaliacaoId={avaliacaoId} />;
}
