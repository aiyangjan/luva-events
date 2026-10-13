"use client";

import { RsvpPanel } from "./RsvpPanel";
import { useLocale } from "./LocaleProvider";
import type { TicketType } from "@/lib/types";

type Props = {
  eventId: string;
  slug: string;
  initialGoing: number;
  capacity: number;
  isPast: boolean;
  requireApproval: boolean;
  waitlistEnabled: boolean;
  ticketTypes: TicketType[];
  when: string;
  location: string;
  city: string;
  going: number;
  spots: number;
};

export function EventSidebar(props: Props) {
  const { t } = useLocale();
  const guestsLine =
    props.spots > 0
      ? t("event.goingSpots", { going: props.going, spots: props.spots })
      : props.waitlistEnabled
        ? t("event.goingWaitlist", { going: props.going })
        : t("event.goingSold", { going: props.going });

  return (
    <aside className="side reg-dock">
      <div className="side__meta">
        <div className="side__row">
          <span className="side__label">{t("event.dateTime")}</span>
          <span className="side__value">{props.when}</span>
        </div>
        <div className="side__row">
          <span className="side__label">{t("event.location")}</span>
          <span className="side__value">
            {props.location}
            <br />
            <span className="muted tiny">{props.city}</span>
          </span>
        </div>
        <div className="side__row">
          <span className="side__label">{t("event.guests")}</span>
          <span className="side__value">{guestsLine}</span>
        </div>
      </div>
      <RsvpPanel
        eventId={props.eventId}
        slug={props.slug}
        initialGoing={props.initialGoing}
        capacity={props.capacity}
        isPast={props.isPast}
        requireApproval={props.requireApproval}
        waitlistEnabled={props.waitlistEnabled}
        ticketTypes={props.ticketTypes}
      />
    </aside>
  );
}
