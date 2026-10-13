import { notFound } from "next/navigation";
import { CalendarDetailView } from "@/components/CalendarDetailView";
import { getCalendarBySlug, listEvents } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const calendar = getCalendarBySlug(slug);
  if (!calendar) notFound();

  const upcoming = listEvents({ calendarId: calendar.id, status: "upcoming" });
  const past = listEvents({ calendarId: calendar.id, status: "past" });

  return <CalendarDetailView calendar={calendar} upcoming={upcoming} past={past} />;
}
