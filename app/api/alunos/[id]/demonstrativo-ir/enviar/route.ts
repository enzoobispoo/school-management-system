import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSchool } from "@/lib/auth";
import { demonstrativoIrEnviarSchema } from "@/lib/validations/demonstrativo-ir";
import {
  buildDemonstrativoIrPdfBytes,
  fetchPagamentosDemonstrativoIr,
} from "@/lib/pagamentos/demonstrativo-ir-shared";
import { sendDemonstrativoIrEmail } from "@/lib/email/send-demonstrativo-ir-email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { buildDemonstrativoIrWhatsAppBody } from "@/lib/whatsapp/demonstrativo-ir-message";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { id: alunoId } = await context.params;
    const body = await request.json();
    const parsed = demonstrativoIrEnviarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { anos, sendEmail, sendWhatsApp } = parsed.data;
    if (!sendEmail && !sendWhatsApp) {
      return NextResponse.json(
        { error: "Marque envio por e-mail ou WhatsApp." },
        { status: 400 }
      );
    }

    const anosSorted = [...new Set(anos)].sort((a, b) => a - b);

    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, schoolId },
      select: {
        nome: true,
        responsavelNome: true,
        responsavelEmail: true,
        responsavelTelefone: true,
        email: true,
        telefone: true,
      },
    });

    if (!aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const settings = await prisma.escolaSettings.findUnique({
      where: { schoolId },
      select: { nomeEscola: true },
    });
    const schoolName = settings?.nomeEscola?.trim() || "Escola";

    const emailDest = aluno.responsavelEmail?.trim() || aluno.email?.trim() || null;
    const telDest = aluno.responsavelTelefone?.trim() || aluno.telefone?.trim() || null;
    const destinatarioNome = aluno.responsavelNome?.trim() || aluno.nome;

    const emitidoEm = new Date();
    const resumos: { ano: number; totalPago: number; quantidade: number }[] = [];

    for (const ano of anosSorted) {
      const { totalPago, quantidade } = await fetchPagamentosDemonstrativoIr(
        schoolId,
        alunoId,
        ano
      );
      resumos.push({ ano, totalPago, quantidade });
    }

    const attachments: { filename: string; content: Uint8Array }[] = [];
    if (sendEmail) {
      for (const ano of anosSorted) {
        const safe = `${ano}-${aluno.nome}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w.-]/g, "-")
          .slice(0, 48)
          .toLowerCase();

        const bytes = await buildDemonstrativoIrPdfBytes({
          schoolId,
          alunoId,
          ano,
          emitidoEm,
        });
        attachments.push({
          filename: `demonstrativo-ir-${safe}.pdf`,
          content: bytes,
        });
      }
    }

    let emailSent = false;
    let whatsappSent = false;

    if (sendEmail) {
      if (!emailDest) {
        return NextResponse.json(
          { error: "Aluno/responsável sem e-mail cadastrado para envio." },
          { status: 400 }
        );
      }
      await sendDemonstrativoIrEmail({
        to: emailDest,
        schoolName,
        alunoNome: aluno.nome,
        anosResumo: resumos,
        attachments,
      });
      emailSent = true;
    }

    if (sendWhatsApp) {
      if (!telDest) {
        return NextResponse.json(
          { error: "Aluno/responsável sem telefone cadastrado para WhatsApp." },
          { status: 400 }
        );
      }
      const msg = buildDemonstrativoIrWhatsAppBody({
        destinatarioNome,
        schoolName,
        alunoNome: aluno.nome,
        anos: resumos,
        pdfEnviadosPorEmail: emailSent,
        emailDestino: emailDest,
      });
      await sendWhatsAppMessage({
        to: telDest,
        message: msg,
        schoolId,
      });
      whatsappSent = true;
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      whatsappSent,
    });
  } catch (error) {
    console.error("demonstrativo-ir/enviar:", error);
    const msg =
      error instanceof Error ? error.message : "Erro ao enviar demonstrativo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
