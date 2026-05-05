import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getDefaultSuggestions } from "@/lib/ai/suggestions";

export async function getTotalActiveStudents(
  schoolId?: string | null
): Promise<AiActionResult> {
  const sid = schoolId?.trim();
  if (!sid) {
    return {
      message:
        "Não foi possível identificar a escola. Faça login com um usuário vinculado a uma escola.",
      suggestions: getDefaultSuggestions(),
    };
  }

  const total = await prisma.aluno.count({
    where: { schoolId: sid, status: "ATIVO" },
  });

  return {
    message: `Atualmente existem ${total} aluno${total === 1 ? "" : "s"} ativo${total === 1 ? "" : "s"} no sistema.`,
    suggestions: getDefaultSuggestions(),
  };
}