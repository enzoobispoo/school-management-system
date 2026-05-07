import { JogoPlayerPage } from "@/components/jogo/jogo-player-page";

interface PageProps {
  params: Promise<{ pin: string }>;
}

export default async function Page({ params }: PageProps) {
  const { pin } = await params;
  return <JogoPlayerPage pin={pin} />;
}
