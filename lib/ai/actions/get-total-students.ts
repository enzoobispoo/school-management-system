import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getDefaultSuggestions } from "@/lib/ai/suggestions";

export async function getTotalStudents(
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

  const totalAlunos = await prisma.aluno.count({ where: { schoolId: sid } });

  return {
    message: `Você possui ${totalAlunos} aluno${
      totalAlunos === 1 ? "" : "s"
    } cadastrado${totalAlunos === 1 ? "" : "s"} no sistema.`,
    suggestions: getDefaultSuggestions(),
  };
}