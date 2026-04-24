import twilio from "twilio";

function normalizeBrazilPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Telefone inválido.");
  }

  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;

  return `whatsapp:+${withCountryCode}`;
}

export async function sendWhatsAppMessage({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error("Credenciais do Twilio não configuradas.");
  }

  const client = twilio(accountSid, authToken);
  const normalizedTo = normalizeBrazilPhone(to);

  console.log("TWILIO DEBUG", {
    from,
    toOriginal: to,
    toNormalized: normalizedTo,
  });

  const result = await client.messages.create({
    from,
    to: normalizedTo,
    body: message,
  });

  console.log("TWILIO RESULT", {
    sid: result.sid,
    status: result.status,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
  });

  return {
    sid: result.sid,
    status: result.status,
  };
}