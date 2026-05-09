import { DocenteSlideEditor } from "@/components/docente/docente-slide-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocenteApresentacaoEditorPage({
  params,
}: PageProps) {
  const { id } = await params;
  return <DocenteSlideEditor materialId={id} />;
}
