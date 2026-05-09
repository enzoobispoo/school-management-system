import { NextRequest, NextResponse } from "next/server";
import type { CountryCode } from "pluggy-sdk/dist/types/common";
import type { Connector } from "pluggy-sdk/dist/types/connector";
import { assertFinanceRead, getCurrentUser, requireSchool } from "@/lib/auth";
import { assertPluggyPlanAllowed } from "@/lib/pluggy/plan-access";
import { getPluggyServerClient } from "@/lib/pluggy/client";
import { withPluggyRetry } from "@/lib/pluggy/retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function presentConnector(c: Connector) {
  return {
    id: c.id,
    name: c.name,
    country: c.country,
    type: c.type,
    imageUrl: c.imageUrl,
    primaryColor: c.primaryColor,
    institutionUrl: c.institutionUrl,
    isSandbox: c.isSandbox,
    products: c.products,
    hasMFA: c.hasMFA,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const finRead = assertFinanceRead(user);
    if (finRead) return finRead;

    const schoolResult = requireSchool(user);
    if (schoolResult instanceof NextResponse) return schoolResult;
    const { schoolId } = schoolResult;

    const planBlock = await assertPluggyPlanAllowed(schoolId);
    if (planBlock) return planBlock;

    const country =
      (request.nextUrl.searchParams.get("country") ?? "BR").toUpperCase() as CountryCode;

    const client = getPluggyServerClient();
    const merged: Connector[] = [];
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const res = await withPluggyRetry(() =>
        client.fetchConnectors({
          countries: [country],
          page,
          pageSize: 100,
          isOpenFinance: true,
        } as Parameters<(typeof client)["fetchConnectors"]>[0])
      );
      merged.push(...res.results);
      totalPages = Math.max(1, res.totalPages);
      page += 1;
      if (merged.length > 2000) break;
    }

    return NextResponse.json({
      connectors: merged.map(presentConnector),
    });
  } catch (e) {
    console.error("[pluggy] connectors GET", e);
    return NextResponse.json(
      { error: "PLUGGY_CONNECTORS_FAILED", code: "PLUGGY_ERROR" },
      { status: 500 }
    );
  }
}
