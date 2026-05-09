import "server-only";

import { prisma } from "@/lib/prisma";

export async function nextSchoolInvoiceSequencial(schoolId: string): Promise<number> {
  const agg = await prisma.schoolInvoice.aggregate({
    where: { schoolId },
    _max: { sequencial: true },
  });
  return (agg._max.sequencial ?? 0) + 1;
}
