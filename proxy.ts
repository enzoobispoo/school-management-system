import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login", "/redefinir-senha", "/cadastro"];
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

// Rotas exclusivas de SUPER_ADMIN
const SUPER_ADMIN_ONLY = [
  "/api/users",
  "/api/settings/ia",
  "/api/settings/financeiro",
  "/api/configuracoes/ia",
  "/configuracoes/usuarios",
];

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
  "/api/notificacoes",
  "/api/search",
  "/api/settings/escola",
  "/api/settings/aparencia",
  "/api/settings/me",
  "/api/settings/notificacoes",
  "/api/settings/escola-ia",
  "/api/ai",
  "/api/calendario",
  "/api/eventos",
  "/calendario",
  "/configuracoes/aparencia",
  "/configuracoes/conta",
  "/configuracoes/notificacoes",
  "/configuracoes/ia",
  "/admin",
  "/api/admin",
  "/",
];

function hasAccessByRole(pathname: string, role: UserRole) {
  if (role === "SUPER_ADMIN") return true;

  if (
    role === "ADMIN" &&
    pathname.startsWith("/configuracoes/usuarios/convites")
  ) {
    return true;
  }

  if (SUPER_ADMIN_ONLY.some((p) => pathname.startsWith(p))) return false;

  if (role === "ADMIN") return true;

  if (SHARED_ROUTES.some((p) => pathname === p || pathname.startsWith(p))) {
    return true;
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
    return (
      pathname.startsWith("/api/professores") ||
      pathname.startsWith("/professores")
    );
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (isPublicPath(pathname)) {
    if (!token || pathname.startsWith("/ativar-conta/")) {
      return NextResponse.next();
    }

    try {
      await verifyAuthToken(token);
      return NextResponse.redirect(new URL("/", request.url));
    } catch {
      return NextResponse.next();
    }
  }

  // Redirect SUPER_ADMIN away from school dashboard to /admin
  if (pathname === "/" && token) {
    try {
      const session = await verifyAuthToken(token);
      if (session.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } catch {
      // ignore
    }
  }

  if (isPublicApi(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const session = await verifyAuthToken(token);
    const role = session.role as UserRole;

    if (!hasAccessByRole(pathname, role)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      }

      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
