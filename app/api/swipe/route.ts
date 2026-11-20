import { NextResponse } from "next/server";

import { ApiError, recordSwipe } from "@/lib/store";
import type { SwipeDirection } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { profileId, direction } = (body ?? {}) as {
    profileId?: unknown;
    direction?: unknown;
  };

  if (typeof profileId !== "string" || !profileId.trim()) {
    return NextResponse.json(
      { error: "profileId is required." },
      { status: 400 },
    );
  }

  if (direction !== "like" && direction !== "pass") {
    return NextResponse.json(
      { error: 'direction must be either "like" or "pass".' },
      { status: 400 },
    );
  }

  try {
    const result = await recordSwipe(profileId, direction as SwipeDirection);

    return NextResponse.json(
      {
        profileId,
        direction,
        matched: result.matched,
        match: result.match,
        alreadySwiped: result.alreadySwiped,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("POST /api/swipe failed", error);
    return NextResponse.json(
      { error: "Could not record the swipe. Please try again." },
      { status: 500 },
    );
  }
}
