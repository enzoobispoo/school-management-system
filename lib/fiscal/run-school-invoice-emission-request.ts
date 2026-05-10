import "server-only";

import { prisma } from "@/lib/prisma";
import { postFiscalEmissionWebhook } from "@/lib/fiscal/emission-webhook";

export type RunSchoolInvoiceEmissionParams = {
  schoolId: string;
  invoiceId: string;
  requestedByUserId?: string | null;
};

/**
 * Mesma lógica de negócio de `POST /api/financeiro/notas/[id]/solicitar-emissao`,
 * para uso em workers (Trigger.dev) sem sessão HTTP.
 */
export async function runSchoolInvoiceEmissionRequest(
  params: RunSchoolInvoiceEmissionParams
) {
  const { schoolId, invoiceId } = params;

  const nota = await prisma.schoolInvoice.findFirst({
    where: { id: invoiceId, schoolId },
    include: {
      linhas: { orderBy: { ordem: "asc" } },
    },
  });

  if (!nota) {
    throw new Error("NOT_FOUND");
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { nome: true, slug: true },
  });

  const payload = {
    event: "school_invoice.emission_requested",
    requestedAt: new Date().toISOString(),
    requestedByUserId: params.requestedByUserId ?? null,
    source: "trigger.automation",
    school: { id: schoolId, nome: school?.nome, slug: school?.slug },
    invoice: {
      id: nota.id,
      sequencial: nota.sequencial,
      tipo: nota.tipo,
      status: nota.status,
      tomadorNome: nota.tomadorNome,
      tomadorDocumento: nota.tomadorDocumento,
      tomadorEmail: nota.tomadorEmail,
      subtotal: nota.subtotal.toString(),
      descontoTotal: nota.descontoTotal.toString(),
      total: nota.total.toString(),
      linhas: nota.linhas.map((l) => ({
        descricao: l.descricao,
        quantidade: l.quantidade.toString(),
        valorUnitario: l.valorUnitario.toString(),
        desconto: l.desconto.toString(),
      })),
    },
  };

  const hook = await postFiscalEmissionWebhook(payload);

  if (hook.skipped) {
    await prisma.schoolInvoice.update({
      where: { id: invoiceId },
      data: { emissionRequestedAt: new Date() },
    });
    return {
      ok: true as const,
      webhook: "NOT_CONFIGURED" as const,
    };
  }

  if (!hook.ok) {
    throw new Error(`WEBHOOK_FAILED:${hook.status ?? "unknown"}`);
  }

  await prisma.schoolInvoice.update({
    where: { id: invoiceId },
    data: { emissionRequestedAt: new Date() },
  });

  return { ok: true as const, webhook: "SENT" as const };
}
