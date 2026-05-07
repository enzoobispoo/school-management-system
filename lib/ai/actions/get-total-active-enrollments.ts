import { prisma } from "@/lib/prisma";
import type { AiActionResult } from "@/lib/ai/types";
import { getDefaultSuggestions } from "@/lib/ai/suggestions";

export async function getTotalActiveEnrollments(
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

  const total = await prisma.matricula.count({
    where: { schoolId: sid, status: "ATIVA" },
  });

  return {
    message: `Existem ${total} matrícula${total === 1 ? "" : "s"} ativa${total === 1 ? "" : "s"} no sistema.`,
    suggestions: getDefaultSuggestions(),
    executed: true,
  };
}
