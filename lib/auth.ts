import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/session";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const session = await verifyAuthToken(token);

    if (!session?.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.ativo) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const session = await verifyAuthToken(token);

    if (!session?.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.ativo) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function isAdmin(user: { role: string } | null | undefined) {
  return user?.role === "ADMIN";
}