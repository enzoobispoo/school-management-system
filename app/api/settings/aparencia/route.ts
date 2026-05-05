import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireSchool } from "@/lib/auth";

type Theme = "light" | "dark";
type Density = "comfortable" | "compact";

function normalizeTheme(value: unknown): Theme {
  return value === "dark" ? "dark" : "light";
}
function normalizeDensity(value: unknown): Density {
  return value === "compact" ? "compact" : "comfortable";
}

export async function GET(request: NextRequest) {
  // Try to get school from session, fall back to first school for public theme loading
  const user = await getCurrentUser();
  const schoolId = user?.schoolId ?? null;

  const settings = schoolId
    ? await prisma.escolaSettings.findUnique({ where: { schoolId } })
    : await prisma.escolaSettings.findFirst();

  const temaPadrao = normalizeTheme(settings?.temaPadrao);
  const densidade = normalizeDensity(settings?.densidade);

  const response = NextResponse.json({ temaPadrao, densidade });
  response.cookies.set("theme", temaPadrao, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  response.cookies.set("density", densidade, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  const result = requireSchool(user);
  if (result instanceof NextResponse) return result;
  const { schoolId } = result;

  const body = await req.json();
  const temaPadrao = normalizeTheme(body.temaPadrao);
  const densidade = normalizeDensity(body.densidade);

  const settings = await prisma.escolaSettings.upsert({
    where: { schoolId },
    update: { temaPadrao, densidade },
    create: { id: schoolId, schoolId, nomeEscola: "Minha Escola", temaPadrao, densidade },
  });

  const response = NextResponse.json(settings);
  response.cookies.set("theme", temaPadrao, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  response.cookies.set("density", densidade, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}
