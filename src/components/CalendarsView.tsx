"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { localizeCalendar } from "@/lib/content-i18n";
import { imageUrl } from "@/lib/image";
import type { Calendar } from "@/lib/types";

type Item = Calendar & { upcomingCount: number };

export function CalendarsView({ calendars }: { calendars: Item[] }) {
  const { t, locale } = useLocale();

  return (
    <main className="page">
      <div className="shell wide">
        <div className="page__head">
          <div>
            <h1 className="page__title">{t("cal.title")}</h1>
            <p className="page__sub">{t("cal.sub")}</p>
          </div>
        </div>
        <div className="cal-grid">
          {calendars.map((c) => {
            const view = localizeCalendar(c, locale);
            return (
              <Link key={c.id} href={`/c/${c.slug}`} className="cal-card" prefetch={false}>
                <div className="cal-card__cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(c.cover, 480)} alt="" loading="lazy" decoding="async" />
                </div>
                <div className="cal-card__body">
                  <h3>{view.name}</h3>
                  <p>{view.description}</p>
                  <div className="cal-card__meta">
                    <span>{view.city}</span>
                    <span>{t("cal.upcoming", { n: c.upcomingCount })}</span>
                    <span>{t("cal.followers", { n: c.followerIds.length })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
