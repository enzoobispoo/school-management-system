import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function sendDemonstrativoIrEmail({
  to,
  schoolName,
  alunoNome,
  anosResumo,
  attachments,
}: {
  to: string;
  schoolName: string;
  alunoNome: string;
  anosResumo: { ano: number; totalPago: number; quantidade: number }[];
  attachments: { filename: string; content: Uint8Array }[];
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY não configurada.");
  }
  const from = process.env.INVITE_FROM_EMAIL;
  if (!from?.trim()) {
    throw new Error("INVITE_FROM_EMAIL não configurado.");
  }

  const anosLabel = [...anosResumo].sort((a, b) => b.ano - a.ano).map((r) => r.ano).join(", ");
  const linhas = anosResumo
    .sort((a, b) => b.ano - a.ano)
    .map(
      (r) =>
        `<li><strong>${r.ano}</strong>: ${fmtBRL(r.totalPago)} — ${r.quantidade} pagamento(s) com data registrada no ano-calendário.</li>`
    )
    .join("");

  await resend.emails.send({
    from,
    to,
    subject: `Demonstrativo IR (${anosLabel}) — ${alunoNome}`,
    html: `
      <div style="font-family:-apple-system,Arial,sans-serif;background:#f7f7f7;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px;border:1px solid rgba(0,0,0,0.06);">
          <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#888;margin:0 0 12px;">Imposto de Renda</p>
          <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 16px;">Demonstrativo de pagamentos</h1>
          <p style="font-size:14px;line-height:1.7;color:#444;margin:0 0 8px;"><strong>${schoolName}</strong></p>
          <p style="font-size:14px;line-height:1.7;color:#444;margin:0 0 20px;">Aluno: <strong>${alunoNome}</strong></p>
          <p style="font-size:14px;line-height:1.7;color:#444;margin:0 0 12px;">Resumo por ano-calendário (apenas pagamentos quitados com data registrada):</p>
          <ul style="margin:0 0 24px;padding-left:20px;color:#444;font-size:14px;line-height:1.6;">${linhas}</ul>
          <p style="font-size:13px;line-height:1.65;color:#666;margin:0;">
            Os PDFs por ano estão em anexo. Utilize como documento auxiliar à conferência na sua declaração.
            Limites e regras de dedução seguem a legislação vigente.
          </p>
        </div>
      </div>
    `,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content),
    })),
  });
}
