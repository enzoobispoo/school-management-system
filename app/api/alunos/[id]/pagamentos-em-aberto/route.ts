import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;
    const { id } = await context.params;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const pagamentos = await prisma.pagamento.findMany({
      where: {
          schoolId,
        matricula: { alunoId: id },
        status: { in: ["PENDENTE", "ATRASADO"] },
        dataPagamento: null,
      },
      include: {
        matricula: {
          include: {
            turma: { include: { curso: true } },
          },
        },
      },
      orderBy: { vencimento: "asc" },
    });

    const data = pagamentos.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      valor: Number(p.valor),
      vencimento: p.vencimento,
      status: new Date(p.vencimento) < hoje ? "ATRASADO" : "PENDENTE",
      competenciaMes: p.competenciaMes,
      competenciaAno: p.competenciaAno,
      matriculaId: p.matriculaId,
      curso: p.matricula.turma.curso.nome,
      turma: p.matricula.turma.nome,
    }));

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("Erro ao buscar pagamentos em aberto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pagamentos em aberto" },
      { status: 500 }
    );
  }
}
