import { StatusEnvioCobranca, TipoEnvioCobranca } from "@prisma/client";

interface UltimoEnvioInfo {
  createdAt: Date;
  status: StatusEnvioCobranca;
}

function getCooldownHours(tipo: TipoEnvioCobranca) {
  switch (tipo) {
    case "BOLETO":
      return 0.1; // ~6 minutos
    case "LEMBRETE":
      return 24;
    case "COBRANCA_ATRASO":
      return 24;
    default:
      return 24;
  }
}

export function canSendCobranca(
  tipo: TipoEnvioCobranca,
  ultimoEnvio?: UltimoEnvioInfo | null
) {
  if (!ultimoEnvio) {
    return {
      allowed: true,
      remainingHours: 0,
    };
  }

  if (ultimoEnvio.status !== "ENVIADO") {
    return {
      allowed: true,
      remainingHours: 0,
    };
  }

  const cooldownHours = getCooldownHours(tipo);
  const agora = new Date();
  const ultimoEnvioAt = new Date(ultimoEnvio.createdAt);

  const diffMs = agora.getTime() - ultimoEnvioAt.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const allowed = diffHours >= cooldownHours;

  return {
    allowed,
    remainingHours: allowed ? 0 : Number((cooldownHours - diffHours).toFixed(1)),
  };
}