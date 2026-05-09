import { NextRequest, NextResponse } from "next/server";
import { createInviteToken } from "@/lib/auth/invite-token";
import { applyInviteOptionalIntegrations } from "@/lib/admin/apply-invite-integrations";
import { assignSchoolPlan } from "@/lib/admin/assign-school-plan";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email/send-invite-email";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";
import {
  getSchoolInviteQuota,
  getSchoolPlanUserLimit,
  countActiveSchoolUsers,
  countPendingSchoolInvites,
} from "@/lib/school/school-invite-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = [
  "ADMIN",
  "FINANCEIRO",
  "SECRETARIA",
  "SECRETARIA_FINANCEIRA",
  "PROFESSOR",
] as const;

const INVITE_SELECT = {
  id: true,
  email: true,
  role: true,
  schoolId: true,
  expiresAt: true,
  createdAt: true,
  school: { select: { nome: true, slug: true } },
} as const;

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
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export async function GET(_request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(_request);
    if (!currentUser || !canManageInvites(currentUser.role)) {
      return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
    }

    if (currentUser.role === "ADMIN") {
      if (!currentUser.schoolId) {
        return NextResponse.json(
          { error: "Escola não associada ao usuário." },
          { status: 403 }
        );
      }
      const schoolId = currentUser.schoolId;
      const [invites, quota] = await Promise.all([
        prisma.userInvite.findMany({
          where: { schoolId, usedAt: null },
          orderBy: { createdAt: "desc" },
          select: INVITE_SELECT,
        }),
        getSchoolInviteQuota(schoolId),
      ]);
      return NextResponse.json({ invites, quota });
    }

    const invites = await prisma.userInvite.findMany({
      where: { usedAt: null },
      orderBy: { createdAt: "desc" },
      select: INVITE_SELECT,
    });

    return NextResponse.json({ invites, quota: null });
  } catch (error) {
    console.error("Erro ao listar convites:", error);
    return NextResponse.json({ error: "Erro ao listar convites." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);

    if (!currentUser || !canManageInvites(currentUser.role)) {
      return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
    }

    const body = await request.json();

    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "").trim().toUpperCase();

    if (!email) {
      return NextResponse.json({ error: "O e-mail é obrigatório." }, { status: 400 });
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

    if (currentUser.role === "ADMIN") {
      return await handleSchoolAdminInvite(request, {
        currentUser,
        email,
        role: role as
          | "ADMIN"
          | "FINANCEIRO"
          | "SECRETARIA"
          | "SECRETARIA_FINANCEIRA"
          | "PROFESSOR",
      });
    }

    return await handleSuperAdminInvite(request, body, email, role);
  } catch (error) {
    console.error("Erro ao criar convite:", error);

    return NextResponse.json({ error: "Não foi possível criar o convite." }, { status: 500 });
  }
}

async function handleSchoolAdminInvite(
  request: NextRequest,
  opts: {
    currentUser: {
      schoolId: string | null;
      role: string;
    };
    email: string;
    role:
      | "ADMIN"
      | "FINANCEIRO"
      | "SECRETARIA"
      | "SECRETARIA_FINANCEIRA"
      | "PROFESSOR";
  }
) {
  const { currentUser, email, role } = opts;
  const resolvedSchoolId = currentUser.schoolId;

  if (!resolvedSchoolId) {
    return NextResponse.json({ error: "Escola não associada." }, { status: 403 });
  }

  if (role === "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Somente o suporte da plataforma pode convidar outro administrador. Convide financeiro, secretaria ou professor.",
      },
      { status: 403 }
    );
  }

  const school = await prisma.school.findFirst({
    where: { id: resolvedSchoolId, ativo: true },
    select: { id: true },
  });

  if (!school) {
    return NextResponse.json({ error: "Escola não encontrada ou inativa." }, { status: 400 });
  }

  const now = new Date();
  const dupPending = await prisma.userInvite.findFirst({
    where: {
      schoolId: resolvedSchoolId,
      email,
      usedAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true },
  });

  if (dupPending) {
    return NextResponse.json(
      { error: "Já existe um convite pendente para este e-mail nesta escola." },
      { status: 400 }
    );
  }

  const limiteUsuarios = await getSchoolPlanUserLimit(resolvedSchoolId);
  if (limiteUsuarios != null) {
    const [activeUsers, pendingInvites] = await Promise.all([
      countActiveSchoolUsers(resolvedSchoolId),
      countPendingSchoolInvites(resolvedSchoolId),
    ]);
    if (activeUsers + pendingInvites >= limiteUsuarios) {
      return NextResponse.json(
        {
          error: `Limite de usuários do plano atingido (${limiteUsuarios}). Cancele um convite pendente ou peça upgrade.`,
          code: "SCHOOL_USER_LIMIT_REACHED",
        },
        { status: 400 }
      );
    }
  }

  const { token, tokenHash } = createInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.userInvite.create({
    data: {
      email,
      schoolId: resolvedSchoolId,
      role,
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

  const quota = await getSchoolInviteQuota(resolvedSchoolId);

  return NextResponse.json({
    success: true,
    inviteLink,
    expiresAt,
    emailSent: true,
    quota,
  });
}

async function handleSuperAdminInvite(
  request: NextRequest,
  body: Record<string, unknown>,
  email: string,
  role: string
) {
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

  const limiteUsuarios = await getSchoolPlanUserLimit(resolvedSchoolId);
  if (limiteUsuarios != null) {
    const [activeUsers, pendingInvites] = await Promise.all([
      countActiveSchoolUsers(resolvedSchoolId),
      countPendingSchoolInvites(resolvedSchoolId),
    ]);
    if (activeUsers + pendingInvites >= limiteUsuarios) {
      return NextResponse.json(
        {
          error: `Limite de usuários do plano (${limiteUsuarios}) já foi atingido para esta escola.`,
          code: "SCHOOL_USER_LIMIT_REACHED",
        },
        { status: 400 }
      );
    }
  }

  const now = new Date();
  const dupPending = await prisma.userInvite.findFirst({
    where: {
      schoolId: resolvedSchoolId,
      email,
      usedAt: null,
      expiresAt: { gt: now },
    },
    select: { id: true },
  });

  if (dupPending) {
    return NextResponse.json(
      { error: "Já existe um convite pendente para este e-mail nesta escola." },
      { status: 400 }
    );
  }

  const { token, tokenHash } = createInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.userInvite.create({
    data: {
      email,
      schoolId: resolvedSchoolId,
      role: role as
        | "ADMIN"
        | "FINANCEIRO"
        | "SECRETARIA"
        | "SECRETARIA_FINANCEIRA"
        | "PROFESSOR",
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
}
