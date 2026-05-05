import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const query = request.nextUrl.searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [alunos, cursos, professores, pagamentos] = await Promise.all([
      prisma.aluno.findMany({
        where: {
          schoolId,
          OR: [
            { nome: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { telefone: { contains: query, mode: "insensitive" } },
            { cpf: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          nome: true,
          email: true,
        },
        orderBy: { nome: "asc" },
      }),

      prisma.curso.findMany({
        where: {
          schoolId,
          OR: [
            { nome: { contains: query, mode: "insensitive" } },
            { categoria: { contains: query, mode: "insensitive" } },
            { descricao: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          nome: true,
          categoria: true,
        },
        orderBy: { nome: "asc" },
      }),

      prisma.professor.findMany({
        where: {
          schoolId,
          OR: [
            { nome: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { telefone: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          nome: true,
          email: true,
        },
        orderBy: { nome: "asc" },
      }),

      prisma.pagamento.findMany({
        where: {
          schoolId,
          OR: [
            { descricao: { contains: query, mode: "insensitive" } },
            {
              matricula: {
                aluno: {
                  nome: { contains: query, mode: "insensitive" },
                },
              },
            },
            {
              matricula: {
                turma: {
                  curso: {
                    nome: { contains: query, mode: "insensitive" },
                  },
                },
              },
            },
          ],
        },
        take: 5,
        include: {
          matricula: {
            include: {
              aluno: true,
              turma: {
                include: {
                  curso: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const results = [
      ...alunos.map((item) => ({
        id: item.id,
        type: "aluno" as const,
        label: item.nome,
        description: item.email || "Aluno",
        href: `/alunos?id=${item.id}`,
      })),

      ...cursos.map((item) => ({
        id: item.id,
        type: "curso" as const,
        label: item.nome,
        description: item.categoria || "Curso",
        href: `/cursos?id=${item.id}`,
      })),

      ...professores.map((item) => ({
        id: item.id,
        type: "professor" as const,
        label: item.nome,
        description: item.email || "Professor",
        href: `/professores?id=${item.id}`,
      })),

      ...pagamentos.map((item) => ({
        id: item.id,
        type: "pagamento" as const,
        label: `${item.matricula.aluno.nome} — ${item.descricao}`,
        description: item.matricula.turma.curso.nome,
        href: `/financeiro?paymentId=${item.id}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Erro na busca global:", error);

    return NextResponse.json(
      { error: "Não foi possível realizar a busca." },
      { status: 500 }
    );
  }
}