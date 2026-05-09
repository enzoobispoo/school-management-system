import { prisma } from "@/lib/prisma";
import type { AuthenticatedUser } from "@/lib/auth/get-current-user";
import { buildHeroElements } from "@/lib/docente/slide-templates";
import { parseSlideDeck, type SlideDeckSlideV1, type SlideDeckV1 } from "@/lib/docente/slide-deck";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function newSlideId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function clampHex(bg: string | undefined, fallback: string) {
  if (!bg || typeof bg !== "string") return fallback;
  const t = bg.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return t.slice(0, 16);
  return fallback;
}

function specToSlide(raw: Record<string, unknown>): SlideDeckSlideV1 {
  const title = str(raw.title);
  const subtitle = str(raw.subtitle);
  const bullets = str(raw.bullets);
  const background = clampHex(raw.background as string | undefined, "#5b21b6");
  const boldVisualLayout = Boolean(raw.boldVisualLayout);
  let backgroundImageUrl: string | null = null;
  if (raw.backgroundImageUrl === null || raw.backgroundImageUrl === "") {
    backgroundImageUrl = null;
  } else if (typeof raw.backgroundImageUrl === "string") {
    const u = raw.backgroundImageUrl.trim().slice(0, 2048);
    backgroundImageUrl = u || null;
  }

  if (boldVisualLayout && title) {
    return {
      id: newSlideId(),
      background,
      backgroundImageUrl,
      title: "",
      subtitle: "",
      bullets: "",
      elements: buildHeroElements(title, subtitle || "…"),
    };
  }

  return {
    id: newSlideId(),
    background,
    backgroundImageUrl,
    title,
    subtitle,
    bullets,
  };
}

export async function createDocenteApresentacaoTool(
  args: Record<string, unknown>,
  ctx: {
    schoolId?: string | null;
    user: AuthenticatedUser | null;
  }
) {
  const sid = ctx.schoolId?.trim();
  const user = ctx.user;

  if (!sid) {
    return {
      ok: false,
      error: "missing_school",
      message: "Escola não identificada na sessão.",
    };
  }

  if (!user || user.role !== "PROFESSOR" || !user.professorId) {
    return {
      ok: false,
      error: "forbidden",
      message: "Somente professores vinculados podem criar apresentações.",
    };
  }

  const confirmed = Boolean(args.confirmed);
  const turmaId = str(args.turmaId);
  const disciplinaId = str(args.disciplinaId);
  const tituloMaterial = str(args.titulo) || "Nova apresentação";
  const descricao =
    args.descricao === undefined || args.descricao === null ?
      null
    : str(args.descricao) || null;

  const specsRaw = args.slideSpecs;
  if (!Array.isArray(specsRaw) || specsRaw.length === 0) {
    return {
      ok: false,
      error: "validation",
      message:
        "Informe slideSpecs: lista de objetos { title, subtitle?, bullets?, background?, boldVisualLayout?, backgroundImageUrl? }.",
    };
  }

  if (specsRaw.length > 36) {
    return {
      ok: false,
      error: "validation",
      message: "No máximo 36 slides por criação. Divida em partes se precisar.",
    };
  }

  const slides: SlideDeckSlideV1[] = [];
  for (const row of specsRaw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return {
        ok: false,
        error: "validation",
        message: "Cada item de slideSpecs deve ser um objeto.",
      };
    }
    slides.push(specToSlide(row as Record<string, unknown>));
  }

  const deck: SlideDeckV1 = { version: 1, slides };
  const normalized = parseSlideDeck(deck);
  if (!normalized) {
    return {
      ok: false,
      error: "validation",
      message: "Deck gerado inválido — simplifique slideSpecs e tente de novo.",
    };
  }

  let turmaNome: string | null = null;
  let disciplinaNome: string | null = null;

  if (turmaId) {
    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        schoolId: sid,
        professorId: user.professorId,
        ativo: true,
      },
      select: { id: true, nome: true },
    });
    if (!turma) {
      return {
        ok: false,
        error: "not_found",
        message: "Turma não encontrada ou você não é o professor titular.",
      };
    }
    turmaNome = turma.nome;
  }

  if (disciplinaId && turmaId) {
    const link = await prisma.turmaDisciplina.findFirst({
      where: { schoolId: sid, turmaId, disciplinaId },
      include: { disciplina: { select: { nome: true } } },
    });
    if (!link) {
      return {
        ok: false,
        error: "validation",
        message: "Disciplina não vinculada a esta turma.",
      };
    }
    disciplinaNome = link.disciplina.nome;
  } else if (disciplinaId && !turmaId) {
    const d = await prisma.disciplina.findFirst({
      where: { id: disciplinaId, schoolId: sid },
      select: { nome: true },
    });
    if (!d) {
      return {
        ok: false,
        error: "validation",
        message: "Disciplina inválida.",
      };
    }
    disciplinaNome = d.nome;
  }

  const preview = {
    titulo: tituloMaterial,
    turmaId: turmaId || null,
    turmaNome,
    disciplinaId: disciplinaId || null,
    disciplinaNome,
    slidesCount: normalized.slides.length,
    primeiroTitulo: normalized.slides[0]?.title || "(layout livre / capa)",
  };

  if (!confirmed) {
    return {
      ok: false,
      needsConfirmation: true,
      preview,
      instrucao:
        "Mostre o resumo. Somente grave com confirmed:true depois de confirmação explícita do professor.",
      suggestedPhrase: "confirmar criação da apresentação",
    };
  }

  const row = await prisma.materialDidatico.create({
    data: {
      schoolId: sid,
      professorId: user.professorId,
      turmaId: turmaId || null,
      disciplinaId: disciplinaId || null,
      tipo: "SLIDE",
      titulo: tituloMaterial,
      descricao,
      arquivoUrl: null,
      arquivoNome: null,
      mimeType: null,
      tamanhoBytes: null,
      slideDeckJson: normalized as object,
    },
    select: { id: true, titulo: true },
  });

  return {
    ok: true,
    materialId: row.id,
    titulo: row.titulo,
    editorUrl: `/docente/materiais/apresentacoes/editor/${row.id}`,
    message:
      `Apresentação criada com ${normalized.slides.length} slide(s). ` +
      `Abra o editor em /docente/materiais/apresentacoes/editor/${row.id} para ajustar layout, imagens e modo livre.`,
  };
}
