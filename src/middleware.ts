import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["zh", "en"];
const DEFAULT: Locale = "zh";

function negotiate(request: NextRequest): Locale {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const languages = new Negotiator({ headers }).languages();
  try {
    const matched = match(languages, LOCALES, DEFAULT);
    return matched === "zh" || matched.startsWith("zh") ? "zh" : "en";
  } catch {
    return DEFAULT;
  }
}

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (existing === "zh" || existing === "en") {
    return NextResponse.next();
  }

  const locale = negotiate(request);
  const res = NextResponse.next();
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads|favicon.ico|.*\\..*).*)"],
};
