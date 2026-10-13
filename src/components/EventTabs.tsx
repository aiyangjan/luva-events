"use client";

import { useMemo, useState } from "react";
import type { EventItem, EventStatus } from "@/lib/types";
import { localizeEvent } from "@/lib/content-i18n";
import { groupEventsByDay } from "@/lib/format";
import { EventCard } from "./EventCard";
import { useLocale } from "./LocaleProvider";

export function EventTabs({
  upcoming,
  past,
}: {
  upcoming: EventItem[];
  past: EventItem[];
}) {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<EventStatus>("upcoming");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const source = tab === "upcoming" ? upcoming : past;
    const query = q.trim().toLowerCase();
    if (!query) return source;
    return source.filter((e) => {
      const view = localizeEvent(e, locale);
      return (
        view.title.toLowerCase().includes(query) ||
        view.city.toLowerCase().includes(query) ||
        view.location.toLowerCase().includes(query) ||
        view.host.toLowerCase().includes(query) ||
        view.tags.some((x) => x.toLowerCase().includes(query)) ||
        e.title.toLowerCase().includes(query) ||
        e.city.toLowerCase().includes(query)
      );
    });
  }, [tab, upcoming, past, q, locale]);

  const groups = useMemo(() => groupEventsByDay(filtered, locale), [filtered, locale]);
  const tabLabel = tab === "upcoming" ? t("home.upcoming") : t("home.past");

  return (
    <section id="events">
      <div className="page__head">
        <h1 className="page__title">{t("home.events")}</h1>
        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`tab${tab === "upcoming" ? " is-active" : ""}`}
            aria-selected={tab === "upcoming"}
            onClick={() => setTab("upcoming")}
          >
            {t("home.upcoming")}
            <span className="tab__count">{upcoming.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            className={`tab${tab === "past" ? " is-active" : ""}`}
            aria-selected={tab === "past"}
            onClick={() => setTab("past")}
          >
            {t("home.past")}
            <span className="tab__count">{past.length}</span>
          </button>
        </div>
      </div>

      <div className="search">
        <span className="search__icon" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("home.search")}
          aria-label={t("home.search")}
        />
        {q ? (
          <button
            type="button"
            className="search__clear"
            aria-label="Clear"
            onClick={() => setQ("")}
          >
            ×
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty__icon" aria-hidden />
          <strong>{t("home.emptyTitle", { tab: tabLabel })}</strong>
          <p>
            {q.trim()
              ? t("home.emptySearch", { q: q.trim() })
              : tab === "upcoming"
                ? t("home.emptyUpcoming")
                : t("home.emptyPast")}
          </p>
          {tab === "upcoming" && !q.trim() ? (
            <a className="nav__cta" href="/create" style={{ marginTop: 14, display: "inline-flex" }}>
              {t("home.createEvent")}
            </a>
          ) : null}
        </div>
      ) : (
        groups.map((group) => (
          <div className="day-group" key={`${group.label}-${group.items[0]?.id}`}>
            <h2 className="day-group__label">{group.label}</h2>
            <div className="grid">
              {group.items.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
