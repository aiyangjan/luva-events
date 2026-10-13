import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { ensureUserCalendar, registerUser, toSessionUser } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const user = registerUser(name, email, password);
    const session = toSessionUser(user);
    ensureUserCalendar(session);

    const res = NextResponse.json({ success: true, user: session });
    res.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign up failed";
    const status = message.includes("already registered") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
