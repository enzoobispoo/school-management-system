import { prisma } from "@/lib/prisma";
import {
  CanalCobranca,
  StatusEnvioCobranca,
  TipoEnvioCobranca,
} from "@prisma/client";

interface CreateCobrancaEnvioLogInput {
  pagamentoId?: string | null;
  cobrancaLoteId?: string | null;
  canal: CanalCobranca;
  tipo: TipoEnvioCobranca;
  destino: string;
  status: StatusEnvioCobranca;
  provedor?: string | null;
  externalId?: string | null;
  mensagem?: string | null;
  erro?: string | null;
}

export async function createCobrancaEnvioLog(
  input: CreateCobrancaEnvioLogInput
) {
  return prisma.cobrancaEnvio.create({
    data: {
      pagamentoId: input.pagamentoId ?? null,
      cobrancaLoteId: input.cobrancaLoteId ?? null,
      canal: input.canal,
      tipo: input.tipo,
      destino: input.destino,
      status: input.status,
      provedor: input.provedor ?? null,
      externalId: input.externalId ?? null,
      mensagem: input.mensagem ?? null,
      erro: input.erro ?? null,
    },
  });
}