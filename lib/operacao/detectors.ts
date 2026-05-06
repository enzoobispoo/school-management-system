import type { IncidentSeverity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { IncidentDetectionResult } from "@/lib/operacao/types";

function moneyPtBR(v: number) {
  return v.toFixed(2).replace(".", ",");
}

export type DetectorFn = (
  schoolId: string
) => Promise<IncidentDetectionResult | null>;

/** Pagamentos com status ATRASADO no financeiro. */
async function finOverdueSummary(
  schoolId: string
): Promise<IncidentDetectionResult | null> {
  const count = await prisma.pagamento.count({
    where: { schoolId, status: "ATRASADO" },
  });
  if (count === 0) return null;

  const agg = await prisma.pagamento.aggregate({
    where: { schoolId, status: "ATRASADO" },
    _sum: { valor: true },
  });
  const total = agg._sum.valor ? Number(agg._sum.valor) : 0;
  const sample = await prisma.pagamento.findMany({
    where: { schoolId, status: "ATRASADO" },
    select: {
      id: true,
      descricao: true,
      vencimento: true,
      valor: true,
      matricula: {
        select: {
          aluno: { select: { nome: true } },
        },
      },
    },
    orderBy: { vencimento: "asc" },
    take: 8,
  });

  const severity: IncidentSeverity =
    count >= 40 ? "CRITICAL" : count >= 15 ? "WARNING" : "INFO";

  return {
    dedupeKey: "FIN_OVERDUE_SUMMARY",
    category: "FINANCE",
    severity,
    title: `${count} pagamento${count === 1 ? "" : "s"} em atraso`,
    description: `Somatório em aberto (atrasados): R$ ${moneyPtBR(total)}. Isso impacta fluxo de caixa e pode gerar inadimplência acumulada.`,
    problemStatement:
      "Existem cobranças vencidas ainda não quitadas; famílias podem não ter sido contactadas ou o método de cobrança pode estar falhando.",
    suggestedActions: [
      "Abrir o Financeiro e filtrar por status \"atrasado\".",
      "Conferir se lembretes automáticos e rotinas de cobrança estão ativos.",
      "Para casos críticos, priorizar contato ou acordo antes de políticas mais duras.",
    ],
    impactHint: `R$ ${moneyPtBR(total)} em risco de recebimento`,
    contextJson: {
      count,
      totalValor: total,
      amostraPagamentos: sample.map((p) => ({
        id: p.id,
        descricao: p.descricao,
        aluno: p.matricula?.aluno?.nome ?? null,
        vencimento: p.vencimento.toISOString(),
        valor: Number(p.valor),
      })),
    },
  };
}

/** Turmas com capacidade máxima atingida ou excedida. */
async function acadTurmasOverCapacity(
  schoolId: string
): Promise<IncidentDetectionResult | null> {
  const turmas = await prisma.turma.findMany({
    where: { schoolId, ativo: true },
    select: {
      id: true,
      nome: true,
      capacidadeMaxima: true,
      curso: { select: { nome: true } },
      matriculas: {
        where: { status: "ATIVA" },
        select: { id: true },
      },
    },
  });

  const lotadas = turmas.filter(
    (t) =>
      t.capacidadeMaxima > 0 &&
      t.matriculas.length >= t.capacidadeMaxima
  );

  if (lotadas.length === 0) return null;

  const severity: IncidentSeverity =
    lotadas.length >= 8 ? "WARNING" : "INFO";

  return {
    dedupeKey: "ACAD_TURMAS_LOTADAS",
    category: "ACADEMIC",
    severity,
    title: `${lotadas.length} turma${lotadas.length === 1 ? "" : "s"} lotadas`,
    description:
      "Turmas ativas atingiram (ou excederam regra de) capacidade máxima. Novas matrículas podem ficar bloqueadas ou gerar conflito operacional.",
    problemStatement:
      "Capacidade física/pedagógica pode estar no limite; é preciso abrir nova turma ou redistribuir vagas.",
    suggestedActions: [
      "Revisar ocupação em Turmas (filtro \"Lotadas\").",
      "Planejar nova turma ou lista de espera.",
      "Validar se capacidade cadastrada reflete a realidade da sala.",
    ],
    impactHint: `${lotadas.length} turmas no limite`,
    contextJson: {
      turmas: lotadas.map((t) => ({
        id: t.id,
        nome: t.nome,
        curso: t.curso.nome,
        ocupadas: t.matriculas.length,
        capacidade: t.capacidadeMaxima,
      })),
    },
  };
}

/** Alunos marcados ATIVO sem matrícula ATIVA vinculada. */
async function enrollActiveWithoutMatricula(
  schoolId: string
): Promise<IncidentDetectionResult | null> {
  const total = await prisma.aluno.count({
    where: {
      schoolId,
      status: "ATIVO",
      matriculas: { none: { status: "ATIVA" } },
    },
  });

  if (total === 0) return null;

  const sample = await prisma.aluno.findMany({
    where: {
      schoolId,
      status: "ATIVO",
      matriculas: { none: { status: "ATIVA" } },
    },
    select: { id: true, nome: true, email: true },
    take: 15,
  });

  const severity: IncidentSeverity =
    total >= 25 ? "CRITICAL" : total >= 8 ? "WARNING" : "INFO";

  return {
    dedupeKey: "ENROLL_ATIVO_SEM_MATRICULA",
    category: "ENROLLMENT",
    severity,
    title: `${total} aluno${total === 1 ? "" : "s"} ativo${total === 1 ? "" : "s"} sem matrícula ativa`,
    description:
      "Cadastro indica aluno ativo, mas não há matrícula ATIVA — inconsistência entre secretaria e sala de aula.",
    problemStatement:
      "Pode haver matrícula não lançada, turma errada ou status do aluno desatualizado.",
    suggestedActions: [
      "Abrir o perfil de cada aluno listado e regularizar matrícula.",
      "Se for egresso/inativo, atualizar status do aluno.",
      "Confirmar rematrícula pendente.",
    ],
    impactHint: `${total} registros inconsistentes`,
    contextJson: {
      count: total,
      amostra: sample.map((a) => ({
        id: a.id,
        nome: a.nome,
        email: a.email,
      })),
    },
  };
}

/** Falhas registradas em auditoria financeira (rotinas / integrações). */
async function sysFinanceAuditFailures(
  schoolId: string
): Promise<IncidentDetectionResult | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const fails = await prisma.financeAuditEvent.findMany({
    where: {
      schoolId,
      status: "failed",
      createdAt: { gte: since },
    },
    select: {
      id: true,
      eventType: true,
      message: true,
      createdAt: true,
      source: true,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  if (fails.length === 0) return null;

  return {
    dedupeKey: "SYS_FINANCE_AUDIT_FAILURES_24H",
    category: "SYSTEM",
    severity: fails.length >= 10 ? "CRITICAL" : "WARNING",
    title: `${fails.length} falha${fails.length === 1 ? "" : "s"} em auditoria financeira (24h)`,
    description:
      "Rotinas automáticas ou integrações registraram erro na auditoria financeira. Pode afetar cobrança, webhooks ou jobs.",
    problemStatement:
      "Algo falhou silenciosamente para o usuário final, mas foi registrado — precisa correção antes que inadimplência piore.",
    suggestedActions: [
      "Abrir Relatórios / auditoria financeira ou logs equivalentes.",
      "Conferir CRON_SECRET, webhooks Asaas e filas de cobrança.",
      "Reprocessar rotinas se existir botão ou endpoint seguro.",
    ],
    impactHint: "Últimas 24 horas",
    contextJson: {
      eventos: fails.map((f) => ({
        id: f.id,
        tipo: f.eventType,
        mensagem: f.message,
        fonte: f.source,
        quando: f.createdAt.toISOString(),
      })),
    },
  };
}

export const DETECTOR_REGISTRY: Record<string, DetectorFn> = {
  fin_overdue_summary: finOverdueSummary,
  acad_turmas_over_capacity: acadTurmasOverCapacity,
  enroll_active_without_matricula: enrollActiveWithoutMatricula,
  sys_finance_audit_failures: sysFinanceAuditFailures,
};
