"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppNotification } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setUnread(0);
      return;
    }
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items || []);
    setUnread(data.unread || 0);
  }, [user]);

  useEffect(() => {
    load().catch(() => {});
    // Poll slowly; pause when tab hidden
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load().catch(() => {});
    }, 60000);
    const onVis = () => {
      if (document.visibilityState === "visible") load().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

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

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await load();
  }

  function titleFor(n: AppNotification) {
    const key = `notif.${n.type}` as const;
    const translated = t(key);
    return translated === key ? n.title : translated;
  }

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className={`notif__btn${unread > 0 ? " has-unread" : ""}`}
        aria-label={t("notif.title")}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) markAllRead().catch(() => {});
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3a5 5 0 0 0-5 5v2.2c0 .7-.2 1.4-.6 2L5 15h14l-1.4-2.8c-.4-.6-.6-1.3-.6-2V8a5 5 0 0 0-5-5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 18a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {unread > 0 ? <em>{unread > 9 ? "9+" : unread}</em> : null}
      </button>
      {open ? (
        <div className="notif__panel">
          <div className="notif__head">
            <strong>{t("notif.title")}</strong>
            <button type="button" className="mini-btn" onClick={() => markAllRead()}>
              {t("notif.markRead")}
            </button>
          </div>
          {items.length === 0 ? (
            <p className="muted tiny" style={{ padding: 16 }}>
              {t("notif.empty")}
            </p>
          ) : (
            <ul>
              {items.slice(0, 12).map((n) => (
                <li key={n.id} className={n.read ? "" : "is-unread"}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => setOpen(false)}>
                      <strong>{titleFor(n)}</strong>
                      <span>{n.body}</span>
                    </Link>
                  ) : (
                    <div>
                      <strong>{titleFor(n)}</strong>
                      <span>{n.body}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
