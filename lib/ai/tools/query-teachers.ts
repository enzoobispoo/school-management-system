import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type QueryTeachersArgs = {
  search?: string;
  courseName?: string;
  active?: boolean;
  limit?: number;
};

export async function queryTeachers(args: QueryTeachersArgs) {
  const limit = Math.min(Math.max(Number(args.limit || 10), 1), 50);

  const where: Prisma.ProfessorWhereInput = {
    ...(args.search
      ? {
          OR: [
            { nome: { contains: args.search, mode: "insensitive" } },
            { email: { contains: args.search, mode: "insensitive" } },
            { telefone: { contains: args.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(typeof args.active === "boolean" ? { ativo: args.active } : {}),
    ...(args.courseName
      ? {
          turmas: {
            some: {
              curso: {
                nome: { contains: args.courseName, mode: "insensitive" },
              },
            },
          },
        }
      : {}),
  };

  const professores = await prisma.professor.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      turmas: {
        include: {
          curso: true,
          matriculas: {
            where: { status: "ATIVA" },
            select: { id: true },
          },
        },
      },
    },
  });

  return {
    total: professores.length,
    items: professores.map((professor) => ({
      id: professor.id,
      name: professor.nome,
      email: professor.email,
      phone: professor.telefone,
      active: professor.ativo,
      courses: Array.from(new Set(professor.turmas.map((t) => t.curso.nome))),
      classes: professor.turmas.length,
      students: professor.turmas.reduce(
        (acc, turma) => acc + turma.matriculas.length,
        0
      ),
    })),
  };
}