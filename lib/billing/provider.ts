import { prisma } from "@/lib/prisma";
import { createAsaasBoleto } from "@/lib/billing/providers/asaas";

type BillingProvider = "asaas";

interface CreateBoletoParams {
  studentName: string;
  studentEmail?: string | null;
  studentCpf?: string | null;
  phone?: string | null;
  amount: number;
  dueDate: string;
  description: string;
  externalReference?: string;
  interestPercentage?: number;
  finePercentage?: number;
}

async function getProvider(): Promise<BillingProvider> {
  const school = await prisma.escolaSettings.findUnique({
    where: { id: "default" },
    select: {
      billingProvider: true,
      billingEnabled: true,
    },
  });

  if (!school?.billingEnabled) {
    throw new Error("A cobrança não está ativada.");
  }

  return (school.billingProvider || "asaas") as BillingProvider;
}

export async function createBoleto(params: CreateBoletoParams) {
  const provider = await getProvider();

  switch (provider) {
    case "asaas":
      return createAsaasBoleto({
        customer: {
          name: params.studentName,
          email: params.studentEmail,
          cpfCnpj: params.studentCpf,
          mobilePhone: params.phone,
        },
        value: params.amount,
        dueDate: params.dueDate,
        description: params.description,
        externalReference: params.externalReference,
        interestPercentage: params.interestPercentage,
        finePercentage: params.finePercentage,
      });

    default:
      throw new Error("Provedor de cobrança não suportado.");
  }
}