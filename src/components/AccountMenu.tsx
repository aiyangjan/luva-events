"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  async function onSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="account" ref={ref}>
      <button
        type="button"
        className="nav__avatar account__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        title={user.email}
      >
        {user.name.slice(0, 1).toUpperCase()}
      </button>
      {open ? (
        <div className="account__menu" role="menu">
          <div className="account__head">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <Link href="/me" role="menuitem" onClick={() => setOpen(false)}>
            {t("nav.myEvents")}
          </Link>
          <Link href="/create" role="menuitem" onClick={() => setOpen(false)}>
            {t("nav.create")}
          </Link>
          <button type="button" role="menuitem" onClick={onSignOut}>
            {t("nav.signOut")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
