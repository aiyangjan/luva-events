import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  assertEventHost,
  getEventById,
  guestCounts,
  listEventGuests,
  updateGuestStatus,
} from "@/lib/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const { id } = await ctx.params;
  const event = getEventById(id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    assertEventHost(event, user.id);
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    event,
    guests: listEventGuests(id),
    counts: guestCounts(id),
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const rsvpId = String(body.rsvpId || "");
    const action = String(body.action || "") as
      | "approve"
      | "decline"
      | "checkin"
      | "undo_checkin"
      | "to_waitlist";

    if (!rsvpId || !action) {
      return NextResponse.json({ error: "rsvpId and action required" }, { status: 400 });
    }

    const result = updateGuestStatus({
      eventId: id,
      rsvpId,
      hostUserId: user.id,
      action,
    });

    return NextResponse.json({
      success: true,
      rsvp: result.rsvp,
      event: result.event,
      guests: listEventGuests(id),
      counts: guestCounts(id),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status =
      message === "Not authorized"
        ? 403
        : message === "Event not found" || message === "Guest not found"
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
