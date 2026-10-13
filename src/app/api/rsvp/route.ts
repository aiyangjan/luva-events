import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addRsvp, cancelRsvp, getEventById, getUserRsvp, guestCounts } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const event = getEventById(eventId);
  const counts = guestCounts(eventId);
  const rsvp = user ? getUserRsvp(eventId, user.id) || null : null;

  return NextResponse.json({
    success: true,
    user,
    rsvp,
    going: event?.going ?? 0,
    capacity: event?.capacity ?? 0,
    requireApproval: event?.requireApproval ?? false,
    waitlistEnabled: event?.waitlistEnabled ?? false,
    ticketTypes: event?.ticketTypes ?? [],
    counts,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to RSVP" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const eventId = String(body.eventId || "");
    const ticketTypeId = body.ticketTypeId ? String(body.ticketTypeId) : undefined;
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const result = addRsvp({ eventId, user, ticketTypeId });
    return NextResponse.json({
      success: true,
      rsvp: result.rsvp,
      event: result.event,
      going: result.event.going,
      counts: guestCounts(eventId),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "RSVP failed";
    const status = [
      "Sold out",
      "Already registered",
      "Already on waitlist",
      "Application pending",
      "Event already ended",
      "No ticket type available",
    ].includes(message)
      ? 400
      : message === "Event not found"
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  try {
    const eventId =
      req.nextUrl.searchParams.get("eventId") ||
      String((await req.json().catch(() => ({}))).eventId || "");
    if (!eventId) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }

    const event = cancelRsvp(eventId, user.id);
    return NextResponse.json({
      success: true,
      event,
      going: event.going,
      counts: guestCounts(eventId),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel failed";
    const status =
      message === "No active RSVP" ? 400 : message === "Event not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
