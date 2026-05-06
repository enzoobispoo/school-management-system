import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_OPERATIONAL_PLAYBOOKS } from "@/lib/operacao/playbooks-default";
import { DETECTOR_REGISTRY } from "@/lib/operacao/detectors";
import type { PlaybookDefinitionV1 } from "@/lib/operacao/types";
import { runPlaybookActions } from "@/lib/operacao/action-runner";

function parseDefinition(raw: unknown): PlaybookDefinitionV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as PlaybookDefinitionV1;
  if (o.version !== 1 || !o.detect?.handler) return null;
  return o;
}

export async function ensureDefaultOperationalPlaybooks(): Promise<void> {
  for (const row of DEFAULT_OPERATIONAL_PLAYBOOKS) {
    await prisma.operationalPlaybook.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        name: row.name,
        active: true,
        definitionJson: row.definition as unknown as Prisma.InputJsonValue,
      },
      update: {
        name: row.name,
        active: true,
        definitionJson: row.definition as unknown as Prisma.InputJsonValue,
      },
    });
  }
}

export interface PlaybookEvaluationSummary {
  playbookCode: string;
  status: string;
  message?: string;
}

export async function evaluateOperationalIncidentsForSchool(
  schoolId: string
): Promise<PlaybookEvaluationSummary[]> {
  await ensureDefaultOperationalPlaybooks();

  const playbooks = await prisma.operationalPlaybook.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
  });

  const summaries: PlaybookEvaluationSummary[] = [];

  for (const pb of playbooks) {
    const def = parseDefinition(pb.definitionJson);
    if (!def) {
      await prisma.operationalPlaybookRun.create({
        data: {
          schoolId,
          playbookId: pb.id,
          playbookCode: pb.code,
          status: "failed",
          message: "definitionJson inválido ou versão não suportada.",
        },
      });
      summaries.push({
        playbookCode: pb.code,
        status: "failed",
        message: "definitionJson inválido",
      });
      continue;
    }

    try {
      const handler = DETECTOR_REGISTRY[def.detect.handler];
      if (!handler) {
        await prisma.operationalPlaybookRun.create({
          data: {
            schoolId,
            playbookId: pb.id,
            playbookCode: pb.code,
            status: "failed",
            message: `Detector não registrado: ${def.detect.handler}`,
          },
        });
        summaries.push({
          playbookCode: pb.code,
          status: "failed",
          message: "Detector não registrado",
        });
        continue;
      }

      const candidate = await handler(schoolId);

      if (!candidate) {
        const resolved = await prisma.operationalIncident.updateMany({
          where: {
            schoolId,
            playbookCode: pb.code,
            status: { in: ["OPEN", "ACKNOWLEDGED"] },
          },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
          },
        });

        await prisma.operationalPlaybookRun.create({
          data: {
            schoolId,
            playbookId: pb.id,
            playbookCode: pb.code,
            status: "success",
            message:
              resolved.count > 0
                ? `Situação normalizada; ${resolved.count} incidente(s) encerrado(s) automaticamente.`
                : "Nenhum problema detectado.",
            detailJson: { autoResolved: resolved.count },
          },
        });
        summaries.push({ playbookCode: pb.code, status: "success" });
        continue;
      }

      const existing = await prisma.operationalIncident.findUnique({
        where: {
          schoolId_dedupeKey: {
            schoolId,
            dedupeKey: candidate.dedupeKey,
          },
        },
      });

      if (existing?.status === "DISMISSED") {
        await prisma.operationalPlaybookRun.create({
          data: {
            schoolId,
            playbookId: pb.id,
            playbookCode: pb.code,
            status: "ignored",
            message:
              "Incidente dispensado pela equipe; não reabrir automaticamente.",
            detailJson: { dedupeKey: candidate.dedupeKey },
          },
        });
        summaries.push({
          playbookCode: pb.code,
          status: "ignored",
          message: "Dispensado",
        });
        continue;
      }

      const reopened = existing?.status === "RESOLVED";
      const created = !existing;
      let nextStatus = existing?.status ?? "OPEN";
      if (reopened) nextStatus = "OPEN";

      const incident = await prisma.operationalIncident.upsert({
        where: {
          schoolId_dedupeKey: {
            schoolId,
            dedupeKey: candidate.dedupeKey,
          },
        },
        create: {
          schoolId,
          playbookCode: pb.code,
          dedupeKey: candidate.dedupeKey,
          category: candidate.category,
          severity: candidate.severity,
          status: "OPEN",
          title: candidate.title,
          description: candidate.description,
          problemStatement: candidate.problemStatement,
          suggestedActions: candidate.suggestedActions,
          impactHint: candidate.impactHint ?? null,
          contextJson:
            (candidate.contextJson ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          lastDetectedAt: new Date(),
        },
        update: {
          playbookCode: pb.code,
          category: candidate.category,
          severity: candidate.severity,
          title: candidate.title,
          description: candidate.description,
          problemStatement: candidate.problemStatement,
          suggestedActions: candidate.suggestedActions,
          impactHint: candidate.impactHint ?? null,
          contextJson:
            (candidate.contextJson ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          lastDetectedAt: new Date(),
          status: nextStatus,
          ...(reopened
            ? { resolvedAt: null, resolvedById: null }
            : {}),
        },
      });

      await runPlaybookActions({
        schoolId,
        playbookCode: pb.code,
        definition: def,
        incident,
      });

      await prisma.operationalPlaybookRun.create({
        data: {
          schoolId,
          playbookId: pb.id,
          playbookCode: pb.code,
          status: "success",
          message: created
            ? "Incidente criado."
            : reopened
              ? "Incidente reaberto."
              : "Incidente atualizado.",
          detailJson: {
            dedupeKey: candidate.dedupeKey,
            created,
            reopened,
          },
        },
      });

      summaries.push({ playbookCode: pb.code, status: "success" });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erro ao avaliar playbook.";
      await prisma.operationalPlaybookRun.create({
        data: {
          schoolId,
          playbookId: pb.id,
          playbookCode: pb.code,
          status: "failed",
          message: msg,
        },
      });
      summaries.push({
        playbookCode: pb.code,
        status: "failed",
        message: msg,
      });
    }
  }

  return summaries;
}

export async function evaluateOperationalIncidentsAllSchools(): Promise<
  { schoolId: string; nome: string; summaries: PlaybookEvaluationSummary[] }[]
> {
  await ensureDefaultOperationalPlaybooks();
  const schools = await prisma.school.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
  });

  const out: {
    schoolId: string;
    nome: string;
    summaries: PlaybookEvaluationSummary[];
  }[] = [];

  for (const s of schools) {
    const summaries = await evaluateOperationalIncidentsForSchool(s.id);
    out.push({ schoolId: s.id, nome: s.nome, summaries });
  }

  return out;
}
