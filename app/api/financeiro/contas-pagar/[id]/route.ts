import { NextResponse } from "next/server";
import { StatusContaPagar, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
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
      status?: StatusContaPagar;
      dataPagamento?: string | null;
      valor?: number;
      numeroDocumentoFiscal?: string | null;
    };

    const existing = await prisma.contaPagar.findFirst({
      where: { id, schoolId },
    });
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const data: {
      status?: StatusContaPagar;
      dataPagamento?: Date | null;
      valor?: Prisma.Decimal;
      numeroDocumentoFiscal?: string | null;
    } = {};

    if (body.status && Object.values(StatusContaPagar).includes(body.status)) {
      data.status = body.status;
      if (body.status === StatusContaPagar.PAGO && body.dataPagamento) {
        data.dataPagamento = new Date(body.dataPagamento);
      }
      if (body.status === StatusContaPagar.PENDENTE) {
        data.dataPagamento = null;
      }
    }

    if (typeof body.valor === "number" && Number.isFinite(body.valor) && body.valor > 0) {
      data.valor = new Prisma.Decimal(body.valor.toFixed(2));
    }

    if (typeof body.numeroDocumentoFiscal === "string") {
      data.numeroDocumentoFiscal = body.numeroDocumentoFiscal.slice(0, 80);
    }
    if (body.numeroDocumentoFiscal === null) {
      data.numeroDocumentoFiscal = null;
    }

    const conta = await prisma.contaPagar.update({
      where: { id },
      data,
    });

    return NextResponse.json({ conta });
  } catch (e) {
    console.error("[financeiro/contas-pagar/[id] PATCH]", e);
    return NextResponse.json({ error: "PATCH_FAILED" }, { status: 500 });
  }
}
