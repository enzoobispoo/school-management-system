import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInviteEmailParams {
  to: string;
  inviteLink: string;
  roleLabel: string;
  expiresAt: Date;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export async function sendInviteEmail({
  to,
  inviteLink,
  roleLabel,
  expiresAt,
}: SendInviteEmailParams) {
  const from = process.env.INVITE_FROM_EMAIL;

  console.log("🔥 FUNÇÃO DE EMAIL CHAMADA");
  console.log("ENVIANDO EMAIL PARA:", to);
  console.log("FROM:", from);

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  if (!from) {
    throw new Error("INVITE_FROM_EMAIL não configurado.");
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: "Seu acesso ao sistema escolar foi liberado",
      html: `
        <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 32px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid rgba(0,0,0,0.06);">
            <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #666; margin: 0 0 16px;">
              Convite de acesso
            </p>

            <h1 style="font-size: 28px; line-height: 1.2; color: #111; margin: 0 0 16px;">
              Seu acesso ao sistema foi liberado
            </h1>

            <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 12px;">
              Você recebeu um convite para criar seu acesso ao sistema de gestão escolar.
            </p>

            <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 12px;">
              <strong>Perfil:</strong> ${roleLabel}
            </p>

            <p style="font-size: 15px; line-height: 1.7; color: #444; margin: 0 0 24px;">
              Este link expira em <strong>${formatDate(expiresAt)}</strong>.
            </p>

            <a
              href="${inviteLink}"
              style="
                display: inline-block;
                background: #111;
                color: #fff;
                text-decoration: none;
                padding: 14px 22px;
                border-radius: 14px;
                font-size: 15px;
                font-weight: 600;
                margin-bottom: 24px;
              "
            >
              Criar meu acesso
            </a>

            <p style="font-size: 13px; line-height: 1.7; color: #666; margin: 24px 0 8px;">
              Se o botão acima não funcionar, copie e cole este link no navegador:
            </p>

            <p style="font-size: 13px; line-height: 1.7; color: #111; word-break: break-all; margin: 0;">
              ${inviteLink}
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ RESEND RESULT:", result);
    return result;
  } catch (error) {
    console.error("❌ ERRO AO ENVIAR EMAIL:", error);
    throw error;
  }
}