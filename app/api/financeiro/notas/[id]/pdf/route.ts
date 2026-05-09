import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { buildSchoolInvoicePdfBytes } from "@/lib/finance/build-school-invoice-pdf";

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

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { nome: true },
    });

    const bytes = await buildSchoolInvoicePdfBytes({
      invoice: nota,
      schoolNome: school?.nome ?? "Escola",
    });

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="documento-${nota.sequencial}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[financeiro/notas/[id]/pdf]", e);
    return NextResponse.json({ error: "PDF_FAILED" }, { status: 500 });
  }
}
