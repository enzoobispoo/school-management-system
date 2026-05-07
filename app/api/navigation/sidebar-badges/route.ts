import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

const EMPTY_BADGES = {
  financeiro: false,
  operacao: false,
  turmas: false,
  academico: false,
} as const;

export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Contagens leves para indicadores no menu lateral (sem payload completo do dashboard). */
export async function GET() {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const schoolResult = requireSchool(actor);
    if (schoolResult instanceof NextResponse) return schoolResult;

    const { schoolId } = schoolResult;

    if (actor.role === "PROFESSOR") {
      return NextResponse.json({ ...EMPTY_BADGES });
    }

    const hoje = startOfToday();

    const [
      financeiroCount,
      operacaoCount,
      turmasLotadasCount,
      academicIncidentCount,
    ] = await Promise.all([
      prisma.pagamento.count({
        where: {
          schoolId,
          status: { notIn: ["CANCELADO", "PAGO"] },
          dataPagamento: null,
          OR: [
            { status: "ATRASADO" },
            { status: "PENDENTE", vencimento: { lt: hoje } },
          ],
        },
      }),
      prisma.operationalIncident.count({
        where: {
          schoolId,
          status: { in: ["OPEN", "ACKNOWLEDGED"] },
        },
      }),
      (async () => {
        const turmas = await prisma.turma.findMany({
          where: { schoolId, ativo: true },
          select: {
            capacidadeMaxima: true,
            matriculas: {
              where: { schoolId, status: "ATIVA" },
              select: { id: true },
            },
          },
        });
        return turmas.filter(
          (t) => t.matriculas.length >= t.capacidadeMaxima && t.capacidadeMaxima > 0
        ).length;
      })(),
      prisma.operationalIncident.count({
        where: {
          schoolId,
          status: { in: ["OPEN", "ACKNOWLEDGED"] },
          category: "ACADEMIC",
        },
      }),
    ]);

    return NextResponse.json({
      financeiro: financeiroCount > 0,
      operacao: operacaoCount > 0,
      turmas: turmasLotadasCount > 0,
      academico: academicIncidentCount > 0,
    });
  } catch (error) {
    console.error("Erro ao calcular badges do menu:", error);
    return NextResponse.json(
      { error: "Falha ao carregar indicadores." },
      { status: 500 }
    );
  }
}
