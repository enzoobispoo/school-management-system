import {
  createEmptySlideDeck,
  defaultBodyElement,
  defaultHeadingElement,
  type SlideDeckElement,
  type SlideDeckSlideV1,
  type SlideDeckV1,
} from "@/lib/docente/slide-deck";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export type SlideTemplateId =
  | "minimal_dark"
  | "purple_hero"
  | "neon_cards"
  | "steps_three"
  | "sunset_cover";

export const SLIDE_TEMPLATE_META: Record<
  SlideTemplateId,
  { label: string; description: string; accent: string }
> = {
  minimal_dark: {
    label: "Minimal escuro",
    description: "Título central limpo — bom para aulas objetivas.",
    accent: "#0f172a",
  },
  purple_hero: {
    label: "Capa vibrante",
    description: "Hero grande + subtítulo — inspiração layouts marketing.",
    accent: "#6d28d9",
  },
  neon_cards: {
    label: "Cards coloridos",
    description: "Blocos lado a lado para comparar ideias.",
    accent: "#db2777",
  },
  steps_three: {
    label: "3 passos",
    description: "Didático: etapa 1 · 2 · 3 com bullets.",
    accent: "#059669",
  },
  sunset_cover: {
    label: "Capa gradiente",
    description: "Fundo quente + texto em camadas.",
    accent: "#ea580c",
  },
};

function slideBase(partial: Omit<SlideDeckSlideV1, "id">): SlideDeckSlideV1 {
  return {
    ...partial,
    id: newId(),
    backgroundImageUrl: partial.backgroundImageUrl ?? null,
  };
}

/** Para IA / imports — mesmo layout “capa” dos templates vibrantes. */
export function buildHeroElements(title: string, subtitle: string): SlideDeckElement[] {
  return [
    {
      ...defaultHeadingElement(),
      id: newId(),
      text: title,
      x: 6,
      y: 28,
      w: 88,
      h: 18,
      fontSize: 34,
      color: "#fafafa",
      zIndex: 2,
    },
    {
      ...defaultBodyElement(),
      id: newId(),
      text: subtitle,
      x: 6,
      y: 50,
      w: 78,
      h: 22,
      fontSize: 18,
      color: "#e9d5ff",
      zIndex: 1,
    },
  ];
}

function threeStepsSlide(): SlideDeckSlideV1 {
  const bg = "#0c4a6e";
  const cards: SlideDeckElement[] = [
    {
      ...defaultHeadingElement(),
      id: newId(),
      kind: "heading",
      text: "Em 3 passos",
      x: 8,
      y: 8,
      w: 84,
      h: 12,
      fontSize: 26,
      color: "#ecfeff",
      zIndex: 3,
    },
    {
      ...defaultBodyElement(),
      id: newId(),
      text: "1 · Contextualize\nExplique o problema ou tema.",
      x: 6,
      y: 26,
      w: 28,
      h: 58,
      fontSize: 13,
      color: "#cffafe",
      zIndex: 1,
    },
    {
      ...defaultBodyElement(),
      id: newId(),
      text: "2 · Pratique\nAtividade guiada ou discussão.",
      x: 36,
      y: 26,
      w: 28,
      h: 58,
      fontSize: 13,
      color: "#cffafe",
      zIndex: 1,
    },
    {
      ...defaultBodyElement(),
      id: newId(),
      text: "3 · Sintetize\nRecap e próximos passos.",
      x: 66,
      y: 26,
      w: 28,
      h: 58,
      fontSize: 13,
      color: "#cffafe",
      zIndex: 1,
    },
  ];
  return slideBase({
    background: bg,
    title: "",
    subtitle: "",
    bullets: "",
    elements: cards,
  });
}

function neonCardsSlide(): SlideDeckSlideV1 {
  const elements: SlideDeckElement[] = [
    {
      ...defaultHeadingElement(),
      id: newId(),
      text: "Ideias em destaque",
      x: 8,
      y: 10,
      w: 84,
      h: 14,
      fontSize: 28,
      color: "#fdf4ff",
      zIndex: 2,
    },
    {
      ...defaultBodyElement(),
      id: newId(),
      text: "Bloco A\n• Benefício\n• Exemplo rápido",
      x: 6,
      y: 30,
      w: 42,
      h: 54,
      fontSize: 15,
      color: "#fce7f3",
      zIndex: 1,
    },
    {
      ...defaultBodyElement(),
      id: newId(),
      text: "Bloco B\n• Comparativo\n• Conclusão",
      x: 52,
      y: 30,
      w: 42,
      h: 54,
      fontSize: 15,
      color: "#ede9fe",
      zIndex: 1,
    },
  ];
  return slideBase({
    background: "#831843",
    title: "",
    subtitle: "",
    bullets: "",
    elements,
  });
}

export function deckFromTemplate(templateId: SlideTemplateId): SlideDeckV1 {
  switch (templateId) {
    case "minimal_dark":
      return {
        version: 1,
        slides: [
          slideBase({
            background: "#0f172a",
            title: "Título da aula",
            subtitle: "Um subtítulo curto para orientar a turma.",
            bullets: "Primeiro ponto\nSegundo ponto\nTerceiro ponto",
          }),
          slideBase({
            background: "#111827",
            title: "Próximo tópico",
            subtitle: "",
            bullets: "Detalhe 1\nDetalhe 2",
          }),
        ],
      };
    case "purple_hero":
      return {
        version: 1,
        slides: [
          slideBase({
            background: "#5b21b6",
            title: "",
            subtitle: "",
            bullets: "",
            elements: buildHeroElements(
              "Sua ideia em destaque",
              "Use este slide como gancho visual — substitua o texto e arraste as caixas."
            ),
          }),
          threeStepsSlide(),
        ],
      };
    case "neon_cards":
      return {
        version: 1,
        slides: [
          neonCardsSlide(),
          slideBase({
            background: "#312e81",
            title: "Resumo",
            subtitle: "Feche com mensagem principal.",
            bullets: "Takeaway 1\nTakeaway 2",
          }),
        ],
      };
    case "steps_three":
      return {
        version: 1,
        slides: [
          threeStepsSlide(),
          slideBase({
            background: "#14532d",
            title: "Checklist",
            subtitle: "Para os alunos acompanharem",
            bullets: "Lição lida\nExercício feito\nDúvidas anotadas",
          }),
        ],
      };
    case "sunset_cover":
      return {
        version: 1,
        slides: [
          slideBase({
            background: "#c2410c",
            title: "",
            subtitle: "",
            bullets: "",
            elements: buildHeroElements(
              "Capa energética",
              "Combine com fotos de fundo (URL ou upload) para um visual próximo a landing pages."
            ),
          }),
          slideBase({
            background: "#7c2d12",
            title: "Desenvolvimento",
            subtitle: "Corpo da apresentação",
            bullets: "Ponto central\nEvidência ou exemplo\nMini atividade",
          }),
        ],
      };
  }
}

/** Mescla um modelo ao deck atual (substitui conteúdo por slides novos). */
export function replaceDeckWithTemplate(
  _prev: SlideDeckV1,
  templateId: SlideTemplateId
): SlideDeckV1 {
  void _prev;
  return deckFromTemplate(templateId);
}

export function emptyDeck(): SlideDeckV1 {
  return createEmptySlideDeck();
}
