import { NextResponse } from "next/server";
import {
  assertCoreFinanceWrite,
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { runSchoolInvoiceEmissionRequest } from "@/lib/fiscal/run-school-invoice-emission-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
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
    const writeDenied = assertCoreFinanceWrite(user);
    if (writeDenied) return writeDenied;

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const { id } = await ctx.params;

    try {
      const result = await runSchoolInvoiceEmissionRequest({
        schoolId,
        invoiceId: id,
        requestedByUserId: user.id,
      });

      if (result.webhook === "NOT_CONFIGURED") {
        return NextResponse.json({
          ok: true,
          webhook: "NOT_CONFIGURED",
          hint: "Defina FISCAL_EMISSION_WEBHOOK_URL para enviar à fila de NFS-e/NF-e.",
        });
      }

      return NextResponse.json({ ok: true, webhook: "SENT" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "NOT_FOUND") {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      if (msg.startsWith("WEBHOOK_FAILED")) {
        return NextResponse.json(
          {
            error: "WEBHOOK_FAILED",
            detail: msg,
          },
          { status: 502 }
        );
      }
      throw e;
    }
  } catch (e) {
    console.error("[notas solicitar-emissao]", e);
    return NextResponse.json({ error: "POST_FAILED" }, { status: 500 });
  }
}
