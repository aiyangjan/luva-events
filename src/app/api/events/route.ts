import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createEvent, ensureUserCalendar, listEvents } from "@/lib/store";
import type { EventStatus, EventVisibility } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q") || undefined;
  const calendarId = req.nextUrl.searchParams.get("calendarId") || undefined;
  const status =
    statusParam === "past" || statusParam === "upcoming"
      ? (statusParam as EventStatus)
      : undefined;

  return NextResponse.json({
    success: true,
    data: listEvents({ status, q, calendarId }),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const location = String(body.location || "").trim();
    const city = String(body.city || "").trim();
    const startAt = String(body.startAt || "");
    const endAt = String(body.endAt || "");
    const capacity = Number(body.capacity);
    const cover = body.cover ? String(body.cover) : undefined;
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : String(body.tags || "")
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);

    const visibility =
      body.visibility === "private" ? ("private" as EventVisibility) : "public";
    const requireApproval = Boolean(body.requireApproval);
    const waitlistEnabled = body.waitlistEnabled !== false;
    const ticketName = body.ticketName ? String(body.ticketName) : "Standard";

    if (!title || !description || !location || !city || !startAt || !endAt) {
      return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      return NextResponse.json({ error: "Capacity must be at least 1" }, { status: 400 });
    }
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(+start) || Number.isNaN(+end)) {
      return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    const calendar = ensureUserCalendar(user);

    const event = createEvent({
      title,
      description,
      location,
      city,
      startAt,
      endAt,
      capacity,
      cover,
      tags,
      host: user.name,
      hostUserId: user.id,
      calendarId: calendar.id,
      visibility,
      requireApproval,
      waitlistEnabled,
      ticketName,
    });

    return NextResponse.json({ success: true, event, calendar });
  } catch {
    return NextResponse.json({ error: "Could not create event" }, { status: 500 });
  }
}
