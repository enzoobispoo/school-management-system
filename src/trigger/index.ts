/**
 * Ponto único de registro das tasks Trigger.dev v3 (SDK 4.x).
 *
 * Produção:
 * - Workers executam na infraestrutura Trigger.dev (não na Vercel).
 * - Na Vercel, use apenas `tasks.trigger` via rotas server-side com segredo forte
 *   (`AUTOMATION_INGEST_SECRET` + `TRIGGER_SECRET_KEY`).
 */

import "./tasks/register-all";
