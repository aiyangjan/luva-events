import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ensureUserCalendar, listCalendars, listEvents } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const calendars = listCalendars().map((c) => ({
    ...c,
    upcomingCount: listEvents({ calendarId: c.id, status: "upcoming" }).length,
    followerCount: c.followerIds.length,
  }));
  return NextResponse.json({ success: true, data: calendars });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const calendar = ensureUserCalendar(user);
  return NextResponse.json({ success: true, calendar });
}
