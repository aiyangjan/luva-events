"use client";

import Link from "next/link";
import { EventSidebar } from "@/components/EventSidebar";
import { useLocale } from "@/components/LocaleProvider";
import { localizeCalendar, localizeEvent } from "@/lib/content-i18n";
import { dateParts, formatRange } from "@/lib/format";
import { imageUrl } from "@/lib/image";
import type { Calendar, EventItem } from "@/lib/types";

export function EventDetailView({
  event,
  calendar,
  isHost,
  isPast,
  isPrivateBlocked,
  slug,
}: {
  event: EventItem | null;
  calendar: Calendar | null;
  isHost: boolean;
  isPast: boolean;
  isPrivateBlocked?: boolean;
  slug: string;
}) {
  const { t, locale } = useLocale();

  if (isPrivateBlocked || !event) {
    return (
      <main className="page">
        <div className="shell narrow">
          <div className="panel">
            <h1 className="panel__title">{t("event.privateTitle")}</h1>
            <p className="panel__sub">{t("event.privateBody")}</p>
            <Link className="btn-block" href={`/signin?next=${encodeURIComponent(`/e/${slug}`)}`}>
              {t("nav.signIn")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const view = localizeEvent(event, locale);
  const cal = calendar ? localizeCalendar(calendar, locale) : null;
  const d = dateParts(event.startAt, locale);
  const spots = Math.max(event.capacity - event.going, 0);
  const when = formatRange(event.startAt, event.endAt, locale);

  return (
    <main className="page page--event">
      <div className="shell wide">
        <div className="detail">
          <article>
            <div className="detail__cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(event.cover, 960)}
                alt=""
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div className="detail__content detail__content--flush">
              <p className="detail__kicker">
                {locale === "zh"
                  ? `${d.weekday} ${d.month}${d.day}日`
                  : `${d.weekday}, ${d.month} ${d.day}`}
                {isPast ? ` · ${t("event.past")}` : ""}
                {event.visibility === "private" ? ` · ${t("event.private")}` : ""}
              </p>
              <h1 className="detail__title">{view.title}</h1>
              <div className="detail__hostline">
                <span className="card__avatar" aria-hidden>
                  {view.host.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <div className="detail__host-name">{t("event.by", { name: view.host })}</div>
                  {cal ? (
                    <Link className="detail__cal-link" href={`/c/${calendar!.slug}`}>
                      {cal.name}
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="detail-meta">
                <div className="detail-meta__row">
                  <span className="detail-meta__icon" aria-hidden>
                    ▢
                  </span>
                  <div>
                    <strong>{when}</strong>
                    <span className="muted tiny">{event.timezone || t("event.localTime")}</span>
                  </div>
                </div>
                <div className="detail-meta__row">
                  <span className="detail-meta__icon" aria-hidden>
                    ○
                  </span>
                  <div>
                    <strong>{view.location}</strong>
                    <span className="muted tiny">{view.city}</span>
                  </div>
                </div>
              </div>

              <h2 className="section-label" style={{ marginTop: 28 }}>
                {t("event.about")}
              </h2>
              <p className="detail__desc">{view.description}</p>
              {view.tags.length ? (
                <div className="detail__tags">
                  {view.tags.map((tag) => (
                    <span className="pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {isHost ? (
                <div style={{ marginTop: 20 }}>
                  <Link className="nav__cta" href={`/manage/${event.slug}`}>
                    {t("event.manage")}
                  </Link>
                </div>
              ) : null}
            </div>
          </article>

          <EventSidebar
            eventId={event.id}
            slug={event.slug}
            initialGoing={event.going}
            capacity={event.capacity}
            isPast={isPast}
            requireApproval={event.requireApproval}
            waitlistEnabled={event.waitlistEnabled}
            ticketTypes={view.ticketTypes}
            when={when}
            location={view.location}
            city={view.city}
            going={event.going}
            spots={spots}
          />
        </div>
      </div>
    </main>
  );
}
