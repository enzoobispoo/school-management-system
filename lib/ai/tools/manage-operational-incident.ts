import { prisma } from "@/lib/prisma";

/**
 * Marca incidente operacional como em tratativa ou resolvido (equivalente aos botões da UI).
 * Dispensa permanece só para administradores na interface — não exposto aqui.
 */
export async function manageOperationalIncidentTool(
  args: {
    incidentId?: string;
    action?: "acknowledge" | "resolve";
    confirmed?: boolean;
  },
  schoolId?: string | null,
  userId?: string | null
) {
  const sid = schoolId?.trim();
  const uid = userId?.trim();
  const incidentId = args.incidentId?.trim();

  if (!sid || !uid) {
    return {
      ok: false,
      error: "missing_user_or_school",
      message:
        "Contexto de usuário ou escola ausente. Efetue login como usuário da escola.",
    };
  }

  if (!incidentId || !args.action) {
    return {
      ok: false,
      error: "missing_params",
      message: "Informe incidentId e action (acknowledge | resolve).",
    };
  }

  const incident = await prisma.operationalIncident.findFirst({
    where: { id: incidentId, schoolId: sid },
    select: { id: true, title: true, status: true },
  });

  if (!incident) {
    return { ok: false, error: "not_found", message: "Incidente não encontrado." };
  }

  if (args.action === "acknowledge") {
    if (incident.status !== "OPEN") {
      return {
        ok: false,
        error: "invalid_state",
        message: `Só é possível ir para "em tratativa" a partir de ABERTO. Status atual: ${incident.status}.`,
      };
    }
  } else if (args.action === "resolve") {
    if (!["OPEN", "ACKNOWLEDGED"].includes(incident.status)) {
      return {
        ok: false,
        error: "invalid_state",
        message: `Não é possível resolver neste status: ${incident.status}.`,
      };
    }
  }

  if (!args.confirmed) {
    const slug =
      args.action === "acknowledge" ? "tratativa" : "resolvido";
    return {
      ok: false,
      needsConfirmation: true,
      incidentId,
      titulo: incident.title,
      proximoPasso: `Peça confirmação explícita ao usuário. Quando ele aceitar, chame de novo com confirmed:true. Frase exata sugerida: confirmar incidente ${incidentId} ${slug}`,
    };
  }

  const now = new Date();

  if (args.action === "acknowledge") {
    await prisma.operationalIncident.update({
      where: { id: incidentId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: now,
        acknowledgedById: uid,
      },
    });
    return {
      ok: true,
      incidentId,
      novoStatus: "ACKNOWLEDGED",
      message: "Incidente marcado como em tratativa.",
    };
  }

  await prisma.operationalIncident.update({
    where: { id: incidentId },
    data: {
      status: "RESOLVED",
      resolvedAt: now,
      resolvedById: uid,
    },
  });

  return {
    ok: true,
    incidentId,
    novoStatus: "RESOLVED",
    message: "Incidente marcado como resolvido.",
  };
}
