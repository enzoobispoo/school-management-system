import { NextResponse } from "next/server";
import { SchoolInvoiceStatus } from "@prisma/client";
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
  ctx: { params: Promise<{ id: string }> }
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

    const { id } = await ctx.params;

    const nota = await prisma.schoolInvoice.findFirst({
      where: { id, schoolId },
      include: { linhas: { orderBy: { ordem: "asc" } } },
    });

    if (!nota) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ nota });
  } catch (e) {
    console.error("[financeiro/notas/[id] GET]", e);
    return NextResponse.json({ error: "GET_FAILED" }, { status: 500 });
  }
}

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
      status?: SchoolInvoiceStatus;
      providerFiscal?: string;
      idExternoFiscal?: string;
    };

    const existing = await prisma.schoolInvoice.findFirst({
      where: { id, schoolId },
    });
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const status =
      body.status && Object.values(SchoolInvoiceStatus).includes(body.status) ?
        body.status
      : undefined;

    const nota = await prisma.schoolInvoice.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(typeof body.providerFiscal === "string" ?
          { providerFiscal: body.providerFiscal.slice(0, 80) }
        : {}),
        ...(typeof body.idExternoFiscal === "string" ?
          { idExternoFiscal: body.idExternoFiscal.slice(0, 120) }
        : {}),
      },
      include: { linhas: true },
    });

    return NextResponse.json({ nota });
  } catch (e) {
    console.error("[financeiro/notas/[id] PATCH]", e);
    return NextResponse.json({ error: "PATCH_FAILED" }, { status: 500 });
  }
}
