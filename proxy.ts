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
  | "PROFESSOR";

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?")) ||
    pathname.startsWith("/jogo/") ||
    pathname.startsWith("/ativar-conta/")
  );
}

function isPublicApi(pathname: string) {
  return (
    PUBLIC_API_PREFIXES.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/api/auth/invites/")
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

// Rotas que FINANCEIRO pode acessar (além das compartilhadas)
const FINANCEIRO_ROUTES = [
  "/financeiro",
  "/relatorios",
  "/operacao",
  "/api/pagamentos",
  "/api/relatorios",
  "/api/cobrancas",
  "/api/operacao",
];

// Rotas que SECRETARIA pode acessar (além das compartilhadas)
const SECRETARIA_ROUTES = [
  "/alunos",
  "/cursos",
  "/turmas",
  "/professores",
  "/operacao",
  "/api/alunos",
  "/api/cursos",
  "/api/turmas",
  "/api/professores",
  "/api/matriculas",
  "/api/operacao",
];

// Rotas compartilhadas por todos os usuários autenticados
const SHARED_ROUTES = [
  "/api/dashboard",
  "/api/schools",
  "/api/notificacoes",
  "/api/search",
  "/api/settings/escola",
  "/api/settings/aparencia",
  "/api/settings/me",
  "/api/auth/me",
  "/api/users/me",
  "/api/settings/notificacoes",
  "/api/settings/escola-ia",
  "/api/ai",
  "/api/calendario",
  "/api/eventos",
  "/calendario",
  "/docente",
  "/api/docente",
  "/configuracoes/aparencia",
  "/configuracoes/conta",
  "/configuracoes/notificacoes",
  "/configuracoes/ia",
  "/admin",
  "/api/admin",
  "/mensagens",
  "/api/school-chat",
  "/",
];

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

  if (role === "ADMIN") return true;

  if (role !== "PROFESSOR") {
    if (SHARED_ROUTES.some((p) => pathname === p || pathname.startsWith(p))) {
      return true;
    }
  }

  if (role === "FINANCEIRO") {
    return FINANCEIRO_ROUTES.some((p) => pathname.startsWith(p));
  }

  if (role === "SECRETARIA") {
    return (
      SECRETARIA_ROUTES.some((p) => pathname.startsWith(p)) ||
      FINANCEIRO_ROUTES.some((p) => pathname.startsWith(p))
    );
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

    if (!hasAccessByRole(pathname, role)) {
      if (pathname.startsWith("/api/")) {
        return withCorrelationHeader(
          NextResponse.json({ error: "Acesso negado." }, { status: 403 }),
          correlationId
        );
      }

      const fallback =
        role === "PROFESSOR" ? "/docente" : "/";
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
