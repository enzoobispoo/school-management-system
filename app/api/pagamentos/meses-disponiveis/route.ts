import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertFinanceRead, getCurrentUser, requireSchool } from "@/lib/auth";

const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const _school = requireSchool(user);
    if (_school instanceof NextResponse) return _school;
    const { schoolId } = _school;

    const denied = assertFinanceRead(user);
    if (denied) return denied;

    const rows = await prisma.pagamento.findMany({
      where: { schoolId },
      select: { competenciaMes: true, competenciaAno: true },
      distinct: ["competenciaMes", "competenciaAno"],
      orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
    });

    const meses = rows.map((r) => ({
      value: `${String(r.competenciaMes).padStart(2, "0")}-${r.competenciaAno}`,
      label: `${monthNames[r.competenciaMes - 1]} ${r.competenciaAno}`,
    }));

    return NextResponse.json(meses);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar meses." }, { status: 500 });
  }
}
