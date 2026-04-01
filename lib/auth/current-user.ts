import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/session";

export async function getCurrentUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const session = await verifyAuthToken(token);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        openaiApiKey: true,
        plan: true,
        aiUsage: true,
      },
    });

    if (!user || !user.ativo) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}