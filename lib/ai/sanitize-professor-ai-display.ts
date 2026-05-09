/** Remove trechos internos da EduIA que não devem aparecer ao professor (IDs de ferramentas, flags de sistema). */
export function sanitizeProfessorAiDisplayText(text: string): string {
  let out = text;

  out = out.replace(/\b(?:create|query)_[a-z][a-z0-9_]*\b/gi, "");
  out = out.replace(/\bslideSpecs\b/gi, "estrutura dos slides");
  out = out.replace(/\bboldVisualLayout\b/gi, "");
  out = out.replace(/\bconfirmed\s*:\s*(?:true|false)\b/gi, "");
  out = out.replace(/\btool_error\b/gi, "");
  out = out.replace(/\n[ \t]*,[ \t]*\n/g, "\n");
  out = out.replace(/[ \t]{2,}/g, " ");
  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}
