import { NextResponse } from "next/server";

import { getMatches } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const matches = await getMatches();

  return NextResponse.json(
    {
      matches,
      count: matches.length,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
