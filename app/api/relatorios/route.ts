import { NextRequest, NextResponse } from "next/server";
import {
  assertFinanceRead,
  getCurrentUser,
  requireSchool,
} from "@/lib/auth";
import { buildSchoolFinanceReport } from "@/lib/reports/build-school-finance-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const financeForbidden = assertFinanceRead(user);
    if (financeForbidden) return financeForbidden;

    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const { searchParams } = new URL(request.url);

    const year = Number(searchParams.get("year") || new Date().getFullYear());
    const courseCategory = searchParams.get("category") || "all";

    const report = await buildSchoolFinanceReport({
      schoolId,
      year,
      courseCategory,
    });

    return NextResponse.json({
      insights: report.insights,
      revenueEvolution: report.revenueEvolution,
      studentsGrowth: report.studentsGrowth,
      popularCourses: report.popularCourses,
    });
  } catch (error) {
    console.error("Erro ao gerar relatórios:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar os relatórios." },
      { status: 500 }
    );
  }
}
