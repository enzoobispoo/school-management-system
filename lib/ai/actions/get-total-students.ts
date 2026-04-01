import { prisma } from "@/lib/prisma";
import { AiActionResult } from "@/lib/ai/types";
import { getDefaultSuggestions } from "@/lib/ai/suggestions";

export async function getTotalStudents(): Promise<AiActionResult> {
  const totalAlunos = await prisma.aluno.count();

  return {
    message: `Você possui ${totalAlunos} aluno${
      totalAlunos === 1 ? "" : "s"
    } cadastrado${totalAlunos === 1 ? "" : "s"} no sistema.`,
    suggestions: getDefaultSuggestions(),
  };
}