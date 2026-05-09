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
    const status = searchParams.get("status") as StatusContaPagar | null;

    const rows = await prisma.contaPagar.findMany({
      where: {
        schoolId,
        ...(status && Object.values(StatusContaPagar).includes(status) ?
          { status }
        : {}),
      },
      orderBy: { vencimento: "asc" },
      take: 200,
    });

    return NextResponse.json({ contas: rows });
  } catch (e) {
    console.error("[financeiro/contas-pagar GET]", e);
    return NextResponse.json({ error: "LIST_FAILED" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as {
      fornecedorNome?: string;
      descricao?: string;
      categoria?: string;
      valor?: number;
      vencimento?: string;
      observacoes?: string;
    };

    if (!body.fornecedorNome?.trim() || !body.descricao?.trim()) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }
    const valor = Number(body.valor);
    if (!Number.isFinite(valor) || valor <= 0) {
      return NextResponse.json({ error: "INVALID_VALOR" }, { status: 400 });
    }
    if (!body.vencimento) {
      return NextResponse.json({ error: "INVALID_VENCIMENTO" }, { status: 400 });
    }

    const row = await prisma.contaPagar.create({
      data: {
        schoolId,
        fornecedorNome: body.fornecedorNome.trim().slice(0, 500),
        descricao: body.descricao.trim().slice(0, 2000),
        categoria: body.categoria?.trim().slice(0, 120) ?? null,
        valor: new Prisma.Decimal(valor.toFixed(2)),
        vencimento: new Date(body.vencimento),
        observacoes: body.observacoes?.slice(0, 4000) ?? null,
      },
    });

    return NextResponse.json({ conta: row });
  } catch (e) {
    console.error("[financeiro/contas-pagar POST]", e);
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 });
  }
}
