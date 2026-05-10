/** IDs estáveis das tasks Trigger.dev (espelham `src/trigger/**`). */
export const TRIGGER_TASK_IDS = [
  "whatsapp.payment-reminder",
  "emails.payment-reminder",
  "banking.pluggy-sync-school",
  "ai.finance-insights",
  "reports.finance-year",
  "fiscal.school-invoice-emission",
  "finance.asaas-balance-check",
] as const;

export type TriggerTaskId = (typeof TRIGGER_TASK_IDS)[number];

export function isTriggerTaskId(id: string): id is TriggerTaskId {
  return (TRIGGER_TASK_IDS as readonly string[]).includes(id);
}
