import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listUserHostedEvents, listUserRsvps } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const rsvps = listUserRsvps(user.id);
  return NextResponse.json({
    success: true,
    user,
    rsvps,
    going: rsvps
      .filter((r) => r.status === "going" || r.status === "checked_in")
      .map((r) => r.event),
    pending: rsvps.filter((r) => r.status === "pending").map((r) => r.event),
    waitlist: rsvps.filter((r) => r.status === "waitlist").map((r) => r.event),
    hosted: listUserHostedEvents(user.id),
  });
}
