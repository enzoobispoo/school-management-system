import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/session";

export type AuthenticatedUser = {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  schoolId: string | null;
  professorId?: string | null;
  avatarUrl?: string | null;
  openaiApiKey?: string | null;
  plan?: string;
  aiUsage?: number;
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifyAuthToken(token);
    if (!session?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        schoolId: true,
        professorId: true,
        avatarUrl: true,
        openaiApiKey: true,
        plan: true,
        aiUsage: true,
      },
    });

    if (!user || !user.ativo) return null;
    return user as AuthenticatedUser;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifyAuthToken(token);
    if (!session?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        schoolId: true,
        professorId: true,
        avatarUrl: true,
        openaiApiKey: true,
        plan: true,
        aiUsage: true,
      },
    });

    if (!user || !user.ativo) return null;
    return user as AuthenticatedUser;
  } catch {
    return null;
  }
}

/** Returns schoolId or a 401/403 response. Use in API routes. */
export function requireSchool(user: AuthenticatedUser | null): { schoolId: string } | NextResponse {
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.schoolId) return NextResponse.json({ error: "Escola não associada." }, { status: 403 });
  return { schoolId: user.schoolId };
}
