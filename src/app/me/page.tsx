"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import type { EventItem } from "@/lib/types";

type Tab = "going" | "pending" | "waitlist" | "hosting";

export default function MePage() {
  const { user, loading } = useAuth();
  const { t, te } = useLocale();
  const [going, setGoing] = useState<EventItem[]>([]);
  const [pending, setPending] = useState<EventItem[]>([]);
  const [waitlist, setWaitlist] = useState<EventItem[]>([]);
  const [hosted, setHosted] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("going");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    fetch("/api/me/events", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setGoing(data.going || []);
        setPending(data.pending || []);
        setWaitlist(data.waitlist || []);
        setHosted(data.hosted || []);
      })
      .catch((err) => setError(te(err instanceof Error ? err.message : "Failed")))
      .finally(() => setReady(true));
  }, [user, loading, te]);

  const list = useMemo(() => {
    if (tab === "going") return going;
    if (tab === "pending") return pending;
    if (tab === "waitlist") return waitlist;
    return hosted;
  }, [tab, going, pending, waitlist, hosted]);

  if (loading || !ready) {
    return (
      <main className="page">
        <div className="shell">
          <div className="skeleton-block" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="shell narrow">
          <div className="panel">
            <h1 className="panel__title">{t("me.title")}</h1>
            <p className="panel__sub">{t("me.needSignIn")}</p>
            <Link className="btn-block" href={`/signin?next=${encodeURIComponent("/me")}`}>
              {t("nav.signIn")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const badge =
    tab === "going"
      ? t("me.badgeGoing")
      : tab === "pending"
        ? t("me.badgePending")
        : tab === "waitlist"
          ? t("me.badgeWaitlist")
          : t("me.badgeHost");

  return (
    <main className="page">
      <div className="shell">
        <div className="page__head">
          <div>
            <h1 className="page__title">{t("me.title")}</h1>
            <p className="page__sub">{user.name}</p>
          </div>
          <Link className="nav__cta" href="/create">
            {t("nav.create")}
          </Link>
        </div>

        <div className="tabs tabs--scroll" role="tablist" style={{ marginBottom: 22 }}>
          {(
            [
              ["going", t("me.tabGoing", { n: going.length })],
              ["pending", t("me.tabPending", { n: pending.length })],
              ["waitlist", t("me.tabWaitlist", { n: waitlist.length })],
              ["hosting", t("me.tabHosting", { n: hosted.length })],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`tab${tab === id ? " is-active" : ""}`}
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <div className="toast toast--err">{error}</div> : null}

        <div className="grid">
          {list.length === 0 ? (
            <div className="empty">
              <strong>{t("me.emptyTitle")}</strong>
              <p>
                {tab === "hosting" ? (
                  <>
                    {t("me.emptyHost")} <Link href="/create">{t("home.createEvent")}</Link>
                  </>
                ) : (
                  <>
                    {t("me.emptyBrowse")} <Link href="/">{t("me.discover")}</Link>
                  </>
                )}
              </p>
            </div>
          ) : tab === "hosting" ? (
            list.map((event, i) => (
              <div key={event.id} className="host-card">
                <EventCard event={event} index={i} badge={badge} />
                <Link className="mini-btn" href={`/manage/${event.slug}`}>
                  {t("me.manageGuests")}
                </Link>
              </div>
            ))
          ) : (
            list.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} badge={badge} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
