"use client";

import Link from "next/link";
import { memo } from "react";
import type { EventItem } from "@/lib/types";
import { localizeEvent } from "@/lib/content-i18n";
import { dateParts } from "@/lib/format";
import { imageUrl } from "@/lib/image";
import { useLocale } from "./LocaleProvider";

function EventCardInner({
  event,
  badge,
}: {
  event: EventItem;
  index?: number;
  badge?: string;
}) {
  const { t, locale } = useLocale();
  const view = localizeEvent(event, locale);
  const d = dateParts(event.startAt, locale);
  // Unsplash CDN resize — skip /_next/image (slow in dev, redundant for remote CDN)
  const cover = imageUrl(event.cover, 200);

  return (
    <Link href={`/e/${event.slug}`} className="card" prefetch={false}>
      <div className="card__cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" loading="lazy" decoding="async" width={88} height={88} />
        <div className="card__date">
          <span className="card__date-m">{d.monthShort}</span>
          <span className="card__date-d">{d.day}</span>
        </div>
      </div>
      <div className="card__body">
        <div className="card__when">
          {d.weekday} · {d.time}
        </div>
        <h3 className="card__title">{view.title}</h3>
        <p className="card__loc">
          {view.location}
          <span className="card__dot">·</span>
          {view.city}
        </p>
        <div className="card__foot">
          <span className="card__host">
            <span className="card__avatar" aria-hidden>
              {view.host.slice(0, 1).toUpperCase()}
            </span>
            <span className="card__host-name">{view.host}</span>
          </span>
          <span className="card__going">
            {event.going > 0 ? t("card.going", { n: event.going }) : t("card.first")}
            {badge ? <span className="pill pill--accent">{badge}</span> : null}
          </span>
        </div>
      </div>
    </Link>
  );
}

export const EventCard = memo(EventCardInner);
