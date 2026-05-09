/** Extrai texto da Responses API quando `output_text` vem vazio (output estruturado). */
export function extractResponsesOutputText(response: {
  output_text?: string | null;
  output?: unknown[];
}): string {
  const direct = response.output_text?.trim();
  if (direct) return direct;

  const out = response.output;
  if (!Array.isArray(out)) return "";

  const chunks: string[] = [];
  for (const item of out) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.type === "message" && Array.isArray(o.content)) {
      for (const c of o.content) {
        if (!c || typeof c !== "object") continue;
        const block = c as Record<string, unknown>;
        if (block.type === "output_text" && typeof block.text === "string") {
          chunks.push(block.text);
        }
      }
    }
  }
  return chunks.join("\n").trim();
}
