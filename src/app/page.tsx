import { EventTabs } from "@/components/EventTabs";
import { listEvents } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const upcoming = listEvents({ status: "upcoming" });
  const past = listEvents({ status: "past" });

  return (
    <main className="page">
      <div className="shell">
        <EventTabs upcoming={upcoming} past={past} />
      </div>
    </main>
  );
}
