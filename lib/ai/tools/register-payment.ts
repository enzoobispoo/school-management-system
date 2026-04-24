import { registerPayment } from "@/lib/ai/actions/register-payment";

type RegisterPaymentToolArgs = {
  studentName: string;
  paymentMethod?: string;
  confirmed?: boolean;
};

export async function registerPaymentTool(args: RegisterPaymentToolArgs) {
  return registerPayment({
    studentName: args.studentName,
    paymentMethod: args.paymentMethod,
    confirmed: !!args.confirmed,
  });
}