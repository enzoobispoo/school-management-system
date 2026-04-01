import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getDefaultSuggestions } from "@/lib/ai/suggestions";

export async function getTotalActiveStudents(): Promise<AiActionResult> {
  const total = await prisma.aluno.count({
    where: { status: "ATIVO" },
  });

  return {
    message: `Atualmente existem ${total} aluno${total === 1 ? "" : "s"} ativo${total === 1 ? "" : "s"} no sistema.`,
    suggestions: getDefaultSuggestions(),
  };
}