import { generateMonthlyPayments } from "@/lib/ai/actions/generate-monthly-payments";

type GenerateMonthlyPaymentsToolArgs = {
  confirmed?: boolean;
};

export async function generateMonthlyPaymentsTool(
  args: GenerateMonthlyPaymentsToolArgs
) {
  return generateMonthlyPayments(!!args.confirmed);
}