import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    let settings = await prisma.escolaSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.escolaSettings.create({
        data: {
          id: "default",
          nomeEscola: "EduGestão",
        },
      });
    }

    return NextResponse.json({
      notificarNovoAluno: settings.notificarNovoAluno,
      notificarPagamento: settings.notificarPagamento,
      notificarAtraso: settings.notificarAtraso,
      enviarLembreteAuto: settings.enviarLembreteAuto,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar notificações." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();

    const settings = await prisma.escolaSettings.upsert({
      where: { id: "default" },
      update: {
        notificarNovoAluno: body.notificarNovoAluno,
        notificarPagamento: body.notificarPagamento,
        notificarAtraso: body.notificarAtraso,
        enviarLembreteAuto: body.enviarLembreteAuto,
      },
      create: {
        id: "default",
        nomeEscola: "EduGestão",
        notificarNovoAluno: body.notificarNovoAluno,
        notificarPagamento: body.notificarPagamento,
        notificarAtraso: body.notificarAtraso,
        enviarLembreteAuto: body.enviarLembreteAuto,
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar notificações." },
      { status: 500 }
    );
  }
}