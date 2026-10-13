"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { RsvpRecord, TicketType } from "@/lib/types";
import { localizePlain } from "@/lib/content-i18n";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

type Props = {
  eventId: string;
  slug: string;
  initialGoing: number;
  capacity: number;
  isPast: boolean;
  requireApproval: boolean;
  waitlistEnabled: boolean;
  ticketTypes: TicketType[];
};

export function RsvpPanel({
  eventId,
  slug,
  initialGoing,
  capacity,
  isPast,
  requireApproval,
  waitlistEnabled,
  ticketTypes,
}: Props) {
  const { user, loading: authLoading } = useAuth();
  const { t, te, locale } = useLocale();
  const [going, setGoing] = useState(initialGoing);
  const [rsvp, setRsvp] = useState<RsvpRecord | null>(null);
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spots = Math.max(capacity - going, 0);
  const selected = ticketTypes.find((x) => x.id === ticketTypeId) || ticketTypes[0];

  const statusLabel = (status: string) => {
    if (status === "going") return t("rsvp.statusGoing");
    if (status === "pending") return t("rsvp.statusPending");
    if (status === "waitlist") return t("rsvp.statusWaitlist");
    if (status === "checked_in") return t("rsvp.statusCheckedIn");
    return status;
  };

  const refreshStatus = useCallback(async () => {
    const res = await fetch(`/api/rsvp?eventId=${encodeURIComponent(eventId)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setRsvp(data.rsvp ?? null);
    if (typeof data.going === "number") setGoing(data.going);
    if (!ticketTypeId && data.ticketTypes?.[0]?.id) {
      setTicketTypeId(data.ticketTypes[0].id);
    }
  }, [eventId, ticketTypeId]);

  useEffect(() => {
    if (!authLoading) refreshStatus().catch(() => setRsvp(null));
  }, [authLoading, refreshStatus, user?.id]);

  async function join() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ticketTypeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "RSVP failed");
      setRsvp(data.rsvp);
      setGoing(data.going ?? data.event?.going ?? going);
      const st = data.rsvp?.status;
      setMessage(
        st === "pending"
          ? t("rsvp.msgPending")
          : st === "waitlist"
            ? t("rsvp.msgWaitlist")
            : t("rsvp.msgGoing")
      );
    } catch (err) {
      setError(te(err instanceof Error ? err.message : "RSVP failed", "rsvp.failed"));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/rsvp?eventId=${encodeURIComponent(eventId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      setRsvp(null);
      setGoing(data.going ?? data.event?.going ?? Math.max(going - 1, 0));
      setMessage(t("rsvp.msgCancelled"));
    } catch (err) {
      setError(te(err instanceof Error ? err.message : "Cancel failed", "rsvp.cancelFailed"));
    } finally {
      setBusy(false);
    }
  }

  const ctaLabel = busy
    ? t("rsvp.submit")
    : spots <= 0
      ? t("rsvp.waitlist")
      : requireApproval || selected?.requireApproval
        ? t("rsvp.request")
        : t("rsvp.register");

  if (isPast) {
    return (
      <div className="rsvp-box">
        <div className="toast">{t("rsvp.ended")}</div>
      </div>
    );
  }

  if (authLoading) {
    return <p className="muted tiny">{t("rsvp.checking")}</p>;
  }

  if (!user) {
    return (
      <div className="rsvp-box">
        <p className="rsvp-lead">{t("rsvp.welcome")}</p>
        <Link className="btn-block" href={`/signin?next=${encodeURIComponent(`/e/${slug}`)}`}>
          {t("rsvp.signInRegister")}
        </Link>
        <p className="muted tiny center">
          {spots > 0
            ? t("rsvp.goingSpots", { going, spots })
            : `${going} · ${waitlistEnabled ? t("rsvp.waitlistOpen") : t("rsvp.soldOut")}`}
        </p>
      </div>
    );
  }

  if (rsvp) {
    const ticketName =
      localizePlain(
        ticketTypes.find((x) => x.id === rsvp.ticketTypeId)?.name || "Standard",
        locale
      ) || "Standard";
    return (
      <div className="rsvp-box">
        <div
          className={`toast${rsvp.status === "pending" || rsvp.status === "waitlist" ? " toast--warn" : ""}`}
        >
          {statusLabel(rsvp.status)}
        </div>
        <p className="muted tiny">
          {t("rsvp.guestsTicket", { going, capacity, ticket: ticketName })}
        </p>
        <button className="btn-block btn-block--ghost" type="button" disabled={busy} onClick={cancel}>
          {busy ? t("rsvp.cancelling") : t("rsvp.cancel")}
        </button>
        {message ? <div className="toast">{message}</div> : null}
        {error ? <div className="toast toast--err">{error}</div> : null}
      </div>
    );
  }

  if (spots <= 0 && !waitlistEnabled) {
    return <div className="toast toast--err">{t("rsvp.soldOutTitle")}</div>;
  }

  return (
    <div className="rsvp-box">
      <p className="rsvp-lead">{t("rsvp.registerAs", { name: user.name })}</p>
      {ticketTypes.length > 0 ? (
        <div className="ticket-list">
          {ticketTypes.map((ticket) => {
            const active = (ticketTypeId || ticketTypes[0]?.id) === ticket.id;
            return (
              <button
                key={ticket.id}
                type="button"
                className={`ticket-opt${active ? " is-active" : ""}`}
                onClick={() => setTicketTypeId(ticket.id)}
              >
                <span className="ticket-opt__name">{localizePlain(ticket.name, locale)}</span>
                <span className="ticket-opt__meta">
                  {ticket.price > 0 ? `$${ticket.price}` : t("rsvp.free")}
                  {ticket.requireApproval ? ` · ${t("rsvp.approval")}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      <button className="btn-block" type="button" disabled={busy} onClick={join}>
        {ctaLabel}
      </button>
      {requireApproval || selected?.requireApproval ? (
        <p className="muted tiny center">{t("rsvp.needApproval")}</p>
      ) : null}
      {spots <= 0 && waitlistEnabled ? (
        <p className="muted tiny center">{t("rsvp.fullWaitlist")}</p>
      ) : (
        <p className="muted tiny center">{t("rsvp.goingLeft", { going, spots })}</p>
      )}
      {message ? <div className="toast">{message}</div> : null}
      {error ? <div className="toast toast--err">{error}</div> : null}
    </div>
  );
}
