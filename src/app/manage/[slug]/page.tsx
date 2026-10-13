"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { localizeEvent } from "@/lib/content-i18n";
import type { EventItem, RsvpRecord } from "@/lib/types";

type Counts = {
  going: number;
  pending: number;
  waitlist: number;
  checkedIn: number;
  declined: number;
};

export default function ManagePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading } = useAuth();
  const { t, te, locale } = useLocale();
  const router = useRouter();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [guests, setGuests] = useState<RsvpRecord[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const actionsFor = (status: string) => {
    if (status === "pending" || status === "waitlist") {
      return [
        { label: t("manage.approve"), action: "approve" },
        { label: t("manage.decline"), action: "decline" },
      ];
    }
    if (status === "going") {
      return [
        { label: t("manage.checkin"), action: "checkin" },
        { label: t("manage.toWaitlist"), action: "to_waitlist" },
        { label: t("manage.decline"), action: "decline" },
      ];
    }
    if (status === "checked_in") {
      return [{ label: t("manage.undoCheckin"), action: "undo_checkin" }];
    }
    return [];
  };

  const statusText = (status: string) => {
    const key = `manage.status.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const load = useCallback(async () => {
    const metaRes = await fetch(`/api/events/by-slug/${slug}`, { cache: "no-store" });
    const meta = await metaRes.json();
    if (!metaRes.ok) throw new Error(meta.error || "Event not found");
    if (!meta.isHost) throw new Error("Not authorized");

    const res = await fetch(`/api/events/${meta.event.id}/guests`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load guests");
    setEvent(data.event);
    setGuests(data.guests || []);
    setCounts(data.counts || null);
  }, [slug]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    load()
      .catch((err) => setError(te(err instanceof Error ? err.message : "Failed")))
      .finally(() => setReady(true));
  }, [user, loading, load, te]);

  const filtered = useMemo(() => {
    if (filter === "all") return guests;
    return guests.filter((g) => g.status === filter);
  }, [guests, filter]);

  async function act(rsvpId: string, action: string) {
    if (!event) return;
    setBusyId(rsvpId);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/guests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setGuests(data.guests || []);
      setCounts(data.counts || null);
      setEvent(data.event);
    } catch (err) {
      setError(te(err instanceof Error ? err.message : "Action failed"));
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !ready) {
    return (
      <main className="page">
        <div className="shell">{t("common.loading")}</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="shell narrow">
          <div className="panel">
            <h1 className="panel__title">{t("manage.title")}</h1>
            <p className="panel__sub">{t("manage.needSignIn")}</p>
            <Link
              className="btn-block"
              href={`/signin?next=${encodeURIComponent(`/manage/${slug}`)}`}
            >
              {t("nav.signIn")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (error && !event) {
    return (
      <main className="page">
        <div className="shell narrow">
          <div className="panel">
            <h1 className="panel__title">{t("manage.label")}</h1>
            <div className="toast toast--err">{error}</div>
            <button className="btn-block" type="button" onClick={() => router.push("/me")}>
              {t("manage.backMe")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!event) return null;

  const view = localizeEvent(event, locale);

  return (
    <main className="page">
      <div className="shell wide">
        <Link className="back" href={`/e/${event.slug}`}>
          {t("manage.backEvent")}
        </Link>
        <div className="page__head">
          <div>
            <p className="section-label">{t("manage.label")}</p>
            <h1 className="page__title" style={{ fontSize: "clamp(32px,5vw,48px)" }}>
              {view.title}
            </h1>
            <p className="page__sub">
              {counts
                ? t("manage.stats", {
                    going: event.going,
                    capacity: event.capacity,
                    pending: counts.pending,
                    waitlist: counts.waitlist,
                    checkedIn: counts.checkedIn,
                  })
                : `${event.going}/${event.capacity}`}
            </p>
          </div>
          <Link className="nav__cta" href={`/e/${event.slug}`}>
            {t("manage.viewPublic")}
          </Link>
        </div>

        {error ? <div className="toast toast--err">{error}</div> : null}

        <div className="tabs" style={{ marginBottom: 18 }}>
          {[
            ["all", t("manage.all")],
            ["pending", t("manage.pending")],
            ["going", t("manage.going")],
            ["waitlist", t("manage.waitlist")],
            ["checked_in", t("manage.checkedIn")],
            ["declined", t("manage.declined")],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`tab${filter === key ? " is-active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="guest-table">
          {filtered.length === 0 ? (
            <div className="empty">{t("manage.empty")}</div>
          ) : (
            filtered.map((g) => (
              <div className="guest-row" key={g.id}>
                <div>
                  <strong>{g.name}</strong>
                  <div className="muted tiny">{g.email}</div>
                </div>
                <span className={`status-pill status-pill--${g.status}`}>{statusText(g.status)}</span>
                <div className="guest-actions">
                  {actionsFor(g.status).map((a) => (
                    <button
                      key={a.action}
                      type="button"
                      className="mini-btn"
                      disabled={busyId === g.id}
                      onClick={() => act(g.id, a.action)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
