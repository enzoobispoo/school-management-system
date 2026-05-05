import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const schoolId = request.nextUrl.searchParams.get("schoolId") ?? undefined;

  const users = await prisma.user.findMany({
    where: {
      role: { not: "SUPER_ADMIN" },
      ...(schoolId ? { schoolId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, nome: true, email: true, role: true, ativo: true,
      createdAt: true, lastLoginAt: true,
      school: { select: { id: true, nome: true, slug: true } },
    },
  });

  return NextResponse.json({ data: users, total: users.length });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = await request.json();
  const { id, ativo, role } = body;
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (target?.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Não é possível alterar um Super Admin." }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(typeof ativo === "boolean" ? { ativo } : {}),
      ...(role ? { role } : {}),
    },
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  });

  return NextResponse.json(updated);
}
