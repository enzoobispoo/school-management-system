import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Theme = "light" | "dark";
type Density = "comfortable" | "compact";

function normalizeTheme(value: unknown): Theme {
  return value === "dark" ? "dark" : "light";
}

function normalizeDensity(value: unknown): Density {
  return value === "compact" ? "compact" : "comfortable";
}

export async function GET() {
  const settings = await prisma.escolaSettings.findFirst();

  const temaPadrao = normalizeTheme(settings?.temaPadrao);
  const densidade = normalizeDensity(settings?.densidade);

  const response = NextResponse.json({
    temaPadrao,
    densidade,
  });

  response.cookies.set("theme", temaPadrao, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  response.cookies.set("density", densidade, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const temaPadrao = normalizeTheme(body.temaPadrao);
  const densidade = normalizeDensity(body.densidade);

  const settings = await prisma.escolaSettings.upsert({
    where: { id: "default" },
    update: {
      temaPadrao,
      densidade,
    },
    create: {
      id: "default",
      nomeEscola: "EduGestão",
      temaPadrao,
      densidade,
    },
  });

  const response = NextResponse.json(settings);

  response.cookies.set("theme", temaPadrao, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  response.cookies.set("density", densidade, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}