import { NextResponse } from "next/server";
import {
  ProfessorRegimeTrabalho,
  ProfessorSituacaoFinanceira,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGIMES = new Set(Object.values(ProfessorRegimeTrabalho));
const SITUACOES = new Set(Object.values(ProfessorSituacaoFinanceira));

function optionalDecimal(
  body: Record<string, unknown>,
  key: string
): Prisma.Decimal | null | undefined {
  const v = body[key];
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Prisma.Decimal(v.toFixed(2));
  }
  if (v === null) return null;
  return undefined;
}

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
      include: {
        perfilFinanceiro: true,
        pagamentosProfessor: {
          orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
          take: 24,
        },
      },
    });

    if (!professor) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ professor });
  } catch (e) {
    console.error("[professores-financeiro/[id] GET]", e);
    return NextResponse.json({ error: "GET_FAILED" }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = (await request.json()) as Record<string, unknown>;

    const professor = await prisma.professor.findFirst({
      where: { id: professorId, schoolId },
    });
    if (!professor) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const regime =
      typeof body.regime === "string" && REGIMES.has(body.regime as ProfessorRegimeTrabalho) ?
        (body.regime as ProfessorRegimeTrabalho)
      : ProfessorRegimeTrabalho.CLT;

    const situacao =
      typeof body.situacao === "string" &&
      SITUACOES.has(body.situacao as ProfessorSituacaoFinanceira) ?
        (body.situacao as ProfessorSituacaoFinanceira)
      : ProfessorSituacaoFinanceira.REGULAR;

    const perfil = await prisma.professorPerfilFinanceiro.upsert({
      where: { professorId },
      create: {
        schoolId,
        professorId,
        regime,
        situacao,
        documento:
          typeof body.documento === "string" ? body.documento.slice(0, 20) : null,
        chavePix:
          typeof body.chavePix === "string" ? body.chavePix.slice(0, 200) : null,
        dadosBancarios:
          body.dadosBancarios != null && typeof body.dadosBancarios === "object" ?
            body.dadosBancarios as Prisma.InputJsonValue
          : Prisma.JsonNull,
        valorReferenciaMensal:
          typeof body.valorReferenciaMensal === "number" &&
          Number.isFinite(body.valorReferenciaMensal) ?
            new Prisma.Decimal(body.valorReferenciaMensal.toFixed(2))
          : null,
        dataAdmissao:
          typeof body.dataAdmissao === "string" ?
            new Date(body.dataAdmissao)
          : null,
        observacoes:
          typeof body.observacoes === "string" ?
            body.observacoes.slice(0, 4000)
          : null,
        cargoFuncao:
          typeof body.cargoFuncao === "string" ?
            body.cargoFuncao.slice(0, 200)
          : null,
        salarioBaseCLT: optionalDecimal(body, "salarioBaseCLT") ?? null,
        valeTransporte: optionalDecimal(body, "valeTransporte") ?? null,
        valeRefeicao: optionalDecimal(body, "valeRefeicao") ?? null,
      },
      update: {
        regime,
        situacao,
        documento:
          typeof body.documento === "string" ?
            body.documento.slice(0, 20)
          : body.documento === null ? null : undefined,
        chavePix:
          typeof body.chavePix === "string" ?
            body.chavePix.slice(0, 200)
          : body.chavePix === null ? null : undefined,
        dadosBancarios:
          body.dadosBancarios === null ? Prisma.JsonNull
          : body.dadosBancarios != null && typeof body.dadosBancarios === "object" ?
            (body.dadosBancarios as Prisma.InputJsonValue)
          : undefined,
        valorReferenciaMensal:
          typeof body.valorReferenciaMensal === "number" &&
          Number.isFinite(body.valorReferenciaMensal) ?
            new Prisma.Decimal(body.valorReferenciaMensal.toFixed(2))
          : body.valorReferenciaMensal === null ? null : undefined,
        dataAdmissao:
          typeof body.dataAdmissao === "string" ?
            new Date(body.dataAdmissao)
          : body.dataAdmissao === null ? null : undefined,
        observacoes:
          typeof body.observacoes === "string" ?
            body.observacoes.slice(0, 4000)
          : body.observacoes === null ? null : undefined,
        cargoFuncao:
          typeof body.cargoFuncao === "string" ?
            body.cargoFuncao.slice(0, 200)
          : body.cargoFuncao === null ? null : undefined,
        salarioBaseCLT: optionalDecimal(body, "salarioBaseCLT"),
        valeTransporte: optionalDecimal(body, "valeTransporte"),
        valeRefeicao: optionalDecimal(body, "valeRefeicao"),
      },
    });

    return NextResponse.json({ perfil });
  } catch (e) {
    console.error("[professores-financeiro/[id] PATCH]", e);
    return NextResponse.json({ error: "PATCH_FAILED" }, { status: 500 });
  }
}
