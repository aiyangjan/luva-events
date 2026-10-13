"use client";

import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { FollowButton } from "@/components/FollowButton";
import { useLocale } from "@/components/LocaleProvider";
import { localizeCalendar } from "@/lib/content-i18n";
import { groupEventsByDay } from "@/lib/format";
import type { Calendar, EventItem } from "@/lib/types";

export function CalendarDetailView({
  calendar,
  upcoming,
  past,
}: {
  calendar: Calendar;
  upcoming: EventItem[];
  past: EventItem[];
}) {
  const { t, locale } = useLocale();
  const view = localizeCalendar(calendar, locale);
  const groups = groupEventsByDay(upcoming, locale);

  return (
    <main className="page">
      <div className="shell">
        <section className="cal-profile">
          <div className="cal-profile__cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={calendar.cover} alt="" />
          </div>
          <div className="cal-profile__body">
            <h1 className="page__title" style={{ fontSize: "clamp(28px,5vw,40px)" }}>
              {view.name}
            </h1>
            <p className="page__sub">{view.description}</p>
            <div className="cal-card__meta" style={{ marginTop: 12 }}>
              <span>{view.city}</span>
              <span>{t("cal.followers", { n: calendar.followerIds.length })}</span>
              <span>{t("cal.upcoming", { n: upcoming.length })}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <FollowButton
                slug={calendar.slug}
                initialFollowing={false}
                initialCount={calendar.followerIds.length}
              />
            </div>
          </div>
        </section>

        <div className="page__head" style={{ marginTop: 8 }}>
          <h2 className="page__title" style={{ fontSize: 28 }}>
            {t("cal.events")}
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="empty" style={{ marginBottom: 36 }}>
            <strong>{t("cal.emptyUpcoming")}</strong>
            <p>{t("cal.emptyHint")}</p>
          </div>
        ) : (
          groups.map((group) => (
            <div className="day-group" key={group.label + group.items[0]?.id}>
              <h3 className="day-group__label">{group.label}</h3>
              <div className="grid">
                {group.items.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            </div>
          ))
        )}

        {past.length > 0 ? (
          <>
            <h2 className="section-label">{t("cal.past")}</h2>
            <div className="grid">
              {past.map((e, i) => (
                <EventCard key={e.id} event={e} index={i} />
              ))}
            </div>
          </>
        ) : null}

        <p style={{ marginTop: 28 }}>
          <Link className="back" href="/calendars">
            {t("cal.all")}
          </Link>
        </p>
      </div>
    </main>
  );
}
