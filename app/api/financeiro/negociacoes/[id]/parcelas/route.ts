import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { createPaymentsFromNegotiation } from "@/lib/finance/create-negotiation-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const denied = assertFinanceRead(user);
    if (denied) return denied;
    const writeDenied = assertCoreFinanceWrite(user);
    if (writeDenied) return writeDenied;

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const { id } = await ctx.params;
    const body = (await request.json()) as {
      competenciaMesInicio?: number;
      competenciaAnoInicio?: number;
    };

    const neg = await prisma.negociacaoMensalidade.findFirst({
      where: { id, schoolId },
      include: {
        matricula: {
          include: {
            turma: { include: { curso: true } },
          },
        },
      },
    });

    if (!neg) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    if (neg.status !== "ACEITA") {
      return NextResponse.json(
        { error: "NEGOTIATION_NOT_ACCEPTED", code: "STATUS" },
        { status: 409 }
      );
    }

    if (neg.parcelasGeradasEm) {
      return NextResponse.json(
        { error: "PARCELAS_ALREADY_GENERATED", code: "DUPLICATE" },
        { status: 409 }
      );
    }

    const parcelas = neg.parcelasPropostas;
    const valorTotal =
      neg.valorProposto != null ? Number(neg.valorProposto.toString()) : NaN;

    if (!parcelas || parcelas < 1 || !Number.isFinite(valorTotal) || valorTotal <= 0) {
      return NextResponse.json(
        { error: "MISSING_VALOR_OR_PARCELAS", code: "INVALID" },
        { status: 400 }
      );
    }

    const mesInicio = Number(body.competenciaMesInicio);
    const anoInicio = Number(body.competenciaAnoInicio);
    if (
      !Number.isFinite(mesInicio) ||
      mesInicio < 1 ||
      mesInicio > 12 ||
      !Number.isFinite(anoInicio)
    ) {
      return NextResponse.json({ error: "INVALID_COMPETENCIA_INICIO" }, { status: 400 });
    }

    const settings = await prisma.escolaSettings.findUnique({
      where: { schoolId },
      select: { diaVencimentoPadrao: true },
    });
    const dueDay =
      neg.matricula.diaVencimentoMensal ??
      settings?.diaVencimentoPadrao ??
      10;

    const result = await createPaymentsFromNegotiation({
      schoolId,
      matriculaId: neg.matriculaId,
      negociacaoId: neg.id,
      parcelas,
      valorTotal,
      competenciaMesInicio: mesInicio,
      competenciaAnoInicio: anoInicio,
      dueDay,
      cursoNome: neg.matricula.turma.curso.nome,
    });

    await prisma.negociacaoMensalidade.update({
      where: { id },
      data: {
        parcelasGeradasEm: new Date(),
        status: "CONCLUIDA",
      },
    });

    await prisma.financeAuditEvent.create({
      data: {
        schoolId,
        eventType: "NEGOCIACAO_PARCELAS_GERADAS",
        source: "api.financeiro.negociacoes.parcelas",
        status: "OK",
        referenceId: id,
        message: `Geradas ${result.created} parcelas (ignoradas ${result.skipped}).`,
        payload: result,
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_PARCELAS" || msg === "INVALID_VALOR_TOTAL") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error("[negociacoes/[id]/parcelas]", e);
    return NextResponse.json({ error: "POST_FAILED" }, { status: 500 });
  }
}
