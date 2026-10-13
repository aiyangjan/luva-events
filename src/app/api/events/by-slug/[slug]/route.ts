import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCalendarById, getEventBySlug } from "@/lib/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const event = getEventBySlug(slug);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getSessionUser();
  const calendar = getCalendarById(event.calendarId);
  const isHost =
    !!user &&
    (event.hostUserId === user.id || calendar?.ownerUserId === user.id);

  if (event.visibility === "private" && !isHost) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    event,
    calendar,
    isHost,
  });
}
