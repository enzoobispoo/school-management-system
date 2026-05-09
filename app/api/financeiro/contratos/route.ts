import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const denied = assertFinanceRead(user);
    if (denied) return denied;

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();

    const rows = await prisma.matricula.findMany({
      where: {
        schoolId,
        status: "ATIVA",
        ...(q ?
          {
            OR: [
              { aluno: { nome: { contains: q, mode: "insensitive" } } },
              { turma: { nome: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
      },
      take: 100,
      orderBy: { dataMatricula: "desc" },
      include: {
        aluno: { select: { id: true, nome: true } },
        turma: { select: { id: true, nome: true } },
        contratoFinanceiro: true,
      },
    });

    return NextResponse.json({ matriculas: rows });
  } catch (e) {
    console.error("[financeiro/contratos GET]", e);
    return NextResponse.json({ error: "LIST_FAILED" }, { status: 500 });
  }
}
