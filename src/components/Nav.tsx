"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountMenu } from "./AccountMenu";
import { useAuth } from "./AuthProvider";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLocale } from "./LocaleProvider";
import { NotificationBell } from "./NotificationBell";

export function Nav() {
  const [solid, setSolid] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setSolid(window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${solid ? " is-solid" : ""}`}>
      <div className="nav__inner">
        <Link href="/" className="brand" aria-label={t("nav.home")}>
          <span className="brand__mark" aria-hidden />
          <span className="brand__name">Luva</span>
        </Link>
        <nav className="nav__links" aria-label={t("nav.discover")}>
          <Link className={`nav__link${pathname === "/" ? " is-current" : ""}`} href="/">
            {t("nav.discover")}
          </Link>
          <Link
            className={`nav__link nav__link--hide-sm${pathname.startsWith("/calendars") || pathname.startsWith("/c/") ? " is-current" : ""}`}
            href="/calendars"
          >
            {t("nav.calendars")}
          </Link>
          <Link
            className={`nav__link nav__link--hide-sm${pathname === "/create" ? " is-current" : ""}`}
            href="/create"
          >
            {t("nav.create")}
          </Link>
          {user ? (
            <Link
              className={`nav__link nav__link--hide-sm${pathname === "/me" ? " is-current" : ""}`}
              href="/me"
            >
              {t("nav.myEvents")}
            </Link>
          ) : null}
          <LanguageSwitch />
          {loading ? (
            <span className="nav__skeleton" aria-hidden />
          ) : user ? (
            <>
              <NotificationBell />
              <AccountMenu />
            </>
          ) : (
            <Link className="nav__cta" href={`/signin?next=${encodeURIComponent(pathname || "/")}`}>
              {t("nav.signIn")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
