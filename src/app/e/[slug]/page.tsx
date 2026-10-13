import { notFound } from "next/navigation";
import { EventDetailView } from "@/components/EventDetailView";
import { getSessionUser } from "@/lib/auth";
import {
  canViewEvent,
  getCalendarById,
  getEventBySlug,
  getEventStatus,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) notFound();

  const user = await getSessionUser();
  if (!canViewEvent(event, user?.id)) {
    return (
      <EventDetailView
        event={null}
        calendar={null}
        isHost={false}
        isPast={false}
        isPrivateBlocked
        slug={slug}
      />
    );
  }

  const status = getEventStatus(event);
  const calendar = getCalendarById(event.calendarId) || null;
  const isHost =
    !!user &&
    (event.hostUserId === user.id || calendar?.ownerUserId === user.id);

  return (
    <EventDetailView
      event={event}
      calendar={calendar}
      isHost={isHost}
      isPast={status === "past"}
      slug={slug}
    />
  );
}
