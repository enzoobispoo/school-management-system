import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { searchParams } = new URL(request.url);
    const de = searchParams.get("de");
    const ate = searchParams.get("ate");

    const vencimento: any = {};
    if (de) vencimento.gte = new Date(de);
    if (ate) vencimento.lte = new Date(ate + "T23:59:59");

    const pagamentos = await prisma.pagamento.findMany({
      where: {
          schoolId,
        status: { in: ["PENDENTE", "ATRASADO"] },
        ...(Object.keys(vencimento).length ? { vencimento } : {}),
      },
      include: {
        matricula: {
          include: {
            aluno: { select: { id: true, nome: true, email: true, telefone: true } },
            turma: { include: { curso: { select: { nome: true } } } },
          },
        },
      },
      orderBy: { vencimento: "asc" },
    });

    const data = pagamentos.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      valor: Number(p.valor),
      status: p.status,
      vencimento: p.vencimento,
      competenciaMes: p.competenciaMes,
      competenciaAno: p.competenciaAno,
      diasAtraso:
        p.status === "ATRASADO"
          ? Math.floor((Date.now() - new Date(p.vencimento).getTime()) / 86400000)
          : 0,
      aluno: {
        id: p.matricula.aluno.id,
        nome: p.matricula.aluno.nome,
        email: p.matricula.aluno.email,
        telefone: p.matricula.aluno.telefone,
      },
      curso: p.matricula.turma.curso.nome,
      turma: p.matricula.turma.nome,
      matriculaId: p.matriculaId,
    }));

    const totalValor = data.reduce((acc, p) => acc + p.valor, 0);

    return NextResponse.json({
      data,
      meta: {
        total: data.length,
        totalValor,
        totalAtrasados: data.filter((p) => p.status === "ATRASADO").length,
        totalPendentes: data.filter((p) => p.status === "PENDENTE").length,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar inadimplência:", error);
    return NextResponse.json({ error: "Erro ao buscar inadimplência" }, { status: 500 });
  }
}
