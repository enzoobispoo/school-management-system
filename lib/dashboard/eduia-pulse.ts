import type { DashboardMetricsView } from "@/components/dashboard/metrics/dashboard-metric-card-config";

export type EduiaPulseSeverity = "ok" | "attention" | "critical";

export type EduiaPulse = {
  headline: string;
  severity: EduiaPulseSeverity;
  /** Trechos para chips ou listas curtas */
  hints: string[];
};

function unreadCount(metrics: DashboardMetricsView): number {
  const raw = metrics.notificacoesNaoLidas;
  if (raw === "...") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Resumo executivo instantâneo a partir das mesmas métricas do dashboard (sem LLM). */
export function buildEduiaPulseFromMetrics(metrics: DashboardMetricsView): EduiaPulse {
  const atrasados = metrics.quantidadePagamentosAtrasados ?? 0;
  const pendentes = metrics.quantidadePagamentosPendentes ?? 0;
  const incAbertos = metrics.incidentesOperacionaisAbertos ?? 0;
  const incCrit = metrics.incidentesOperacionaisCriticos ?? 0;
  const notif = unreadCount(metrics);

  const hints: string[] = [];
  if (incCrit > 0) hints.push(`${incCrit} incidente(s) crítico(s)`);
  if (atrasados > 0) hints.push(`${atrasados} pagamento(s) atrasado(s)`);
  if (incAbertos > 0) hints.push(`${incAbertos} incidente(s) em aberto`);
  if (pendentes > 0) hints.push(`${pendentes} pagamento(s) pendente(s)`);
  if (notif > 0) hints.push(`${notif} notificação(ões) não lida(s)`);

  let severity: EduiaPulseSeverity = "ok";
  if (incCrit > 0) severity = "critical";
  else if (hints.length > 0) severity = "attention";

  let headline: string;
  if (hints.length === 0) {
    headline =
      "Indicadores principais estáveis neste painel: sem incidentes críticos abertos, pagamentos em atraso ou alertas pendentes nas contagens agregadas.";
  } else {
    headline = `Situação agora: ${hints.join(" · ")}.`;
  }

  return { headline, severity, hints };
}

/** Pedido curto ao usuário; o modelo já tem instruções no system prompt para usar tools e citar telas. */
export const EDUIA_FULL_BRIEFING_PROMPT =
  "Briefing executivo da escola com os números atuais.";
