import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tryLinkProfessorUser } from "@/lib/docente/sync-professor-user-link";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tenta vincular o usuário logado ao cadastro de Professor (mesmo e-mail + mesma escola).
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (user.role !== "PROFESSOR") {
      return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
    }

    const portalDenied = await blockProfessorWhenPortalDisabled(user);
    if (portalDenied) return portalDenied;

    const result = await tryLinkProfessorUser(user.id);

    if (result.ok) {
      return NextResponse.json({
        ok: true,
        professorId: result.professorId,
      });
    }

    const messages: Record<typeof result.reason, string> = {
      not_professor: "Esta conta não é de professor.",
      already_linked: "Conta já está vinculada.",
      missing_school_or_email: "Conta sem escola ou e-mail.",
      no_professor_match:
        "Não há professor ativo nesta escola com o mesmo e-mail da sua conta. Peça à secretaria para cadastrar ou corrigir o e-mail na ficha de professores.",
    };

    return NextResponse.json(
      {
        ok: false,
        reason: result.reason,
        message: messages[result.reason],
      },
      { status: 422 }
    );
  } catch (e) {
    console.error("POST /api/docente/link-professor:", e);
    return NextResponse.json(
      { error: "Não foi possível atualizar o vínculo." },
      { status: 500 }
    );
  }
}
