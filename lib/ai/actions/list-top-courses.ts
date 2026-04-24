import { prisma } from "@/lib/prisma";

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

export async function listTopCourses() {
  const cursos = await prisma.curso.findMany({
    include: {
      turmas: {
        include: {
          matriculas: {
            where: { status: "ATIVA" },
            select: { id: true },
          },
        },
      },
    },
  });

  const items = cursos
    .map((curso) => {
      const totalAlunos = curso.turmas.reduce(
        (acc, turma) => acc + turma.matriculas.length,
        0
      );

      return {
        id: curso.id,
        name: curso.nome,
        category: curso.categoria,
        students: totalAlunos,
      };
    })
    .sort((a, b) => b.students - a.students)
    .slice(0, 20);

  if (items.length === 0) {
    return {
      message: "Não há cursos cadastrados no momento.",
    };
  }

  const lista = items
    .slice(0, 10)
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} (${item.category}) — ${formatNumber(
          item.students
        )} alunos`
    )
    .join("\n");

  return {
    message: `Cursos com mais alunos:\n\n${lista}`,
    conversationContext: {
      scope: "top_courses",
      items,
    },
  };
}