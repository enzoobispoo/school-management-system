/** Avatares permitidos no join (evita texto livre / unicode estranho). */
export const JOGO_AVATAR_EMOJIS = [
  "🦊",
  "🐼",
  "🦁",
  "🐸",
  "🐵",
  "🦄",
  "🐙",
  "🦋",
  "⭐",
  "🚀",
  "🎸",
  "🎯",
  "🏆",
  "📚",
  "🔭",
  "🎨",
  "🏀",
  "⚽",
  "🎮",
  "🍕",
  "🌈",
  "💡",
  "🎭",
  "🎪",
] as const;

const ALLOWED = new Set<string>(JOGO_AVATAR_EMOJIS);

export function sanitizeJogoAvatarEmoji(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (s && ALLOWED.has(s)) return s;
  return "🎓";
}
