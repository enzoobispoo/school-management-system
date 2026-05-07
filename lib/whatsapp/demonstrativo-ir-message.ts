function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildDemonstrativoIrWhatsAppBody(opts: {
  destinatarioNome: string;
  schoolName: string;
  alunoNome: string;
  anos: { ano: number; totalPago: number; quantidade: number }[];
  pdfEnviadosPorEmail: boolean;
  emailDestino?: string | null;
}) {
  const sorted = [...opts.anos].sort((a, b) => b.ano - a.ano);
  const linhas = sorted.map(
    (x) =>
      `• ${x.ano}: ${fmtBRL(x.totalPago)} (${x.quantidade} pgto(s) registrado(s) no ano)`
  );

  let extra = "";
  if (opts.pdfEnviadosPorEmail && opts.emailDestino?.trim()) {
    extra = `\n\n📎 Os PDFs foram enviados para o e-mail: ${opts.emailDestino.trim()}`;
  } else {
    extra =
      "\n\n📎 Para baixar os PDFs, acesse o portal da escola ou solicite envio por e-mail.";
  }

  return `Olá, ${opts.destinatarioNome}! 👋

${opts.schoolName}
Demonstrativo IR — ${opts.alunoNome}

${linhas.join("\n")}
${extra}

Documento auxiliar para conferência na declaração.`;
}
