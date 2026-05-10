import "server-only";

import { Prisma, StatusPagamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addCalendarMonths, buildDueDateClamped } from "@/lib/finance/due-date";

export type CreateNegotiationPaymentsResult = {
  created: number;
  skipped: number;
  paymentIds: string[];
};

/**
 * Cria parcelas `Pagamento` PENDENTE a partir de negociação aceita (valor total / N parcelas).
 * Distribui centavos nas primeiras parcelas. Ignora competências que já existem para a matrícula.
 */
export async function createPaymentsFromNegotiation(input: {
  schoolId: string;
  matriculaId: string;
  negociacaoId: string;
  parcelas: number;
  valorTotal: number;
  competenciaMesInicio: number;
  competenciaAnoInicio: number;
  dueDay: number;
  cursoNome: string;
}): Promise<CreateNegotiationPaymentsResult> {
  const {
    schoolId,
    matriculaId,
    negociacaoId,
    parcelas,
    valorTotal,
    competenciaMesInicio,
    competenciaAnoInicio,
    dueDay,
    cursoNome,
  } = input;

  if (!Number.isFinite(parcelas) || parcelas < 1 || parcelas > 120) {
    throw new Error("INVALID_PARCELAS");
  }
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new Error("INVALID_VALOR_TOTAL");
  }

  const totalCents = Math.round(valorTotal * 100);
  const baseCents = Math.floor(totalCents / parcelas);
  const remainder = totalCents - baseCents * parcelas;

  const paymentIds: string[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < parcelas; i++) {
    const extraCent = i < remainder ? 1 : 0;
    const parcelaCents = baseCents + extraCent;
    const valorParcela = parcelaCents / 100;

    const comp = addCalendarMonths(
      competenciaAnoInicio,
      competenciaMesInicio,
      i
    );

    const exists = await prisma.pagamento.findUnique({
      where: {
        matriculaId_competenciaMes_competenciaAno: {
          matriculaId,
          competenciaMes: comp.month1based,
          competenciaAno: comp.year,
        },
      },
      select: { id: true },
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    const vencimento = buildDueDateClamped(comp.year, comp.month1based - 1, dueDay);

    const descricao = `Acordo (${comp.month1based.toString().padStart(2, "0")}/${comp.year}) · ${cursoNome}`;

    const pay = await prisma.pagamento.create({
      data: {
        schoolId,
        matriculaId,
        competenciaMes: comp.month1based,
        competenciaAno: comp.year,
        descricao,
        valor: new Prisma.Decimal(valorParcela.toFixed(2)),
        vencimento,
        status: StatusPagamento.PENDENTE,
        observacoes: `[Negociação ${negociacaoId}]`,
      },
    });

    paymentIds.push(pay.id);
    created += 1;
  }

  return { created, skipped, paymentIds };
}
