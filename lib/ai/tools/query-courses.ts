import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type QueryCoursesArgs = {
  search?: string;
  category?: string;
  active?: boolean;
  sortBy?: "students_desc" | "students_asc" | "name_asc";
  limit?: number;
};

export async function queryCourses(args: QueryCoursesArgs) {
  const limit = Math.min(Math.max(Number(args.limit || 10), 1), 50);

  const where: Prisma.CursoWhereInput = {
    ...(args.search
      ? {
          OR: [
            { nome: { contains: args.search, mode: "insensitive" } },
            { categoria: { contains: args.search, mode: "insensitive" } },
            { descricao: { contains: args.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(args.category
      ? { categoria: { contains: args.category, mode: "insensitive" } }
      : {}),
    ...(typeof args.active === "boolean" ? { ativo: args.active } : {}),
  };

  const cursos = await prisma.curso.findMany({
    where,
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

  let items = cursos.map((curso) => ({
    id: curso.id,
    name: curso.nome,
    category: curso.categoria,
    active: curso.ativo,
    monthlyPrice: Number(curso.valorMensal),
    duration: curso.duracaoTexto,
    students: curso.turmas.reduce((acc, turma) => acc + turma.matriculas.length, 0),
    classes: curso.turmas.length,
  }));

  switch (args.sortBy) {
    case "students_asc":
      items = items.sort((a, b) => a.students - b.students);
      break;
    case "name_asc":
      items = items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      items = items.sort((a, b) => b.students - a.students);
      break;
  }

  return {
    total: items.length,
    items: items.slice(0, limit),
  };
}