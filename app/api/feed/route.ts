import { NextResponse } from "next/server";

import { getFeed } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const feed = await getFeed();

  return NextResponse.json(
    {
      profiles: feed,
      remaining: feed.length,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
