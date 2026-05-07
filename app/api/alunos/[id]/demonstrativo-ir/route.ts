import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import {
  buildDemonstrativoIrPdfBytes,
  mergePdfBuffers,
  parseAnosQuery,
} from "@/lib/pagamentos/demonstrativo-ir-shared";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { id: alunoId } = await context.params;
    const { searchParams } = new URL(request.url);
    const anosList = parseAnosQuery(searchParams.get("ano"), searchParams.get("anos"));
    if (anosList.length === 0) {
      return NextResponse.json({ error: "Informe ao menos um ano-calendário válido." }, { status: 400 });
    }

    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, schoolId },
      select: { id: true, nome: true },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const emitidoEm = new Date();
    const buffers: Uint8Array[] = [];
    for (const ano of anosList.sort((a, b) => a - b)) {
      buffers.push(
        await buildDemonstrativoIrPdfBytes({ schoolId, alunoId, ano, emitidoEm })
      );
    }

    const merged = await mergePdfBuffers(buffers);

    const safeName = aluno.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .slice(0, 36)
      .replace(/\s+/g, "-")
      .toLowerCase();

    const anosSlug = anosList.sort((a, b) => a - b).join("-");
    const filename = `demonstrativo-ir-${anosSlug}-${safeName || aluno.id.slice(-8)}.pdf`;

    return new NextResponse(Buffer.from(merged), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("demonstrativo-ir:", error);
    return NextResponse.json({ error: "Erro ao gerar demonstrativo" }, { status: 500 });
  }
}
