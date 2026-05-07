# Operação e fluxos críticos

Este documento resume fluxos que precisam funcionar em produção e variáveis de ambiente relevantes.

## Correlação e logs

- O **`proxy.ts`** na raiz (Next.js 16+) gera ou propaga o header **`x-correlation-id`** nas requisições cobertas pelo matcher — não use `middleware.ts` junto com `proxy.ts`.
- Rotas de cron, webhook e EduIA registram eventos em **uma linha JSON** via `logStructured` — ideal para agregadores (filtre por `correlationId`, `schoolId`, `event`).
- Respostas da EduIA (`POST /api/ai/dashboard`) incluem **`meta.correlationId`** e **`meta.toolsUsed`** para transparência e suporte.

## Fluxo financeiro (mensalidade → cobrança → webhook)

1. **Geração de mensalidades**: jobs internos ou `GENERATE_MONTHLY_PAYMENTS` / serviços em `lib/services/payment-generator.ts` criam registros em `Pagamento`.
2. **Asaas**: cobranças podem ter `billingExternalId`; boletos/Pix ficam nos campos `billing*` do `Pagamento`.
3. **Webhook** `POST /api/webhooks/asaas`: valida `ASAAS_WEBHOOK_TOKEN` (header `asaas-access-token`), atualiza status local e dispara auditoria financeira.
4. **Invalidação de cache**: após atualizar pagamento pelo webhook, é chamado `revalidateTag('school-dashboard-{schoolId}', 'max')` (Next.js 16+) para o snapshot usado pela tool `query_dashboard` (TTL 60s + tag).

Variáveis típicas:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres (Prisma) |
| `ASAAS_WEBHOOK_TOKEN` | Segredo do webhook Asaas |
| `CRON_SECRET` | Bearer nos crons agendados (Vercel Cron) |

## Auth e segurança da conta

- **Reset de senha**: o valor em `PasswordResetToken.token` é **SHA-256 (hex)** do link enviado por e-mail — não armazene o token cru no banco.
- **Rate limiting** (melhor em um único processo; em escala use Redis/Upstash): login, cadastro, recuperação e redefinição de senha aplicam limites em `lib/security/rate-limit.ts`.
- **Dependências**: `package.json` usa **`overrides`** para forçar **`axios` ≥ 1.15.2** (transitivo via Twilio). Rode `npm install` após atualizar o repo.
- Migração **`20260506190000_password_reset_tokens_hashed`**: remove tokens antigos em texto puro antes de produção com hash.

## Crons (Vercel)

Rotinas públicas na borda (`proxy.ts`): `Bearer CRON_SECRET`.

- `/api/cron/recorrencia-mensalidades` — recorrência de mensalidades.
- `/api/cron/cobrancas-atrasadas` — lembretes, retentativas, suspensões conforme políticas.
- `/api/cron/operational-incidents` — detectores operacionais.

## EduIA e auditoria

- Cada turno relevante grava **`AiAuditLog`** (`message`, `intent`, `response`, opcional `schoolId`, `correlationId`, `toolRuns`).
- Modo OpenAI com tools registra tempos por tool em **`toolRuns`** (JSON).
- Contrato do body do chat: ver **`lib/validations/ai-dashboard.ts`** (Zod).

## Migrações

Após puxar alterações de schema:

```bash
npx prisma migrate deploy
```

Desenvolvimento local:

```bash
npx prisma migrate dev
```

## Testes

```bash
npm run test
```
