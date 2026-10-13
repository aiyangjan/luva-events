import { CalendarsView } from "@/components/CalendarsView";
import { listCalendars, listEvents } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function CalendarsPage() {
  const calendars = listCalendars().map((c) => ({
    ...c,
    upcomingCount: listEvents({ calendarId: c.id, status: "upcoming" }).length,
  }));

  return <CalendarsView calendars={calendars} />;
}
