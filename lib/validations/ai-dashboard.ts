import { z } from "zod";

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(16000),
});

export const aiDashboardPostSchema = z.object({
  message: z
    .string()
    .max(8000)
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Mensagem obrigatória.")),
  messages: z.array(conversationMessageSchema).max(20).optional(),
  /** O cliente envia `null` quando não há contexto — aceitar null além de omitir o campo */
  conversationContext: z.record(z.unknown()).nullish(),
});

export type AiDashboardPostBody = z.infer<typeof aiDashboardPostSchema>;
