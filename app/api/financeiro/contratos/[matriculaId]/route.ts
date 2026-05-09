import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ matriculaId: string }> }
) {
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

    const { matriculaId } = await ctx.params;

    const matricula = await prisma.matricula.findFirst({
      where: { id: matriculaId, schoolId },
      include: {
        aluno: { select: { nome: true } },
        turma: { select: { nome: true } },
        contratoFinanceiro: true,
      },
    });

    if (!matricula) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ matricula });
  } catch (e) {
    console.error("[financeiro/contratos/[id] GET]", e);
    return NextResponse.json({ error: "GET_FAILED" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ matriculaId: string }> }
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

    const { matriculaId } = await ctx.params;
    const body = (await request.json()) as Record<string, unknown>;

    const matricula = await prisma.matricula.findFirst({
      where: { id: matriculaId, schoolId },
    });
    if (!matricula) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const dec = (v: unknown) =>
      v === null || v === undefined || v === "" ? null : new Prisma.Decimal(String(v));

    const contrato = await prisma.matriculaContratoFinanceiro.upsert({
      where: { matriculaId },
      create: {
        schoolId,
        matriculaId,
        valorMensalidadeBase: dec(body.valorMensalidadeBase),
        descontoPercentual: dec(body.descontoPercentual),
        bolsaValor: dec(body.bolsaValor),
        dataInicioContrato:
          typeof body.dataInicioContrato === "string" ?
            new Date(body.dataInicioContrato)
          : null,
        dataFimContrato:
          typeof body.dataFimContrato === "string" ?
            new Date(body.dataFimContrato)
          : null,
        reajusteAnualPercentual: dec(body.reajusteAnualPercentual),
        observacoes:
          typeof body.observacoes === "string" ? body.observacoes.slice(0, 8000) : null,
      },
      update: {
        valorMensalidadeBase: dec(body.valorMensalidadeBase),
        descontoPercentual: dec(body.descontoPercentual),
        bolsaValor: dec(body.bolsaValor),
        dataInicioContrato:
          typeof body.dataInicioContrato === "string" ?
            new Date(body.dataInicioContrato)
          : body.dataInicioContrato === null ? null : undefined,
        dataFimContrato:
          typeof body.dataFimContrato === "string" ?
            new Date(body.dataFimContrato)
          : body.dataFimContrato === null ? null : undefined,
        reajusteAnualPercentual: dec(body.reajusteAnualPercentual),
        observacoes:
          typeof body.observacoes === "string" ?
            body.observacoes.slice(0, 8000)
          : body.observacoes === null ? null : undefined,
      },
    });

    await prisma.financeAuditEvent.create({
      data: {
        schoolId,
        eventType: "MATRICULA_CONTRATO_UPSERT",
        source: "api.financeiro.contratos",
        status: "OK",
        referenceId: matriculaId,
        message: "Contrato financeiro da matrícula atualizado.",
        payload: { contratoId: contrato.id },
      },
    });

    return NextResponse.json({ contrato });
  } catch (e) {
    console.error("[financeiro/contratos/[id] PATCH]", e);
    return NextResponse.json({ error: "PATCH_FAILED" }, { status: 500 });
  }
}
