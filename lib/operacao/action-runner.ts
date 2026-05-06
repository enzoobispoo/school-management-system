import type { OperationalIncident } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logFinanceAuditEvent } from "@/lib/services/finance-audit";
import type { PlaybookActionV1, PlaybookDefinitionV1 } from "@/lib/operacao/types";
import { interpolateTemplate } from "@/lib/operacao/template-interpolate";

function flatVarsFromIncident(
  incident: OperationalIncident,
  extra?: Record<string, unknown>
): Record<string, string | number> {
  const ctx = (incident.contextJson ?? {}) as Record<string, unknown>;
  const merged = { ...ctx, ...extra };
  const out: Record<string, string | number> = {
    title: incident.title,
    problemStatement: incident.problemStatement,
    dedupeKey: incident.dedupeKey,
  };
  if (incident.impactHint) out.impactHint = incident.impactHint;
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" || typeof v === "number") out[k] = v;
    else if (typeof v === "boolean") out[k] = v ? "sim" : "não";
  }
  return out;
}

async function maybeNotify(
  schoolId: string,
  incident: OperationalIncident,
  titulo: string,
  mensagem: string,
  everyHours: number
): Promise<void> {
  const now = Date.now();
  const last = incident.lastNotifiedAt?.getTime() ?? 0;
  const minMs = Math.max(everyHours, 1) * 3600000;
  if (now - last < minMs) return;

  await prisma.notificacao.create({
    data: {
      schoolId,
      tipo: "SISTEMA",
      titulo: titulo.slice(0, 120),
      mensagem: mensagem.slice(0, 500),
      entidadeTipo: "SISTEMA",
      entidadeId: incident.id,
    },
  });

  await prisma.operationalIncident.update({
    where: { id: incident.id },
    data: { lastNotifiedAt: new Date() },
  });
}

export async function runPlaybookActions(params: {
  schoolId: string;
  playbookCode: string;
  definition: PlaybookDefinitionV1;
  incident: OperationalIncident;
}): Promise<void> {
  const vars = flatVarsFromIncident(params.incident);

  for (const action of params.definition.actions) {
    await runOneAction(action, params, vars);
  }
}

async function runOneAction(
  action: PlaybookActionV1,
  params: {
    schoolId: string;
    playbookCode: string;
    incident: OperationalIncident;
  },
  vars: Record<string, string | number>
): Promise<void> {
  if (action.type === "notificacao_sistema") {
    const titulo = interpolateTemplate(action.titulo, vars);
    const mensagem = interpolateTemplate(action.mensagem, vars);
    await maybeNotify(
      params.schoolId,
      params.incident,
      titulo,
      mensagem,
      action.notifyEveryHours ?? 24
    );
    return;
  }

  if (action.type === "finance_audit") {
    await logFinanceAuditEvent({
      schoolId: params.schoolId,
      eventType: action.eventType,
      source: "cron",
      status: "ignored",
      message: interpolateTemplate(action.message, vars),
      referenceId: params.incident.id,
      payload: {
        playbookCode: params.playbookCode,
        dedupeKey: params.incident.dedupeKey,
      },
    });
  }
}
