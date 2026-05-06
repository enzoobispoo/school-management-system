import { z } from "zod";

export const patchOperationalIncidentSchema = z
  .object({
    action: z.enum(["acknowledge", "resolve", "dismiss"]),
    dismissReason: z.string().min(3).max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "dismiss") {
      const reason = data.dismissReason?.trim();
      if (!reason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o motivo ao dispensar.",
          path: ["dismissReason"],
        });
      }
    }
  });
