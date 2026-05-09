import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/session";
import {
  continueRequestWithCorrelation,
  readCorrelationIdFromRequest,
  withCorrelationHeader,
} from "@/lib/observability/correlation";

const PUBLIC_PATHS = ["/login", "/redefinir-senha", "/cadastro", "/jogo"];
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/register",
  "/api/configuracoes/escola/public",
  "/api/webhooks/asaas",
  "/api/cron/cobrancas-atrasadas",
  "/api/cron/operational-incidents",
  "/api/cron/recorrencia-mensalidades",
  "/api/jogo/join",
  "/api/jogo/state",
  "/api/jogo/responder",
];

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FINANCEIRO"
  | "SECRETARIA"
  | "SECRETARIA_FINANCEIRA"
  | "PROFESSOR";

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?")) ||
    pathname.startsWith("/jogo/") ||
    pathname.startsWith("/ativar-conta/")
  );
}

/** Apenas validação/ativação de convite por token (`/api/auth/invites/:token`), não gestão. */
function isInviteActivationApi(pathname: string): boolean {
  if (!pathname.startsWith("/api/auth/invites/")) return false;
  const rest = pathname.slice("/api/auth/invites/".length);
  if (!rest || rest.includes("/")) return false;
  const reserved = new Set(["reenviar", "cancel"]);
  return !reserved.has(rest);
}

function isPublicApi(pathname: string) {
  return (
    PUBLIC_API_PREFIXES.some((path) => pathname.startsWith(path)) ||
    isInviteActivationApi(pathname)
  );
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public")
  );
}

// Rotas exclusivas de SUPER_ADMIN (não use prefixo `/api/users` — bloquearia `/api/users/me/*`)
const SUPER_ADMIN_ONLY = [
  "/api/settings/ia",
  "/api/settings/financeiro",
  "/api/configuracoes/ia",
  "/configuracoes/usuarios",
];

/** Gestão de usuários da plataforma (/api/users, /api/users/[id]) — não inclui /api/users/me/... */
function isCrossTenantUsersManagementRoute(pathname: string): boolean {
  if (!pathname.startsWith("/api/users")) return false;
  if (
    pathname === "/api/users/me" ||
    pathname.startsWith("/api/users/me/")
  ) {
    return false;
  }
  return true;
}

/** Rotas permitidas ao perfil PROFESSOR: sem dashboard executivo, sem EduIA global, sem busca escolar ampla. */
function professorMayAccess(pathname: string): boolean {
  if (pathname === "/") return false;

  if (
    pathname.startsWith("/api/users/me/dashboard-cards") ||
    pathname.startsWith("/api/users/me/dashboard-insights")
  ) {
    return false;
  }

  const prefixes = [
    "/docente",
    "/api/docente",
    /** EduIA do workspace professor — antes ficava só sob `/api/ai` (gestão) e caía em 403. */
    "/api/ai/docente",
    /** Preferências do dashboard docente (GET todos; PUT só gestão). */
    "/api/settings/docente-dashboard",
    /** Leitura do que está configurado em IA na escola (PUT continua só administradores na rota). */
    "/api/settings/escola-ia",
    /** Página “Integrações / IA” para o professor consultar plano e limites. */
    "/configuracoes/ia",
    "/professores",
    "/api/professores",
    "/notificacoes",
    "/api/notificacoes",
    "/calendario",
    "/api/calendario",
    "/api/eventos",
    "/api/schools",
    "/api/navigation/sidebar-badges",
    "/api/settings/me",
    "/api/settings/aparencia",
    "/api/settings/notificacoes",
    "/api/users/me",
    "/api/auth/me",
    "/configuracoes/conta",
    "/configuracoes/aparencia",
    "/configuracoes/notificacoes",
    "/mensagens",
    "/api/school-chat",
  ];

  if (
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return true;
  }

  return pathname === "/configuracoes";
}

/** FINANCEIRO: cobrança, relatórios de receita e conta — sem dashboard executivo, EduIA global nem rotas acadêmicas. */
function financeMayAccess(pathname: string): boolean {
  if (pathname === "/financeiro" || pathname.startsWith("/financeiro/"))
    return true;
  if (pathname === "/relatorios" || pathname.startsWith("/relatorios/"))
    return true;
  if (pathname === "/notificacoes" || pathname.startsWith("/notificacoes/"))
    return true;
  if (pathname === "/mensagens" || pathname.startsWith("/mensagens/"))
    return true;
  if (pathname === "/perfil" || pathname.startsWith("/perfil/")) return true;

  if (pathname === "/configuracoes") return true;

  const configFinanceSafe = [
    "/configuracoes/conta",
    "/configuracoes/aparencia",
    "/configuracoes/notificacoes",
  ];
  if (
    configFinanceSafe.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  ) {
    return true;
  }

  if (
    pathname.startsWith("/api/alunos/") &&
    pathname.includes("/demonstrativo-ir")
  ) {
    return true;
  }

  const apiPrefixes = [
    "/api/auth/me",
    "/api/auth/logout",
    "/api/users/me",
    "/api/pagamentos",
    "/api/financeiro/",
    "/api/ai/dashboard",
    "/api/search",
    "/api/relatorios",
    "/api/notificacoes",
    "/api/school-chat",
    "/api/navigation/sidebar-badges",
    "/api/settings/me",
    "/api/settings/aparencia",
    "/api/settings/notificacoes",
    "/api/settings/escola",
    "/api/cobrancas/",
    "/api/schools",
  ];

  return apiPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p)
  );
}

function hasAccessByRole(pathname: string, role: UserRole) {
  if (role === "SUPER_ADMIN") return true;

  if (
    role === "ADMIN" &&
    pathname.startsWith("/configuracoes/usuarios/convites")
  ) {
    return true;
  }

  if (isCrossTenantUsersManagementRoute(pathname)) return false;

  if (SUPER_ADMIN_ONLY.some((p) => pathname.startsWith(p))) return false;

  if (role === "FINANCEIRO") {
    return financeMayAccess(pathname);
  }

  if (
    role === "ADMIN" ||
    role === "SECRETARIA" ||
    role === "SECRETARIA_FINANCEIRA"
  ) {
    return true;
  }

  if (role === "PROFESSOR") {
    return professorMayAccess(pathname);
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const correlationId = readCorrelationIdFromRequest(request);

  if (isStaticAsset(pathname)) {
    return continueRequestWithCorrelation(request, correlationId);
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (isPublicPath(pathname)) {
    if (!token || pathname.startsWith("/ativar-conta/")) {
      return continueRequestWithCorrelation(request, correlationId);
    }

    try {
      await verifyAuthToken(token);
      return withCorrelationHeader(
        NextResponse.redirect(new URL("/", request.url)),
        correlationId
      );
    } catch {
      return continueRequestWithCorrelation(request, correlationId);
    }
  }

  // SUPER_ADMIN → /admin; PROFESSOR → painel docente (sem dashboard executivo)
  if (pathname === "/" && token) {
    try {
      const session = await verifyAuthToken(token);
      if (session.role === "SUPER_ADMIN") {
        return withCorrelationHeader(
          NextResponse.redirect(new URL("/admin", request.url)),
          correlationId
        );
      }
      if (session.role === "PROFESSOR") {
        return withCorrelationHeader(
          NextResponse.redirect(new URL("/docente", request.url)),
          correlationId
        );
      }
      if (session.role === "FINANCEIRO") {
        return withCorrelationHeader(
          NextResponse.redirect(new URL("/financeiro", request.url)),
          correlationId
        );
      }
      if (
        session.role === "SECRETARIA" ||
        session.role === "SECRETARIA_FINANCEIRA"
      ) {
        return withCorrelationHeader(
          NextResponse.redirect(new URL("/secretaria", request.url)),
          correlationId
        );
      }
    } catch {
      // ignore
    }
  }

  if (isPublicApi(pathname)) {
    return continueRequestWithCorrelation(request, correlationId);
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return withCorrelationHeader(
        NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
        correlationId
      );
    }

    return withCorrelationHeader(
      NextResponse.redirect(new URL("/login", request.url)),
      correlationId
    );
  }

  try {
    const session = await verifyAuthToken(token);
    const role = session.role as UserRole;

    if (role === "FINANCEIRO" && pathname === "/eduia") {
      return withCorrelationHeader(
        NextResponse.redirect(new URL("/financeiro/eduia", request.url)),
        correlationId
      );
    }

    if (!hasAccessByRole(pathname, role)) {
      if (pathname.startsWith("/api/")) {
        return withCorrelationHeader(
          NextResponse.json(
            {
              error:
                role === "PROFESSOR"
                  ? "Este recurso faz parte do painel da gestão. No seu perfil, use Docente, Mensagens, Calendário e o assistente EduIA ao lado."
                  : role === "FINANCEIRO"
                    ? "Este recurso não faz parte do seu painel financeiro."
                    : "Esta funcionalidade não está disponível para o seu perfil neste momento.",
              code: "ROUTE_NOT_AVAILABLE_FOR_ROLE",
            },
            { status: 403 }
          ),
          correlationId
        );
      }

      const fallback =
        role === "PROFESSOR" ? "/docente"
        : role === "FINANCEIRO" ? "/financeiro"
        : "/";
      return withCorrelationHeader(
        NextResponse.redirect(new URL(fallback, request.url)),
        correlationId
      );
    }

    return continueRequestWithCorrelation(request, correlationId);
  } catch {
    if (pathname.startsWith("/api/")) {
      return withCorrelationHeader(
        NextResponse.json({ error: "Sessão inválida." }, { status: 401 }),
        correlationId
      );
    }

    return withCorrelationHeader(
      NextResponse.redirect(new URL("/login", request.url)),
      correlationId
    );
  }
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
