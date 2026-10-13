import type { Calendar, EventItem, TicketType } from "./types";

const day = 24 * 60 * 60 * 1000;

/** Stable ticket ids for seed events (avoid Math.random hydration/store churn). */
export function defaultTicket(
  name = "Standard",
  opts?: Partial<TicketType> & { id?: string }
): TicketType {
  const { id, ...rest } = opts || {};
  return {
    id: id || `t_${name.toLowerCase().replace(/\s+/g, "_")}`,
    name,
    capacity: null,
    requireApproval: false,
    price: 0,
    ...rest,
  };
}

export function buildSeedCalendars(now = Date.now()): Calendar[] {
  const stamp = new Date(now).toISOString();
  return [
    {
      id: "cal_luva",
      slug: "luva-studio",
      name: "Luva Studio",
      description: "Design salons, builder breakfasts, and quiet nights in the city.",
      cover:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80",
      city: "Shanghai",
      followerIds: [],
      createdAt: stamp,
    },
    {
      id: "cal_indie",
      slug: "indie-lab",
      name: "Indie Lab",
      description: "Prototypes before noon. Demos without slides.",
      cover:
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=80",
      city: "Shanghai",
      followerIds: [],
      createdAt: stamp,
    },
    {
      id: "cal_night",
      slug: "night-frame",
      name: "Night Frame",
      description: "Films, neon, rooftops.",
      cover:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80",
      city: "Shanghai",
      followerIds: [],
      createdAt: stamp,
    },
  ];
}

/** Seed events start at 0 going — only real RSVPs count. */
export function buildSeedEvents(now = Date.now()): EventItem[] {
  const stamp = new Date(now).toISOString();

  return [
    {
      id: "e1",
      slug: "midnight-design-salon",
      title: "Midnight Design Salon",
      description:
        "An intimate evening for product designers and founders. Short talks, quiet music, and conversations that don't fit in Slack.",
      cover:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
      startAt: new Date(now + 2 * day).toISOString(),
      endAt: new Date(now + 2 * day + 3 * 60 * 60 * 1000).toISOString(),
      timezone: "Asia/Shanghai",
      location: "The Quiet Floor · Jing'an",
      city: "Shanghai",
      host: "Luva Studio",
      calendarId: "cal_luva",
      visibility: "public",
      capacity: 80,
      going: 0,
      requireApproval: false,
      waitlistEnabled: true,
      ticketTypes: [defaultTicket("Standard", { id: "t_e1_std" })],
      featured: true,
      tags: ["Design", "Community"],
      createdAt: stamp,
    },
    {
      id: "e2",
      slug: "builders-breakfast",
      title: "Builders Breakfast",
      description:
        "Coffee, croissants, and demos before noon. Bring a prototype or just your curiosity.",
      cover:
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
      startAt: new Date(now + 5 * day).toISOString(),
      endAt: new Date(now + 5 * day + 2 * 60 * 60 * 1000).toISOString(),
      timezone: "Asia/Shanghai",
      location: "River Roastery",
      city: "Shanghai",
      host: "Indie Lab",
      calendarId: "cal_indie",
      visibility: "public",
      capacity: 40,
      going: 0,
      requireApproval: false,
      waitlistEnabled: true,
      ticketTypes: [
        defaultTicket("Standard", { id: "t_e2_std" }),
        defaultTicket("Demo Slot", { id: "t_e2_demo", capacity: 8 }),
      ],
      tags: ["Startup", "Demo"],
      createdAt: stamp,
    },
    {
      id: "e3",
      slug: "film-night-neon",
      title: "Film Night: Neon Cities",
      description:
        "A curated screening of short films about cities after dark, followed by a rooftop hang.",
      cover:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
      startAt: new Date(now + 9 * day).toISOString(),
      endAt: new Date(now + 9 * day + 4 * 60 * 60 * 1000).toISOString(),
      timezone: "Asia/Shanghai",
      location: "Laneway Cinema",
      city: "Shanghai",
      host: "Night Frame",
      calendarId: "cal_night",
      visibility: "public",
      capacity: 120,
      going: 0,
      requireApproval: false,
      waitlistEnabled: true,
      ticketTypes: [defaultTicket("Standard", { id: "t_e3_std" })],
      tags: ["Film", "Culture"],
      createdAt: stamp,
    },
    {
      id: "e4",
      slug: "type-and-tea",
      title: "Type & Tea",
      description:
        "Typography workshop with letterpress samples and afternoon tea. Beginners welcome.",
      cover:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
      startAt: new Date(now + 12 * day).toISOString(),
      endAt: new Date(now + 12 * day + 2.5 * 60 * 60 * 1000).toISOString(),
      timezone: "Asia/Shanghai",
      location: "Paper Room",
      city: "Hangzhou",
      host: "Luva Studio",
      calendarId: "cal_luva",
      visibility: "public",
      capacity: 24,
      going: 0,
      requireApproval: true,
      waitlistEnabled: true,
      ticketTypes: [
        defaultTicket("Application", { id: "t_e4_app", requireApproval: true }),
      ],
      tags: ["Workshop", "Design"],
      createdAt: stamp,
    },
    {
      id: "e5",
      slug: "summer-rooftop-session",
      title: "Summer Rooftop Session",
      description: "Last season's sunset session — still glowing in memory.",
      cover:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
      startAt: new Date(now - 18 * day).toISOString(),
      endAt: new Date(now - 18 * day + 4 * 60 * 60 * 1000).toISOString(),
      timezone: "Asia/Shanghai",
      location: "Sky Deck",
      city: "Shanghai",
      host: "Luva Studio",
      calendarId: "cal_luva",
      visibility: "public",
      capacity: 100,
      going: 0,
      requireApproval: false,
      waitlistEnabled: false,
      ticketTypes: [defaultTicket("Standard", { id: "t_e5_std" })],
      tags: ["Music", "Social"],
      createdAt: stamp,
    },
    {
      id: "e6",
      slug: "product-critique-circle",
      title: "Product Critique Circle",
      description: "A closed past session where teams brought half-built flows for sharp feedback.",
      cover:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
      startAt: new Date(now - 40 * day).toISOString(),
      endAt: new Date(now - 40 * day + 2 * 60 * 60 * 1000).toISOString(),
      timezone: "Asia/Shanghai",
      location: "Studio B",
      city: "Beijing",
      host: "Indie Lab",
      calendarId: "cal_indie",
      visibility: "public",
      capacity: 30,
      going: 0,
      requireApproval: true,
      waitlistEnabled: false,
      ticketTypes: [
        defaultTicket("Application", { id: "t_e6_app", requireApproval: true }),
      ],
      tags: ["Product", "Critique"],
      createdAt: stamp,
    },
  ];
}
