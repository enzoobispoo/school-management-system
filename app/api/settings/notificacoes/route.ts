import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const result = requireSchool(user);
    if (result instanceof NextResponse) return result;
    const { schoolId } = result;

    let settings = await prisma.escolaSettings.findUnique({ where: { schoolId } });
    if (!settings) {
      settings = await prisma.escolaSettings.create({
        data: { id: schoolId, schoolId, nomeEscola: "Minha Escola" },
      });
    }

    return NextResponse.json({
      notificarNovoAluno: settings.notificarNovoAluno,
      notificarPagamento: settings.notificarPagamento,
      notificarAtraso: settings.notificarAtraso,
      enviarLembreteAuto: settings.enviarLembreteAuto,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar notificações." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const result = requireSchool(user);
    if (result instanceof NextResponse) return result;
    const { schoolId } = result;

    const body = await request.json();

    const settings = await prisma.escolaSettings.upsert({
      where: { schoolId },
      update: {
        notificarNovoAluno: body.notificarNovoAluno,
        notificarPagamento: body.notificarPagamento,
        notificarAtraso: body.notificarAtraso,
        enviarLembreteAuto: body.enviarLembreteAuto,
      },
      create: {
        id: schoolId, schoolId, nomeEscola: "Minha Escola",
        notificarNovoAluno: body.notificarNovoAluno,
        notificarPagamento: body.notificarPagamento,
        notificarAtraso: body.notificarAtraso,
        enviarLembreteAuto: body.enviarLembreteAuto,
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Erro ao salvar notificações." }, { status: 500 });
  }
}
