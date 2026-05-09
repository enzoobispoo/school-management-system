import { NextResponse } from "next/server";
import {
  SchoolInvoiceTipo,
  SchoolInvoiceStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { nextSchoolInvoiceSequencial } from "@/lib/finance/next-school-invoice-sequencial";
import { computeInvoiceTotals } from "@/lib/finance/compute-invoice-totals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = new Set(Object.values(SchoolInvoiceTipo));

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

    const notas = await prisma.schoolInvoice.findMany({
      where: { schoolId },
      orderBy: [{ sequencial: "desc" }],
      take: 100,
      include: { linhas: true },
    });

    return NextResponse.json({ notas });
  } catch (e) {
    console.error("[financeiro/notas GET]", e);
    return NextResponse.json({ error: "LIST_FAILED" }, { status: 500 });
  }
}

type LineBody = {
  descricao?: string;
  quantidade?: number;
  valorUnitario?: number;
  desconto?: number;
};

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
      tipo?: SchoolInvoiceTipo;
      tomadorNome?: string;
      tomadorDocumento?: string;
      tomadorEmail?: string;
      dataVencimento?: string | null;
      observacoes?: string;
      matriculaId?: string | null;
      professorId?: string | null;
      linhas?: LineBody[];
    };

    if (!body.tomadorNome?.trim()) {
      return NextResponse.json({ error: "TOMADOR_REQUIRED" }, { status: 400 });
    }

    const tipo =
      body.tipo && TIPOS.has(body.tipo) ? body.tipo : SchoolInvoiceTipo.OUTRO;

    const rawLines = Array.isArray(body.linhas) ? body.linhas : [];
    const normalized = rawLines
      .map((ln, idx) => ({
        descricao: (ln.descricao ?? `Item ${idx + 1}`).slice(0, 500),
        quantidade: Number(ln.quantidade ?? 1),
        valorUnitario: Number(ln.valorUnitario ?? 0),
        desconto: Number(ln.desconto ?? 0),
        ordem: idx,
      }))
      .filter((ln) => ln.quantidade > 0 && ln.valorUnitario >= 0);

    if (normalized.length === 0) {
      return NextResponse.json({ error: "LINHAS_REQUIRED" }, { status: 400 });
    }

    const totals = computeInvoiceTotals(normalized);

    let matriculaId: string | null = null;
    let professorId: string | null = null;

    if (body.matriculaId) {
      const m = await prisma.matricula.findFirst({
        where: { id: body.matriculaId, schoolId },
      });
      if (!m) {
        return NextResponse.json({ error: "MATRICULA_NOT_FOUND" }, { status: 404 });
      }
      matriculaId = m.id;
    }

    if (body.professorId) {
      const p = await prisma.professor.findFirst({
        where: { id: body.professorId, schoolId },
      });
      if (!p) {
        return NextResponse.json({ error: "PROFESSOR_NOT_FOUND" }, { status: 404 });
      }
      professorId = p.id;
    }

    const sequencial = await nextSchoolInvoiceSequencial(schoolId);

    const nota = await prisma.schoolInvoice.create({
      data: {
        schoolId,
        sequencial,
        tipo,
        status: SchoolInvoiceStatus.RASCUNHO,
        tomadorNome: body.tomadorNome.trim().slice(0, 500),
        tomadorDocumento: body.tomadorDocumento?.slice(0, 20) ?? null,
        tomadorEmail: body.tomadorEmail?.slice(0, 255) ?? null,
        dataVencimento:
          body.dataVencimento ? new Date(body.dataVencimento) : null,
        subtotal: totals.subtotal,
        descontoTotal: totals.descontoTotal,
        total: totals.total,
        observacoes: body.observacoes?.slice(0, 4000) ?? null,
        matriculaId,
        professorId,
        linhas: {
          create: normalized.map((ln) => ({
            descricao: ln.descricao,
            quantidade: new Prisma.Decimal(ln.quantidade.toFixed(4)),
            valorUnitario: new Prisma.Decimal(ln.valorUnitario.toFixed(2)),
            desconto: new Prisma.Decimal(ln.desconto.toFixed(2)),
            ordem: ln.ordem,
          })),
        },
      },
      include: { linhas: true },
    });

    await prisma.financeAuditEvent.create({
      data: {
        schoolId,
        eventType: "SCHOOL_INVOICE_CREATED",
        source: "api.financeiro.notas",
        status: "OK",
        referenceId: nota.id,
        message: `Documento fiscal interno #${nota.sequencial} criado.`,
      },
    });

    return NextResponse.json({ nota });
  } catch (e) {
    console.error("[financeiro/notas POST]", e);
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 });
  }
}
