import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { normalizePlanTier, planAllowsCustomTwilio } from "@/lib/school-plan";

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
  schoolId,
}: {
  to: string;
  message: string;
  /** Quando informado, plano Full pode usar Twilio próprio da escola. */
  schoolId?: string | null;
}) {
  let accountSid = process.env.TWILIO_ACCOUNT_SID;
  let authToken = process.env.TWILIO_AUTH_TOKEN;
  let from = process.env.TWILIO_WHATSAPP_FROM;

  if (schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        plano: true,
        escolaSettings: {
          select: {
            twilioAccountSid: true,
            twilioAuthToken: true,
            twilioWhatsAppFrom: true,
          },
        },
      },
    });
    const tier = normalizePlanTier(school?.plano);
    const s = school?.escolaSettings;
    if (
      planAllowsCustomTwilio(tier) &&
      s?.twilioAccountSid?.trim() &&
      s?.twilioAuthToken?.trim() &&
      s?.twilioWhatsAppFrom?.trim()
    ) {
      accountSid = s.twilioAccountSid.trim();
      authToken = s.twilioAuthToken.trim();
      from = s.twilioWhatsAppFrom.trim();
    }
  }

  if (!accountSid || !authToken || !from) {
    throw new Error("Credenciais do Twilio não configuradas.");
  }

  const client = twilio(accountSid, authToken);
  const normalizedTo = normalizeBrazilPhone(to);

  const result = await client.messages.create({
    from,
    to: normalizedTo,
    body: message,
  });

  return {
    sid: result.sid,
    status: result.status,
  };
}
