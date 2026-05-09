import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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

    const now = new Date();
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);

    const [
      contasPagarPendentes,
      contasVencendo,
      negociacoesAbertas,
      professoresSemPerfil,
      notasRascunho,
      matriculasSemContrato,
    ] = await Promise.all([
      prisma.contaPagar.aggregate({
        where: { schoolId, status: "PENDENTE" },
        _sum: { valor: true },
        _count: { id: true },
      }),
      prisma.contaPagar.count({
        where: {
          schoolId,
          status: "PENDENTE",
          vencimento: { lte: in7, gte: now },
        },
      }),
      prisma.negociacaoMensalidade.count({
        where: { schoolId, status: "ABERTA" },
      }),
      prisma.professor.count({
        where: {
          schoolId,
          ativo: true,
          perfilFinanceiro: null,
        },
      }),
      prisma.schoolInvoice.count({
        where: { schoolId, status: "RASCUNHO" },
      }),
      prisma.matricula.count({
        where: {
          schoolId,
          status: "ATIVA",
          contratoFinanceiro: null,
        },
      }),
    ]);

    return NextResponse.json({
      contasPagarPendentesValor: contasPagarPendentes._sum.valor ?? 0,
      contasPagarPendentesQtd: contasPagarPendentes._count.id,
      contasPagarVencendo7d: contasVencendo,
      negociacoesAbertas,
      professoresSemPerfilFinanceiro: professoresSemPerfil,
      notasRascunho,
      matriculasAtivasSemContratoFinanceiro: matriculasSemContrato,
    });
  } catch (e) {
    console.error("[painel-profissional/resumo]", e);
    return NextResponse.json({ error: "RESUMO_FAILED" }, { status: 500 });
  }
}
