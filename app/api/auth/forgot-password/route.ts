import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) return NextResponse.json({ ok: true });

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, nome: true, email: true, ativo: true },
    });

    if (user && user.ativo) {
      // invalida tokens anteriores do mesmo email
      await prisma.passwordResetToken.deleteMany({ where: { email: user.email } });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await prisma.passwordResetToken.create({
        data: { token, email: user.email, expiresAt },
      });

      const resetLink = `${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/redefinir-senha?token=${token}`;
      const from = process.env.INVITE_FROM_EMAIL;

      if (from && process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from,
          to: user.email,
          subject: "Redefinição de senha",
          html: `
            <div style="font-family:-apple-system,Arial,sans-serif;background:#f7f7f7;padding:32px;">
              <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;padding:40px;border:1px solid rgba(0,0,0,0.06);">
                <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#888;margin:0 0 20px;">Segurança da conta</p>
                <h1 style="font-size:26px;font-weight:700;color:#111;margin:0 0 12px;letter-spacing:-0.03em;">Redefinir sua senha</h1>
                <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 8px;">Olá, ${user.nome}.</p>
                <p style="font-size:15px;line-height:1.7;color:#555;margin:0 0 28px;">
                  Recebemos uma solicitação para redefinir a senha da sua conta. Este link expira em <strong>1 hora</strong>.
                </p>
                <a href="${resetLink}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 24px;border-radius:14px;font-size:15px;font-weight:600;margin-bottom:28px;">
                  Redefinir senha
                </a>
                <p style="font-size:13px;color:#888;margin:0 0 8px;">Se você não solicitou isso, ignore este e-mail.</p>
                <p style="font-size:12px;color:#bbb;word-break:break-all;margin:0;">${resetLink}</p>
              </div>
            </div>
          `,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro forgot-password:", error);
    return NextResponse.json({ ok: true });
  }
}
