import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertFinanceRead, getCurrentUser, requireSchool } from "@/lib/auth";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const denied = assertFinanceRead(user);
    if (denied) return denied;

    const { id } = await context.params;

    const pagamento = await prisma.pagamento.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento não encontrado." },
        { status: 404 }
      );
    }

    const envios = await prisma.cobrancaEnvio.findMany({
      where: {
        pagamentoId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        canal: true,
        tipo: true,
        destino: true,
        status: true,
        provedor: true,
        externalId: true,
        mensagem: true,
        erro: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      data: envios,
    });
  } catch (error) {
    console.error("Erro ao buscar histórico de envios:", error);

    return NextResponse.json(
      { error: "Erro ao buscar histórico de envios." },
      { status: 500 }
    );
  }
}