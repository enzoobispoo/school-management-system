import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool, isAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (user.role !== "SUPER_ADMIN") {
      const schoolGate = requireSchool(user);
      if (schoolGate instanceof NextResponse) return schoolGate;
    }

    const rows = await prisma.operationalPlaybook.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        active: true,
      },
    });

    return NextResponse.json({
      playbooks: rows,
      canManage: isAdmin(user),
    });
  } catch (error) {
    console.error("Erro ao listar playbooks:", error);
    return NextResponse.json(
      { error: "Erro ao listar playbooks operacionais." },
      { status: 500 }
    );
  }
}
