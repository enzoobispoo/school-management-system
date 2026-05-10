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

    const rows = await prisma.negociacaoMensalidade.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        matricula: {
          include: {
            aluno: { select: { nome: true } },
            turma: { select: { nome: true } },
          },
        },
        decididoPor: { select: { id: true, nome: true, email: true } },
      },
    });

    return NextResponse.json({ negociacoes: rows });
  } catch (e) {
    console.error("[financeiro/negociacoes GET]", e);
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
      matriculaId?: string;
      status?: string;
      valorProposto?: number;
      parcelasPropostas?: number;
      observacoes?: string;
    };

    if (!body.matriculaId) {
      return NextResponse.json({ error: "MATRICULA_REQUIRED" }, { status: 400 });
    }

    const mat = await prisma.matricula.findFirst({
      where: { id: body.matriculaId, schoolId },
    });
    if (!mat) {
      return NextResponse.json({ error: "MATRICULA_NOT_FOUND" }, { status: 404 });
    }

    const row = await prisma.negociacaoMensalidade.create({
      data: {
        schoolId,
        matriculaId: body.matriculaId,
        status: body.status?.slice(0, 40) ?? "ABERTA",
        valorProposto:
          body.valorProposto != null && Number.isFinite(body.valorProposto) ?
            new Prisma.Decimal(body.valorProposto.toFixed(2))
          : null,
        parcelasPropostas:
          body.parcelasPropostas != null && Number.isFinite(body.parcelasPropostas) ?
            Math.floor(body.parcelasPropostas)
          : null,
        observacoes: body.observacoes?.slice(0, 4000) ?? null,
      },
    });

    return NextResponse.json({ negociacao: row });
  } catch (e) {
    console.error("[financeiro/negociacoes POST]", e);
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 });
  }
}
