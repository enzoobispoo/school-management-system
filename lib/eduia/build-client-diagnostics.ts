/**
 * Texto curto para colar na EduIA ou enviar ao suporte — diagnóstico do lado do cliente (navegador).
 */
export function buildClientDiagnosticsMarkdown(): string {
  if (typeof window === "undefined") return "";

  const nav = navigator;
  const conn = (
    nav as Navigator & {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
      };
    }
  ).connection;

  const mem = (
    performance as Performance & {
      memory?: {
        usedJSHeapSize?: number;
        totalJSHeapSize?: number;
        jsHeapSizeLimit?: number;
      };
    }
  ).memory;

  const lines = [
    "## Diagnóstico do navegador (automático)",
    "",
    `- **URL:** ${window.location.href}`,
    `- **Horário local:** ${new Date().toISOString()}`,
    `- **User-Agent:** ${nav.userAgent}`,
    `- **Idioma:** ${nav.language}`,
    `- **Viewport:** ${window.innerWidth}×${window.innerHeight}`,
    `- **DPR:** ${window.devicePixelRatio}`,
    `- **Online:** ${nav.onLine ? "sim" : "não"}`,
    conn ?
      `- **Rede (hint):** ${conn.effectiveType ?? "?"} · downlink≈${conn.downlink ?? "?"} Mbps · RTT≈${conn.rtt ?? "?"} ms · economia de dados=${conn.saveData ? "sim" : "não"}`
    : "- **Rede:** API Network Information não disponível neste navegador.",
    mem ?
      `- **Heap JS (Chrome):** usado ${Math.round((mem.usedJSHeapSize ?? 0) / 1048576)} MB / limite ${Math.round((mem.jsHeapSizeLimit ?? 0) / 1048576)} MB`
    : "- **Heap JS:** métrica não exposta (normal em Safari/Firefox).",
    `- **Visibility:** ${document.visibilityState}`,
    "",
    "Descreva abaixo o que estava fazendo quando travou (ex.: abrir lista de pagamentos, gerar boleto) e se só esta aba ou outras apps também ficaram lentas.",
  ];

  return lines.join("\n");
}
