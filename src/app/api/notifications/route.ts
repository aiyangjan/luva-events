import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listNotifications, markNotificationsRead } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const items = listNotifications(user.id);
  return NextResponse.json({
    success: true,
    items,
    unread: items.filter((n) => !n.read).length,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : undefined;
  const result = markNotificationsRead(user.id, ids);
  return NextResponse.json({ success: true, ...result });
}
