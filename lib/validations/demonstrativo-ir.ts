import { z } from "zod";

export const demonstrativoIrEnviarSchema = z.object({
  anos: z
    .array(z.number().int().min(2000).max(2100))
    .min(1, "Selecione pelo menos um ano")
    .max(8, "No máximo 8 anos"),
  sendEmail: z.boolean(),
  sendWhatsApp: z.boolean(),
});

export type DemonstrativoIrEnviarInput = z.infer<typeof demonstrativoIrEnviarSchema>;
