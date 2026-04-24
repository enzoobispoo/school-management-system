import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const [alunos, cursos, professores, pagamentos] = await Promise.all([
      prisma.aluno.findMany({
        where: {
          nome: { contains: query, mode: "insensitive" },
        },
        take: 5,
        select: {
          id: true,
          nome: true,
        },
      }),
      prisma.curso.findMany({
        where: {
          nome: { contains: query, mode: "insensitive" },
        },
        take: 5,
        select: {
          id: true,
          nome: true,
        },
      }),
      prisma.professor.findMany({
        where: {
          nome: { contains: query, mode: "insensitive" },
        },
        take: 5,
        select: {
          id: true,
          nome: true,
        },
      }),
      prisma.pagamento.findMany({
        where: {
          OR: [
            { descricao: { contains: query, mode: "insensitive" } },
            {
              matricula: {
                aluno: {
                  nome: { contains: query, mode: "insensitive" },
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
            },
          },
        },
      }),
    ]);

    const results = [
      ...alunos.map((item) => ({
        id: item.id,
        type: "aluno",
        label: item.nome,
        href: `/alunos`,
      })),
      ...cursos.map((item) => ({
        id: item.id,
        type: "curso",
        label: item.nome,
        href: `/cursos`,
      })),
      ...professores.map((item) => ({
        id: item.id,
        type: "professor",
        label: item.nome,
        href: `/professores`,
      })),
      ...pagamentos.map((item) => ({
        id: item.id,
        type: "pagamento",
        label: `${item.matricula.aluno.nome} — ${item.descricao}`,
        href: `/financeiro`,
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