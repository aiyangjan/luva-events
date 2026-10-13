import { cookies } from "next/headers";
import { getUserById, toSessionUser } from "./store";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "luva_session";

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const user = getUserById(id);
  return user ? toSessionUser(user) : null;
}

export function sessionCookieOptions(userId: string) {
  return {
    name: SESSION_COOKIE,
    value: userId,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
