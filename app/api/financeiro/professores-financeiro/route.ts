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

    const professores = await prisma.professor.findMany({
      where: {
        schoolId,
        ...(q ? { nome: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: { nome: "asc" },
      take: 120,
      include: {
        perfilFinanceiro: true,
        pagamentosProfessor: {
          orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
          take: 1,
        },
        turmas: { where: { ativo: true }, select: { id: true } },
      },
    });

    return NextResponse.json({
      professores: professores.map((p) => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        ativo: p.ativo,
        turmasAtivas: p.turmas.length,
        perfil: p.perfilFinanceiro,
        ultimoPagamento: p.pagamentosProfessor[0] ?? null,
      })),
    });
  } catch (e) {
    console.error("[financeiro/professores-financeiro GET]", e);
    return NextResponse.json({ error: "LIST_FAILED" }, { status: 500 });
  }
}
