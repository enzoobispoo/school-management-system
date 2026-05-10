import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(
  request: NextRequest,
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

    const conta = await prisma.contaPagar.findFirst({
      where: { id, schoolId },
    });
    if (!conta) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF_ONLY" }, { status: 400 });
    }

    const path = `financeiro/contas-pagar/${schoolId}/${id}/${Date.now()}-${file.name}`;
    const blob = await put(path, file, {
      access: "public",
      contentType: "application/pdf",
    });

    const updated = await prisma.contaPagar.update({
      where: { id },
      data: { anexoUrl: blob.url },
    });

    await prisma.financeAuditEvent.create({
      data: {
        schoolId,
        eventType: "CONTA_PAGAR_ANEXO",
        source: "api.financeiro.contas-pagar.anexo",
        status: "OK",
        referenceId: id,
        message: "Anexo de NF/documento anexado à conta a pagar.",
      },
    });

    return NextResponse.json({ conta: updated });
  } catch (e) {
    console.error("[contas-pagar anexo]", e);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}
