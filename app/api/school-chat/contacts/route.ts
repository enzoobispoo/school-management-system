import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { isSchoolChatPeerRole } from "@/lib/school-chat/peers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const rows = await prisma.user.findMany({
      where: {
        schoolId,
        ativo: true,
        id: { not: user.id },
        role: { in: ["PROFESSOR", "ADMIN", "SECRETARIA", "FINANCEIRO"] },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { nome: "asc" },
    });

    const data = rows.filter((r) => isSchoolChatPeerRole(r.role));

    return NextResponse.json({ data });
  } catch (e) {
    console.error("GET school-chat/contacts:", e);
    return NextResponse.json({ error: "Erro ao listar contatos." }, { status: 500 });
  }
}
