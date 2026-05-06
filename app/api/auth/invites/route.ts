import { NextRequest, NextResponse } from "next/server";
import { createInviteToken } from "@/lib/auth/invite-token";
import { applyInviteOptionalIntegrations } from "@/lib/admin/apply-invite-integrations";
import { assignSchoolPlan } from "@/lib/admin/assign-school-plan";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email/send-invite-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "FINANCEIRO", "SECRETARIA", "PROFESSOR"] as const;

function formatRoleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "FINANCEIRO":
      return "Financeiro";
    case "SECRETARIA":
      return "Secretaria";
    case "PROFESSOR":
      return "Professor";
    default:
      return "Usuário";
  }
}

function canManageInvites(role: string) {
  return role === "SUPER_ADMIN";
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !canManageInvites(currentUser.role)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const convites = await prisma.userInvite.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        schoolId: true,
        expiresAt: true,
        createdAt: true,
        school: { select: { nome: true, slug: true } },
      },
    });

    return NextResponse.json(convites);
  } catch (error) {
    console.error("Erro ao listar convites:", error);
    return NextResponse.json({ error: "Erro ao listar convites." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);

    if (!currentUser || !canManageInvites(currentUser.role)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await request.json();

    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "").trim().toUpperCase();
    const resolvedSchoolId = String(body?.schoolId ?? "").trim();
    const planId = String(body?.planId ?? "").trim();

    if (!planId) {
      return NextResponse.json(
        {
          error:
            "Selecione o plano do contrato antes de enviar o convite. Ele é aplicado na escola antes do link ser gerado.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "O e-mail é obrigatório." }, { status: 400 });
    }

    if (!resolvedSchoolId) {
      return NextResponse.json({ error: "A escola (schoolId) é obrigatória." }, { status: 400 });
    }

    const school = await prisma.school.findFirst({
      where: { id: resolvedSchoolId, ativo: true },
      select: { id: true },
    });

    if (!school) {
      return NextResponse.json({ error: "Escola não encontrada ou inativa." }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser?.ativo) {
      return NextResponse.json(
        { error: "Já existe um usuário ativo com esse e-mail." },
        { status: 400 }
      );
    }

    try {
      await assignSchoolPlan(resolvedSchoolId, planId);
    } catch (e) {
      const status = (e as { status?: number })?.status ?? 500;
      const msg = e instanceof Error ? e.message : "Não foi possível aplicar o plano.";
      return NextResponse.json({ error: msg }, { status: status === 404 ? 404 : 400 });
    }

    const aiLimRaw = body?.aiMonthlyLimitOverride;
    let aiMonthlyLimitOverride: number | undefined;
    if (aiLimRaw !== undefined && aiLimRaw !== null && String(aiLimRaw).trim() !== "") {
      const n = Number(String(aiLimRaw).replace(",", "."));
      if (Number.isFinite(n) && n > 0) aiMonthlyLimitOverride = Math.floor(n);
    }

    await applyInviteOptionalIntegrations(resolvedSchoolId, {
      asaasApiKey: typeof body?.asaasApiKey === "string" ? body.asaasApiKey : undefined,
      asaasWalletId: typeof body?.asaasWalletId === "string" ? body.asaasWalletId : undefined,
      openaiApiKey: typeof body?.openaiApiKey === "string" ? body.openaiApiKey : undefined,
      aiMonthlyLimitOverride,
      billingProvider: typeof body?.billingProvider === "string" ? body.billingProvider : undefined,
      twilioAccountSid: typeof body?.twilioAccountSid === "string" ? body.twilioAccountSid : undefined,
      twilioAuthToken: typeof body?.twilioAuthToken === "string" ? body.twilioAuthToken : undefined,
      twilioWhatsAppFrom:
        typeof body?.twilioWhatsAppFrom === "string" ? body.twilioWhatsAppFrom : undefined,
    });

    const { token, tokenHash } = createInviteToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await prisma.userInvite.create({
      data: {
        email,
        schoolId: resolvedSchoolId,
        role: role as "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR",
        tokenHash,
        expiresAt,
      },
    });

    const inviteLink = `${request.nextUrl.origin}/ativar-conta/${token}`;

    await sendInviteEmail({
      to: email,
      inviteLink,
      roleLabel: formatRoleLabel(role),
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      inviteLink,
      expiresAt,
      emailSent: true,
    });
  } catch (error) {
    console.error("Erro ao criar convite:", error);

    return NextResponse.json({ error: "Não foi possível criar o convite." }, { status: 500 });
  }
}
