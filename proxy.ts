import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/configuracoes/escola/public",
  "/api/webhooks/asaas",
  "/api/cron/cobrancas-atrasadas",
];

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FINANCEIRO"
  | "SECRETARIA"
  | "PROFESSOR";

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/ativar-conta/")
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

function hasAccessByRole(pathname: string, role: UserRole) {
  if (role === "SUPER_ADMIN") return true;

  if (pathname.startsWith("/configuracoes")) {
    return false;
  }

  if (
    pathname.startsWith("/financeiro") ||
    pathname.startsWith("/relatorios")
  ) {
    return role === "FINANCEIRO";
  }

  if (pathname.startsWith("/calendario")) {
    return role === "SECRETARIA" || role === "PROFESSOR";
  }

  if (
    pathname.startsWith("/alunos") ||
    pathname.startsWith("/cursos") ||
    pathname.startsWith("/turmas") ||
    pathname.startsWith("/professores")
  ) {
    return role === "SECRETARIA";
  }

  return true;
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
    console.log("SESSION ROLE:", session.role);
    console.log("PATH:", pathname);

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
