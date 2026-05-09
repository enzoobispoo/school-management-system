import { NextResponse } from "next/server";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";

/** Liberação de mensalidades, lançamentos e baixa no sistema contábil interno. */
const CORE_FINANCE_WRITE = new Set(["ADMIN", "SUPER_ADMIN", "FINANCEIRO"]);

const FINANCE_READ = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "FINANCEIRO",
  "SECRETARIA",
  "SECRETARIA_FINANCEIRA",
]);

const ENROLLMENT_READ = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "SECRETARIA",
  "SECRETARIA_FINANCEIRA",
  "FINANCEIRO",
]);

const ENROLLMENT_WRITE = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "SECRETARIA",
  "SECRETARIA_FINANCEIRA",
]);

/** Lembrete (WhatsApp etc.) sem alterar pagamento no ledger. */
const BILLING_NOTIFY = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "FINANCEIRO",
  "SECRETARIA",
  "SECRETARIA_FINANCEIRA",
]);

export function roleHasFinanceRead(role: string): boolean {
  return FINANCE_READ.has(role);
}

export function roleHasCoreFinanceWrite(role: string): boolean {
  return CORE_FINANCE_WRITE.has(role);
}

export function roleHasEnrollmentRead(role: string): boolean {
  return ENROLLMENT_READ.has(role);
}

export function roleHasEnrollmentWrite(role: string): boolean {
  return ENROLLMENT_WRITE.has(role);
}

export function roleHasBillingNotify(role: string): boolean {
  return BILLING_NOTIFY.has(role);
}

function forbidden(error: string, code: string) {
  return NextResponse.json({ error, code }, { status: 403 });
}

export function assertFinanceRead(user: AuthenticatedUser): NextResponse | null {
  if (!roleHasFinanceRead(user.role)) {
    return forbidden(
      "Consultar cobranças e pagamentos é restrito à gestão (administração, financeiro ou secretaria).",
      "FORBIDDEN_FINANCE_READ"
    );
  }
  return null;
}

export function assertCoreFinanceWrite(
  user: AuthenticatedUser
): NextResponse | null {
  if (!roleHasCoreFinanceWrite(user.role)) {
    return forbidden(
      "Alterar lançamentos financeiros, gerar boletos ou mensalidades é restrito ao perfil financeiro ou administrador.",
      "FORBIDDEN_FINANCE_WRITE"
    );
  }
  return null;
}

export function assertEnrollmentRead(user: AuthenticatedUser): NextResponse | null {
  if (!roleHasEnrollmentRead(user.role)) {
    return forbidden(
      "Consultar matrículas é restrito à gestão da escola.",
      "FORBIDDEN_ENROLLMENT_READ"
    );
  }
  return null;
}

export function assertEnrollmentWrite(
  user: AuthenticatedUser
): NextResponse | null {
  if (!roleHasEnrollmentWrite(user.role)) {
    return forbidden(
      "Criar, alterar ou excluir matrículas é restrito à secretaria ou administrador.",
      "FORBIDDEN_ENROLLMENT_WRITE"
    );
  }
  return null;
}

export function assertBillingNotify(user: AuthenticatedUser): NextResponse | null {
  if (!roleHasBillingNotify(user.role)) {
    return forbidden(
      "Enviar lembretes de cobrança é restrito à equipe autorizada (financeiro ou secretaria).",
      "FORBIDDEN_BILLING_NOTIFY"
    );
  }
  return null;
}
