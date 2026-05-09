export type SlideDeckElementKind = "heading" | "body" | "image" | "shape";

export type SlideDeckShapeVariant = "rect" | "ellipse";

export type SlideDeckElement = {
  id: string;
  kind: SlideDeckElementKind;
  /** Posição em % da largura/altura do slide (0–100). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** heading / body */
  text?: string;
  fontSize?: number;
  color?: string;
  zIndex?: number;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
  /** image */
  imageUrl?: string | null;
  imageFit?: "cover" | "contain";
  imageOpacity?: number;
  /** Cantos arredondados da moldura da imagem (px). */
  imageRadius?: number;
  /** shape */
  shape?: SlideDeckShapeVariant;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shapeOpacity?: number;
  /** Cantos (retângulo); elipse ignora. */
  rectRadius?: number;
};

export type SlideDeckSlideV1 = {
  id: string;
  background: string;
  /** URL pública (upload ou externa https) para cobrir o fundo. */
  backgroundImageUrl?: string | null;
  title: string;
  subtitle: string;
  /** Uma linha por marcador; usado no modo simples quando não há `elements`. */
  bullets: string;
  /** Elementos no modo livre. Se definido e não vazio, tem precedência na pré-visualização. */
  elements?: SlideDeckElement[];
};

export type SlideDeckV1 = {
  version: 1;
  slides: SlideDeckSlideV1[];
};

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexOrCssColor(v: unknown, fallback: string) {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  if (!t) return fallback;
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return t.slice(0, 16);
  if (t.startsWith("rgba(") || t.startsWith("rgb(")) return t.slice(0, 80);
  return fallback;
}

export function normalizeElement(raw: Record<string, unknown>): SlideDeckElement | null {
  if (typeof raw.id !== "string") return null;
  const k = raw.kind;
  const kind =
    k === "heading" || k === "body" || k === "image" || k === "shape" ? k : null;
  if (!kind) return null;

  const x = clamp(Number(raw.x) || 0, 0, 100);
  const y = clamp(Number(raw.y) || 0, 0, 100);
  const w = clamp(Number(raw.w) || 20, 4, 100);
  const h = clamp(Number(raw.h) || 10, 3, 100);
  const zIndex =
    typeof raw.zIndex === "number" && Number.isFinite(raw.zIndex) ?
      raw.zIndex
    : undefined;

  if (kind === "heading" || kind === "body") {
    const text = typeof raw.text === "string" ? raw.text : "";
    const fontSize =
      typeof raw.fontSize === "number" && raw.fontSize > 6 && raw.fontSize < 200 ?
        raw.fontSize
      : undefined;
    const color = typeof raw.color === "string" ? raw.color : undefined;
    const fw = Number(raw.fontWeight);
    const fontWeight =
      Number.isFinite(fw) && fw >= 300 && fw <= 900 ? Math.round(fw / 100) * 100 : undefined;
    const ta = raw.textAlign;
    const textAlign =
      ta === "left" || ta === "center" || ta === "right" ? ta : undefined;
    return {
      id: raw.id,
      kind,
      x,
      y,
      w,
      h,
      text,
      fontSize,
      color,
      zIndex,
      fontWeight,
      textAlign,
    };
  }

  if (kind === "image") {
    let imageUrl: string | null = null;
    if (raw.imageUrl === null || raw.imageUrl === "") imageUrl = null;
    else if (typeof raw.imageUrl === "string") {
      imageUrl = raw.imageUrl.trim().slice(0, 2048) || null;
    }
    const imageFit = raw.imageFit === "contain" ? "contain" : "cover";
    const io = Number(raw.imageOpacity);
    const imageOpacity =
      Number.isFinite(io) ? clamp(io, 0.05, 1) : undefined;
    const ir = Number(raw.imageRadius);
    const imageRadius =
      Number.isFinite(ir) ? clamp(ir, 0, 48) : undefined;
    return {
      id: raw.id,
      kind: "image",
      x,
      y,
      w,
      h,
      zIndex,
      imageUrl,
      imageFit,
      imageOpacity,
      imageRadius,
    };
  }

  /* shape */
  const shape: SlideDeckShapeVariant =
    raw.shape === "ellipse" ? "ellipse" : "rect";
  const fill = hexOrCssColor(raw.fill, "#6366f140");
  const stroke =
    raw.stroke === null || raw.stroke === "" ?
      undefined
    : hexOrCssColor(raw.stroke, "#ffffff88");
  const sw = Number(raw.strokeWidth);
  const strokeWidth =
    Number.isFinite(sw) ? clamp(sw, 0, 12) : undefined;
  const so = Number(raw.shapeOpacity);
  const shapeOpacity =
    Number.isFinite(so) ? clamp(so, 0.05, 1) : undefined;
  const rr = Number(raw.rectRadius);
  const rectRadius =
    Number.isFinite(rr) ? clamp(rr, 0, 48) : undefined;

  return {
    id: raw.id,
    kind: "shape",
    x,
    y,
    w,
    h,
    zIndex,
    shape,
    fill,
    stroke,
    strokeWidth,
    shapeOpacity,
    rectRadius,
  };
}

export function createEmptySlideDeck(): SlideDeckV1 {
  return {
    version: 1,
    slides: [
      {
        id: newId(),
        background: "#0f172a",
        backgroundImageUrl: null,
        title: "",
        subtitle: "",
        bullets: "",
      },
    ],
  };
}

export function defaultHeadingElement(): SlideDeckElement {
  return {
    id: newId(),
    kind: "heading",
    x: 8,
    y: 12,
    w: 84,
    h: 14,
    text: "Título",
    fontSize: 28,
    color: "#ffffff",
    fontWeight: 700,
    textAlign: "left",
    zIndex: 1,
  };
}

export function defaultBodyElement(): SlideDeckElement {
  return {
    id: newId(),
    kind: "body",
    x: 8,
    y: 30,
    w: 84,
    h: 40,
    text: "Texto…",
    fontSize: 16,
    color: "#e2e8f0",
    fontWeight: 400,
    textAlign: "left",
    zIndex: 0,
  };
}

export function defaultImageElement(): SlideDeckElement {
  return {
    id: newId(),
    kind: "image",
    x: 32,
    y: 22,
    w: 36,
    h: 48,
    imageUrl: "",
    imageFit: "cover",
    imageOpacity: 1,
    imageRadius: 14,
    zIndex: 2,
  };
}

export function defaultShapeElement(
  shape: SlideDeckShapeVariant
): SlideDeckElement {
  return {
    id: newId(),
    kind: "shape",
    shape,
    x: 18,
    y: 28,
    w: 28,
    h: 22,
    fill: "#6366f138",
    stroke: "#ffffff55",
    strokeWidth: 2,
    shapeOpacity: 1,
    rectRadius: shape === "rect" ? 14 : 0,
    zIndex: 0,
  };
}

export function parseSlideDeck(raw: unknown): SlideDeckV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 || !Array.isArray(o.slides)) return null;
  const slides = o.slides
    .map((s): SlideDeckSlideV1 | null => {
      if (!s || typeof s !== "object") return null;
      const x = s as Record<string, unknown>;
      if (
        typeof x.id !== "string" ||
        typeof x.background !== "string" ||
        typeof x.title !== "string" ||
        typeof x.subtitle !== "string" ||
        typeof x.bullets !== "string"
      ) {
        return null;
      }
      let backgroundImageUrl: string | null | undefined;
      if (x.backgroundImageUrl === null || x.backgroundImageUrl === "") {
        backgroundImageUrl = null;
      } else if (typeof x.backgroundImageUrl === "string") {
        backgroundImageUrl = x.backgroundImageUrl.trim().slice(0, 2048) || null;
      }

      let elements: SlideDeckElement[] | undefined;
      if (Array.isArray(x.elements)) {
        const parsed = x.elements
          .map((el) =>
            el && typeof el === "object" ?
              normalizeElement(el as Record<string, unknown>)
            : null
          )
          .filter((e): e is SlideDeckElement => e != null);
        if (parsed.length) elements = parsed;
      }

      return {
        id: x.id,
        background: x.background,
        backgroundImageUrl: backgroundImageUrl ?? null,
        title: x.title,
        subtitle: x.subtitle,
        bullets: x.bullets,
        elements,
      };
    })
    .filter((s): s is SlideDeckSlideV1 => s != null);

  if (!slides.length) return null;
  return { version: 1, slides };
}
