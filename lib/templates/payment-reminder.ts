export function buildPaymentReminderMessage({
  name,
  amount,
  competence,
  boletoUrl,
}: {
  name: string;
  amount: number;
  competence: string;
  boletoUrl?: string | null;
}) {
  const formattedAmount = amount.toFixed(2).replace(".", ",");

  const baseMessage = `Olá ${name}! 👋

Identificamos um pagamento em aberto:

💰 Valor: R$ ${formattedAmount}
📅 Referente a: ${competence}`;

  if (boletoUrl) {
    return `${baseMessage}

🧾 Link do boleto:
${boletoUrl}

Se o pagamento já foi realizado, desconsidere esta mensagem.
Caso precise de apoio, estamos à disposição.`;
  }

  return `${baseMessage}

Se o pagamento já foi realizado, desconsidere esta mensagem.
Caso precise de apoio, estamos à disposição.`;
}