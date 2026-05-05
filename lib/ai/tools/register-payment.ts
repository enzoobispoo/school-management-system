import { registerPayment } from "@/lib/ai/actions/register-payment";

type RegisterPaymentToolArgs = {
  studentName: string;
  paymentMethod?: string;
  confirmed?: boolean;
  schoolId?: string | null;
};

export async function registerPaymentTool(
  args: RegisterPaymentToolArgs,
  schoolIdFromContext?: string | null
) {
  return registerPayment({
    studentName: args.studentName,
    paymentMethod: args.paymentMethod,
    confirmed: !!args.confirmed,
    schoolId: schoolIdFromContext ?? args.schoolId ?? null,
  });
}