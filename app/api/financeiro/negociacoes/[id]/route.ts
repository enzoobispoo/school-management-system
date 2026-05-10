import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set([
  "ABERTA",
  "EM_ANALISE",
  "ACEITA",
  "RECUSADA",
  "CONCLUIDA",
]);

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
      status?: string;
      decisaoObservacoes?: string | null;
    };

    if (!body.status || !ALLOWED_STATUS.has(body.status)) {
      return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
    }

    const neg = await prisma.negociacaoMensalidade.findFirst({
      where: { id, schoolId },
    });
    if (!neg) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const now = new Date();
    const row = await prisma.negociacaoMensalidade.update({
      where: { id },
      data: {
        status: body.status,
        decisaoObservacoes:
          typeof body.decisaoObservacoes === "string" ?
            body.decisaoObservacoes.slice(0, 2000)
          : body.decisaoObservacoes === null ? null : undefined,
        decidedAt: now,
        decidedByUserId: user.id,
      },
    });

    await prisma.financeAuditEvent.create({
      data: {
        schoolId,
        eventType: "NEGOCIACAO_STATUS",
        source: "api.financeiro.negociacoes",
        status: "OK",
        referenceId: id,
        message: `Negociação → ${body.status}`,
        payload: { matriculaId: neg.matriculaId },
      },
    });

    return NextResponse.json({ negociacao: row });
  } catch (e) {
    console.error("[negociacoes/[id] PATCH]", e);
    return NextResponse.json({ error: "PATCH_FAILED" }, { status: 500 });
  }
}
