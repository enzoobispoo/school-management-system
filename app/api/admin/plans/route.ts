import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { preco: "asc" },
      include: { _count: { select: { subscriptions: { where: { status: "ATIVA" } } } } },
    });

    return NextResponse.json(
      plans.map((p) => ({
        ...p,
        preco: Number(p.preco),
        assinantesAtivos: p._count.subscriptions,
      }))
    );
  } catch (e) {
    console.error("GET /api/admin/plans:", e);
    return NextResponse.json({ error: "Erro ao listar planos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
  }

  const body = await request.json();
  const { nome, preco, descricao, limiteAlunos, limiteTurmas, limiteUsuarios } = body;

  if (!nome?.trim()) return NextResponse.json({ error: "Nome obrigatório." }, { status: 400 });
  if (!preco || Number(preco) <= 0) return NextResponse.json({ error: "Preço inválido." }, { status: 400 });

  const plan = await prisma.plan.create({
    data: {
      nome: nome.trim(),
      slug: slugify(nome.trim()),
      preco: Number(preco),
      descricao: descricao?.trim() || null,
      limiteAlunos: limiteAlunos ? Number(limiteAlunos) : null,
      limiteTurmas: limiteTurmas ? Number(limiteTurmas) : null,
      limiteUsuarios: limiteUsuarios ? Number(limiteUsuarios) : null,
    },
  });

  return NextResponse.json({ ...plan, preco: Number(plan.preco) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
  }

  const body = await request.json();
  const { id, nome, preco, descricao, limiteAlunos, limiteTurmas, limiteUsuarios, ativo } = body;
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      ...(nome ? { nome: nome.trim(), slug: slugify(nome.trim()) } : {}),
      ...(preco !== undefined ? { preco: Number(preco) } : {}),
      ...(descricao !== undefined ? { descricao: descricao?.trim() || null } : {}),
      ...(limiteAlunos !== undefined ? { limiteAlunos: limiteAlunos ? Number(limiteAlunos) : null } : {}),
      ...(limiteTurmas !== undefined ? { limiteTurmas: limiteTurmas ? Number(limiteTurmas) : null } : {}),
      ...(limiteUsuarios !== undefined ? { limiteUsuarios: limiteUsuarios ? Number(limiteUsuarios) : null } : {}),
      ...(typeof ativo === "boolean" ? { ativo } : {}),
    },
  });

  return NextResponse.json({ ...plan, preco: Number(plan.preco) });
}
