import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool, isAdmin } from "@/lib/auth";

const patchBodySchema = z.object({
  active: z.boolean(),
});

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (user.role !== "SUPER_ADMIN") {
      const gate = requireSchool(user);
      if (gate instanceof NextResponse) return gate;
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Apenas administradores podem alterar playbooks." },
        { status: 403 }
      );
    }

    const { code } = await context.params;
    const decoded = decodeURIComponent(code).trim();
    if (!decoded) {
      return NextResponse.json({ error: "Código inválido." }, { status: 400 });
    }

    const body = await request.json();
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    const updated = await prisma.operationalPlaybook.update({
      where: { code: decoded },
      data: { active: parsed.data.active },
      select: { id: true, code: true, name: true, active: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar playbook:", error);
    return NextResponse.json(
      { error: "Playbook não encontrado ou erro ao salvar." },
      { status: 404 }
    );
  }
}
