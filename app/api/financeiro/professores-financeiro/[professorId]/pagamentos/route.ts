import { NextResponse } from "next/server";
import { StatusProfessorPagamento, Prisma } from "@prisma/client";
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
  ctx: { params: Promise<{ professorId: string }> }
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

    const { professorId } = await ctx.params;

    const professor = await prisma.professor.findFirst({
      where: { id: professorId, schoolId },
    });
    if (!professor) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const pagamentos = await prisma.professorPagamento.findMany({
      where: { schoolId, professorId },
      orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
      take: 48,
    });

    return NextResponse.json({ pagamentos });
  } catch (e) {
    console.error("[professor pagamentos GET]", e);
    return NextResponse.json({ error: "LIST_FAILED" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ professorId: string }> }
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

    const { professorId } = await ctx.params;
    const body = (await request.json()) as {
      competenciaMes?: number;
      competenciaAno?: number;
      valorBruto?: number;
      descontos?: number;
      status?: StatusProfessorPagamento;
      descricao?: string;
      observacoes?: string;
      dataPagamento?: string | null;
    };

    const professor = await prisma.professor.findFirst({
      where: { id: professorId, schoolId },
    });
    if (!professor) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const mes = Number(body.competenciaMes);
    const ano = Number(body.competenciaAno);
    if (!Number.isFinite(mes) || mes < 1 || mes > 12 || !Number.isFinite(ano)) {
      return NextResponse.json({ error: "INVALID_COMPETENCIA" }, { status: 400 });
    }

    const bruto = Number(body.valorBruto);
    const desc = Number(body.descontos ?? 0);
    if (!Number.isFinite(bruto) || bruto < 0 || !Number.isFinite(desc) || desc < 0) {
      return NextResponse.json({ error: "INVALID_VALORES" }, { status: 400 });
    }

    const liquido = Math.max(0, bruto - desc);
    const status =
      body.status && Object.values(StatusProfessorPagamento).includes(body.status) ?
        body.status
      : StatusProfessorPagamento.RASCUNHO;

    const pagamento = await prisma.professorPagamento.upsert({
      where: {
        professorId_competenciaMes_competenciaAno: {
          professorId,
          competenciaMes: mes,
          competenciaAno: ano,
        },
      },
      create: {
        schoolId,
        professorId,
        competenciaMes: mes,
        competenciaAno: ano,
        valorBruto: new Prisma.Decimal(bruto.toFixed(2)),
        descontos: new Prisma.Decimal(desc.toFixed(2)),
        valorLiquido: new Prisma.Decimal(liquido.toFixed(2)),
        status,
        descricao: body.descricao?.slice(0, 500) ?? null,
        observacoes: body.observacoes?.slice(0, 4000) ?? null,
        dataPagamento:
          body.dataPagamento ? new Date(body.dataPagamento)
          : status === StatusProfessorPagamento.PAGO ? new Date()
          : null,
      },
      update: {
        valorBruto: new Prisma.Decimal(bruto.toFixed(2)),
        descontos: new Prisma.Decimal(desc.toFixed(2)),
        valorLiquido: new Prisma.Decimal(liquido.toFixed(2)),
        status,
        descricao:
          typeof body.descricao === "string" ?
            body.descricao.slice(0, 500)
          : undefined,
        observacoes:
          typeof body.observacoes === "string" ?
            body.observacoes.slice(0, 4000)
          : undefined,
        dataPagamento:
          status === StatusProfessorPagamento.PAGO ?
            body.dataPagamento ?
              new Date(body.dataPagamento)
            : new Date()
          : null,
      },
    });

    return NextResponse.json({ pagamento });
  } catch (e) {
    console.error("[professor pagamentos POST]", e);
    return NextResponse.json({ error: "UPSERT_FAILED" }, { status: 500 });
  }
}
