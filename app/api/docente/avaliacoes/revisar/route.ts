import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { requireProfessorContext } from "@/lib/docente/require-professor";
import { resolveSchoolAiForUser } from "@/lib/ai/resolve-school-ai";
import { incrementSchoolAiUsage } from "@/lib/ai/school-ai-settings";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseJsonSafe(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const pctx = requireProfessorContext(user);
  if (pctx instanceof NextResponse) return pctx;
  const schoolAi = await resolveSchoolAiForUser(user);
  const settings = user.schoolId
    ? await prisma.escolaSettings.findUnique({
        where: { schoolId: user.schoolId },
        select: { aiEvalReviewEnforced: true, aiEvalReviewMinScore: true },
      })
    : null;
  const enabled = Boolean(
    schoolAi?.useOpenAi &&
      schoolAi.apiKey &&
      !schoolAi.limitExceeded &&
      schoolAi.monthlyLimit > 0
  );
  return NextResponse.json({
    enabled,
    enforceBeforeCreate: Boolean(settings?.aiEvalReviewEnforced),
    minScore: settings?.aiEvalReviewMinScore ?? 70,
    reason:
      enabled ? null : "Revisão por IA indisponível no plano/configuração atual.",
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const pctx = requireProfessorContext(user);
  if (pctx instanceof NextResponse) return pctx;
  const { schoolId } = pctx;

  const schoolAi = await resolveSchoolAiForUser(user);
  const enabled = Boolean(
    schoolAi?.useOpenAi &&
      schoolAi.apiKey &&
      !schoolAi.limitExceeded &&
      schoolAi.monthlyLimit > 0
  );
  if (!enabled || !schoolAi) {
    return NextResponse.json(
      { error: "Revisão por IA indisponível no plano/configuração atual." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const payload = {
    titulo: String(body?.titulo ?? ""),
    descricao: String(body?.descricao ?? ""),
    formato: body?.formato === "JOGO" ? "JOGO" : "CLASSICA",
    questoes: Array.isArray(body?.questoes) ? body.questoes : [],
  };

  const client = new OpenAI({ apiKey: schoolAi.apiKey });
  const response = await client.responses.create({
    model: "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content:
          "Você é um revisor pedagógico. Analise avaliação escolar e retorne APENAS JSON com chaves: summary (string), issues (array de strings), suggestions (array de strings), qualityScore (number 0-100).",
      },
      {
        role: "user",
        content: `Revise a avaliação abaixo e identifique erros de clareza, ambiguidade, inconsistência de nível e problemas de alternativas.\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    store: false,
  });

  const output = response.output_text?.trim() || "{}";
  const parsed = parseJsonSafe(output);
  await incrementSchoolAiUsage(schoolId, 1);

  if (!parsed) {
    return NextResponse.json({
      summary: "A IA não retornou em formato estruturado.",
      issues: [],
      suggestions: ["Tente novamente em alguns instantes."],
      qualityScore: 0,
    });
  }

  return NextResponse.json({
    summary: typeof parsed.summary === "string" ? parsed.summary : "Revisão concluída.",
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    qualityScore:
      typeof parsed.qualityScore === "number" ? parsed.qualityScore : 70,
  });
}
