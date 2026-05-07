"use client";

import { DocenteTurmaWorkspace } from "@/components/docente/docente-turma-workspace";

interface DocenteTurmaPageClientProps {
  turmaId: string;
}

export function DocenteTurmaPageClient({
  turmaId,
}: DocenteTurmaPageClientProps) {
  return <DocenteTurmaWorkspace turmaId={turmaId} />;
}
