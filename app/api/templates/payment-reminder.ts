export function buildPaymentReminderMessage({
    name,
    amount,
    competence,
  }: {
    name: string;
    amount: number;
    competence: string;
  }) {
    return `Olá ${name}! 👋
  
  Identificamos um pagamento em aberto:
  
  💰 Valor: R$ ${amount.toFixed(2)}
  📅 Referente a: ${competence}
  
  Se já realizou o pagamento, desconsidere. Caso precise, estamos à disposição 🙂`;
  }