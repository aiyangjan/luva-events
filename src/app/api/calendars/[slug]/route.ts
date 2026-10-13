import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  followCalendar,
  getCalendarBySlug,
  listEvents,
  unfollowCalendar,
} from "@/lib/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const calendar = getCalendarBySlug(slug);
  if (!calendar) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getSessionUser();
  const upcoming = listEvents({ calendarId: calendar.id, status: "upcoming" });
  const past = listEvents({ calendarId: calendar.id, status: "past" });

  return NextResponse.json({
    success: true,
    calendar,
    upcoming,
    past,
    following: user ? calendar.followerIds.includes(user.id) : false,
    followerCount: calendar.followerIds.length,
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const { slug } = await ctx.params;
  const calendar = getCalendarBySlug(slug);
  if (!calendar) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action === "unfollow" ? "unfollow" : "follow";
    const updated =
      action === "unfollow"
        ? unfollowCalendar(calendar.id, user.id)
        : followCalendar(calendar.id, user.id);

    return NextResponse.json({
      success: true,
      calendar: updated,
      following: updated.followerIds.includes(user.id),
      followerCount: updated.followerIds.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
