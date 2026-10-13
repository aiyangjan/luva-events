import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { hashPassword, verifyPassword } from "./password";
import { buildSeedCalendars, buildSeedEvents, defaultTicket } from "./seed";
import type {
  AppNotification,
  Calendar,
  EventItem,
  EventStatus,
  EventVisibility,
  NotificationType,
  RsvpRecord,
  RsvpStatus,
  SessionUser,
  StoreData,
  TicketType,
  User,
} from "./types";
import { ACTIVE_RSVP } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

/** URL-safe ASCII slug only — Chinese titles must not become path segments. */
function slugify(title: string): string {
  const ascii = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (ascii) return ascii;
  // Non-Latin titles (e.g. 中文) → stable fallback
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  return `event-${hash.toString(36)}`;
}

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function emptyStore(): StoreData {
  return {
    users: [],
    calendars: buildSeedCalendars(),
    events: buildSeedEvents(),
    rsvps: [],
    notifications: [],
  };
}

function syncGoing(event: EventItem, data: StoreData) {
  event.going = data.rsvps.filter(
    (r) =>
      r.eventId === event.id && (r.status === "going" || r.status === "checked_in")
  ).length;
}

function ticketTaken(data: StoreData, eventId: string, ticketTypeId: string) {
  return data.rsvps.filter(
    (r) =>
      r.eventId === eventId &&
      r.ticketTypeId === ticketTypeId &&
      (r.status === "going" || r.status === "checked_in")
  ).length;
}

function isActive(status: RsvpStatus) {
  return ACTIVE_RSVP.includes(status);
}

function pushNote(
  data: StoreData,
  input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    href?: string;
  }
) {
  data.notifications.unshift({
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    read: false,
    createdAt: new Date().toISOString(),
  });
  if (data.notifications.length > 300) {
    data.notifications = data.notifications.slice(0, 300);
  }
}

function migrate(data: StoreData): StoreData {
  if (!data.calendars) data.calendars = buildSeedCalendars();
  if (!data.users) data.users = [];
  if (!data.events) data.events = [];
  if (!data.rsvps) data.rsvps = [];
  if (!data.notifications) data.notifications = [];
  if (data.calendars.length === 0) data.calendars = buildSeedCalendars();

  const defaultCal = data.calendars[0];

  for (const u of data.users as Array<User & { passwordSalt?: string; passwordHash?: string }>) {
    if (!u.passwordSalt) u.passwordSalt = "";
    if (!u.passwordHash) u.passwordHash = "";
  }

  for (const e of data.events as Array<EventItem & { seedGoing?: number }>) {
    if (!e.calendarId) e.calendarId = defaultCal.id;
    if (!e.visibility) e.visibility = "public";
    if (typeof e.requireApproval !== "boolean") e.requireApproval = false;
    if (typeof e.waitlistEnabled !== "boolean") e.waitlistEnabled = true;
    if (!e.ticketTypes?.length) {
      e.ticketTypes = [defaultTicket("Standard", { requireApproval: e.requireApproval })];
    }
    delete e.seedGoing;
    syncGoing(e, data);
  }

  for (const r of data.rsvps) {
    if (!r.ticketTypeId) {
      const event = data.events.find((e) => e.id === r.eventId);
      r.ticketTypeId = event?.ticketTypes[0]?.id || "t_default";
    }
  }

  return data;
}

function ensureStore(): StoreData {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) {
    const seed = emptyStore();
    writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8")) as StoreData;
    const migrated = migrate(parsed);
    save(migrated);
    return migrated;
  } catch {
    const seed = emptyStore();
    writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

function save(data: StoreData) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function withStore<T>(fn: (data: StoreData) => T): T {
  const data = ensureStore();
  const result = fn(data);
  save(data);
  return result;
}

function readOnly<T>(fn: (data: StoreData) => T): T {
  return fn(ensureStore());
}

export function getEventStatus(event: EventItem, at = Date.now()): EventStatus {
  return new Date(event.endAt).getTime() < at ? "past" : "upcoming";
}

export function registerUser(name: string, email: string, password: string): User {
  const normalized = email.trim().toLowerCase();
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error("Please enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Invalid email");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");

  return withStore((data) => {
    const existing = data.users.find((u) => u.email === normalized);
    const { salt, hash } = hashPassword(password);

    if (existing) {
      if (existing.passwordHash) throw new Error("Email already registered — please sign in");
      // Claim legacy password-less account
      existing.name = trimmed;
      existing.passwordSalt = salt;
      existing.passwordHash = hash;
      return existing;
    }

    const user: User = {
      id: `u_${Date.now()}`,
      name: trimmed,
      email: normalized,
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    return user;
  });
}

export function loginUser(email: string, password: string): User {
  const normalized = email.trim().toLowerCase();
  return readOnly((data) => {
    const user = data.users.find((u) => u.email === normalized);
    if (!user) throw new Error("Invalid email or password");
    if (!user.passwordHash || !user.passwordSalt) {
      throw new Error("This account has no password yet — use Sign up with this email to set one");
    }
    if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }
    return user;
  });
}

export function getUserById(id: string): User | undefined {
  return readOnly((data) => data.users.find((u) => u.id === id));
}

export function listEvents(opts?: {
  status?: EventStatus;
  q?: string;
  calendarId?: string;
  includePrivate?: boolean;
}): EventItem[] {
  return readOnly((data) => {
    let list = [...data.events];
    if (!opts?.includePrivate) list = list.filter((e) => e.visibility !== "private");
    if (opts?.calendarId) list = list.filter((e) => e.calendarId === opts.calendarId);
    if (opts?.status) list = list.filter((e) => getEventStatus(e) === opts.status);
    if (opts?.q) {
      const q = opts.q.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.host.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    const status = opts?.status || "upcoming";
    return list.sort((a, b) =>
      status === "past"
        ? +new Date(b.startAt) - +new Date(a.startAt)
        : +new Date(a.startAt) - +new Date(b.startAt)
    );
  });
}

export function getEventBySlug(slug: string): EventItem | undefined {
  const raw = slug.trim();
  const decoded = decodeSlug(raw);
  return readOnly((data) =>
    data.events.find((e) => e.slug === raw || e.slug === decoded || e.id === raw || e.id === decoded)
  );
}

export function getEventById(id: string): EventItem | undefined {
  return readOnly((data) => data.events.find((e) => e.id === id));
}

export function ensureUserCalendar(user: SessionUser): Calendar {
  return withStore((data) => {
    const existing = data.calendars.find((c) => c.ownerUserId === user.id);
    if (existing) return existing;

    let slug = slugify(`cal-${user.name}`);
    if (slug === "cal" || slug.startsWith("event-")) {
      slug = `cal-${user.id.replace(/^u_/, "").slice(-8)}`;
    }
    const taken = new Set(data.calendars.map((c) => c.slug));
    if (taken.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

    const calendar: Calendar = {
      id: `cal_${Date.now()}`,
      slug,
      name: `${user.name}'s Calendar`,
      description: `Events hosted by ${user.name}`,
      cover:
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80",
      city: "Shanghai",
      ownerUserId: user.id,
      followerIds: [],
      createdAt: new Date().toISOString(),
    };
    data.calendars.push(calendar);
    return calendar;
  });
}

export function listCalendars(): Calendar[] {
  return readOnly((data) => [...data.calendars].sort((a, b) => a.name.localeCompare(b.name)));
}

export function getCalendarBySlug(slug: string): Calendar | undefined {
  const raw = slug.trim();
  const decoded = decodeSlug(raw);
  return readOnly((data) =>
    data.calendars.find((c) => c.slug === raw || c.slug === decoded || c.id === raw)
  );
}

export function getCalendarById(id: string): Calendar | undefined {
  return readOnly((data) => data.calendars.find((c) => c.id === id));
}

export function followCalendar(calendarId: string, userId: string): Calendar {
  return withStore((data) => {
    const cal = data.calendars.find((c) => c.id === calendarId);
    if (!cal) throw new Error("Calendar not found");
    if (!cal.followerIds.includes(userId)) {
      cal.followerIds.push(userId);
      if (cal.ownerUserId && cal.ownerUserId !== userId) {
        const follower = data.users.find((u) => u.id === userId);
        pushNote(data, {
          userId: cal.ownerUserId,
          type: "new_follower",
          title: "New follower",
          body: `${follower?.name || "Someone"} followed ${cal.name}`,
          href: `/c/${cal.slug}`,
        });
      }
    }
    return { ...cal, followerIds: [...cal.followerIds] };
  });
}

export function unfollowCalendar(calendarId: string, userId: string): Calendar {
  return withStore((data) => {
    const cal = data.calendars.find((c) => c.id === calendarId);
    if (!cal) throw new Error("Calendar not found");
    cal.followerIds = cal.followerIds.filter((id) => id !== userId);
    return { ...cal, followerIds: [...cal.followerIds] };
  });
}

export function createEvent(input: {
  title: string;
  description: string;
  cover?: string;
  startAt: string;
  endAt: string;
  location: string;
  city: string;
  capacity: number;
  tags?: string[];
  host: string;
  hostUserId: string;
  calendarId?: string;
  visibility?: EventVisibility;
  requireApproval?: boolean;
  waitlistEnabled?: boolean;
  ticketName?: string;
  ticketCapacity?: number | null;
}): EventItem {
  return withStore((data) => {
    let calendarId = input.calendarId;
    if (!calendarId) {
      const owned = data.calendars.find((c) => c.ownerUserId === input.hostUserId);
      if (owned) calendarId = owned.id;
      else {
        const cal: Calendar = {
          id: `cal_${Date.now()}`,
          slug: `cal-${input.hostUserId.replace(/^u_/, "").slice(-8)}`,
          name: `${input.host}'s Calendar`,
          description: `Events hosted by ${input.host}`,
          cover:
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80",
          city: input.city.trim() || "Shanghai",
          ownerUserId: input.hostUserId,
          followerIds: [],
          createdAt: new Date().toISOString(),
        };
        const taken = new Set(data.calendars.map((c) => c.slug));
        if (taken.has(cal.slug)) cal.slug = `${cal.slug}-${Date.now().toString(36)}`;
        data.calendars.push(cal);
        calendarId = cal.id;
      }
    }

    let slug = slugify(input.title);
    const taken = new Set(data.events.map((e) => e.slug));
    if (taken.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

    const requireApproval = Boolean(input.requireApproval);
    const ticket: TicketType = defaultTicket(input.ticketName || "Standard", {
      id: `t_${Date.now().toString(36)}`,
      requireApproval,
      capacity:
        typeof input.ticketCapacity === "number" && input.ticketCapacity > 0
          ? Math.floor(input.ticketCapacity)
          : null,
    });

    const event: EventItem = {
      id: `e_${Date.now()}`,
      slug,
      title: input.title.trim(),
      description: input.description.trim(),
      cover:
        input.cover?.trim() ||
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
      startAt: new Date(input.startAt).toISOString(),
      endAt: new Date(input.endAt).toISOString(),
      timezone: "Asia/Shanghai",
      location: input.location.trim(),
      city: input.city.trim(),
      host: input.host.trim(),
      hostUserId: input.hostUserId,
      calendarId: calendarId!,
      visibility: input.visibility || "public",
      capacity: Math.max(1, Math.floor(input.capacity)),
      going: 0,
      requireApproval,
      waitlistEnabled: input.waitlistEnabled !== false,
      ticketTypes: [ticket],
      tags: input.tags?.length ? input.tags : ["Community"],
      createdAt: new Date().toISOString(),
    };
    data.events.unshift(event);
    return event;
  });
}

export function getUserRsvp(eventId: string, userId: string): RsvpRecord | undefined {
  return readOnly((data) =>
    data.rsvps.find((r) => r.eventId === eventId && r.userId === userId && isActive(r.status))
  );
}

export function listEventGuests(eventId: string): RsvpRecord[] {
  return readOnly((data) =>
    data.rsvps
      .filter((r) => r.eventId === eventId && r.status !== "cancelled")
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  );
}

export function assertEventHost(event: EventItem, userId: string) {
  if (event.hostUserId !== userId) {
    const cal = getCalendarById(event.calendarId);
    if (cal?.ownerUserId !== userId) throw new Error("Not authorized");
  }
}

export function canViewEvent(event: EventItem, userId?: string | null): boolean {
  if (event.visibility !== "private") return true;
  if (!userId) return false;
  if (event.hostUserId === userId) return true;
  const cal = getCalendarById(event.calendarId);
  if (cal?.ownerUserId === userId) return true;
  return Boolean(getUserRsvp(event.id, userId));
}

export function addRsvp(input: {
  eventId: string;
  user: SessionUser;
  ticketTypeId?: string;
}): { rsvp: RsvpRecord; event: EventItem } {
  return withStore((data) => {
    const event = data.events.find((e) => e.id === input.eventId);
    if (!event) throw new Error("Event not found");
    if (getEventStatus(event) === "past") throw new Error("Event already ended");

    const ticket =
      event.ticketTypes.find((t) => t.id === input.ticketTypeId) || event.ticketTypes[0];
    if (!ticket) throw new Error("No ticket type available");

    const existing = data.rsvps.find(
      (r) => r.eventId === input.eventId && r.userId === input.user.id
    );
    if (existing && isActive(existing.status)) {
      throw new Error(
        existing.status === "pending"
          ? "Application pending"
          : existing.status === "waitlist"
            ? "Already on waitlist"
            : "Already registered"
      );
    }

    syncGoing(event, data);
    const needApproval = ticket.requireApproval || event.requireApproval;
    const eventFull = event.going >= event.capacity;
    const ticketFull =
      typeof ticket.capacity === "number" &&
      ticketTaken(data, event.id, ticket.id) >= ticket.capacity;

    let status: RsvpStatus;
    if (needApproval) status = "pending";
    else if ((eventFull || ticketFull) && event.waitlistEnabled) status = "waitlist";
    else if (eventFull || ticketFull) throw new Error(ticketFull ? "Ticket type sold out" : "Sold out");
    else status = "going";

    let rsvp: RsvpRecord;
    if (existing) {
      existing.status = status;
      existing.name = input.user.name;
      existing.email = input.user.email;
      existing.ticketTypeId = ticket.id;
      existing.createdAt = new Date().toISOString();
      delete existing.checkedInAt;
      rsvp = existing;
    } else {
      rsvp = {
        id: `r_${Date.now()}`,
        eventId: input.eventId,
        userId: input.user.id,
        ticketTypeId: ticket.id,
        name: input.user.name,
        email: input.user.email,
        createdAt: new Date().toISOString(),
        status,
      };
      data.rsvps.push(rsvp);
    }

    syncGoing(event, data);

    if (event.hostUserId) {
      pushNote(data, {
        userId: event.hostUserId,
        type:
          status === "pending"
            ? "rsvp_pending"
            : status === "waitlist"
              ? "rsvp_waitlist"
              : "rsvp_approved",
        title:
          status === "pending"
            ? "New application"
            : status === "waitlist"
              ? "Waitlist join"
              : "New guest",
        body: `${input.user.name} → ${event.title} (${status})`,
        href: `/manage/${event.slug}`,
      });
    }

    if (status === "waitlist") {
      pushNote(data, {
        userId: input.user.id,
        type: "rsvp_waitlist",
        title: "You're on the waitlist",
        body: `${event.title} is full. We'll notify you if a spot opens.`,
        href: `/e/${event.slug}`,
      });
    }

    return { rsvp, event: { ...event } };
  });
}

function promoteWaitlist(event: EventItem, data: StoreData) {
  syncGoing(event, data);
  while (event.going < event.capacity) {
    const next = data.rsvps
      .filter((r) => r.eventId === event.id && r.status === "waitlist")
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))[0];
    if (!next) break;

    const ticket = event.ticketTypes.find((t) => t.id === next.ticketTypeId);
    if (
      ticket &&
      typeof ticket.capacity === "number" &&
      ticketTaken(data, event.id, ticket.id) >= ticket.capacity
    ) {
      // Skip this guest if their ticket type is full; try later ones
      next.status = "waitlist";
      // Mark temporarily so we don't infinite loop — move to end by bumping createdAt slightly
      const others = data.rsvps.filter(
        (r) =>
          r.eventId === event.id &&
          r.status === "waitlist" &&
          r.id !== next.id
      );
      if (others.length === 0) break;
      next.createdAt = new Date(Date.now() + 1).toISOString();
      continue;
    }

    next.status = "going";
    pushNote(data, {
      userId: next.userId,
      type: "rsvp_promoted",
      title: "You're in!",
      body: `A spot opened for ${event.title}. You're now going.`,
      href: `/e/${event.slug}`,
    });
    syncGoing(event, data);
  }
}

export function cancelRsvp(eventId: string, userId: string): EventItem {
  return withStore((data) => {
    const event = data.events.find((e) => e.id === eventId);
    if (!event) throw new Error("Event not found");
    const rsvp = data.rsvps.find(
      (r) => r.eventId === eventId && r.userId === userId && isActive(r.status)
    );
    if (!rsvp) throw new Error("No active RSVP");
    rsvp.status = "cancelled";
    delete rsvp.checkedInAt;
    syncGoing(event, data);
    promoteWaitlist(event, data);

    if (event.hostUserId) {
      pushNote(data, {
        userId: event.hostUserId,
        type: "rsvp_cancelled",
        title: "Guest cancelled",
        body: `${rsvp.name} cancelled for ${event.title}`,
        href: `/manage/${event.slug}`,
      });
    }
    return { ...event };
  });
}

export function updateGuestStatus(input: {
  eventId: string;
  rsvpId: string;
  hostUserId: string;
  action: "approve" | "decline" | "checkin" | "undo_checkin" | "to_waitlist";
}): { rsvp: RsvpRecord; event: EventItem } {
  return withStore((data) => {
    const event = data.events.find((e) => e.id === input.eventId);
    if (!event) throw new Error("Event not found");
    const cal = data.calendars.find((c) => c.id === event.calendarId);
    if (event.hostUserId !== input.hostUserId && cal?.ownerUserId !== input.hostUserId) {
      throw new Error("Not authorized");
    }
    const rsvp = data.rsvps.find((r) => r.id === input.rsvpId && r.eventId === input.eventId);
    if (!rsvp) throw new Error("Guest not found");

    if (input.action === "approve") {
      if (rsvp.status !== "pending" && rsvp.status !== "waitlist") {
        throw new Error("Only pending/waitlist can be approved");
      }
      syncGoing(event, data);
      const ticket = event.ticketTypes.find((t) => t.id === rsvp.ticketTypeId);
      const ticketFull =
        ticket &&
        typeof ticket.capacity === "number" &&
        ticketTaken(data, event.id, ticket.id) >= ticket.capacity;

      if (event.going >= event.capacity || ticketFull) {
        if (event.waitlistEnabled) {
          rsvp.status = "waitlist";
          pushNote(data, {
            userId: rsvp.userId,
            type: "rsvp_waitlist",
            title: "Moved to waitlist",
            body: `${event.title} is full — you're waitlisted.`,
            href: `/e/${event.slug}`,
          });
        } else throw new Error("Event is full");
      } else {
        rsvp.status = "going";
        pushNote(data, {
          userId: rsvp.userId,
          type: "rsvp_approved",
          title: "You're approved",
          body: `Host approved your request for ${event.title}.`,
          href: `/e/${event.slug}`,
        });
      }
    } else if (input.action === "decline") {
      rsvp.status = "declined";
      delete rsvp.checkedInAt;
      pushNote(data, {
        userId: rsvp.userId,
        type: "rsvp_declined",
        title: "Request declined",
        body: `Your request for ${event.title} was declined.`,
        href: `/e/${event.slug}`,
      });
    } else if (input.action === "checkin") {
      if (rsvp.status !== "going" && rsvp.status !== "checked_in") {
        throw new Error("Only approved guests can check in");
      }
      rsvp.status = "checked_in";
      rsvp.checkedInAt = new Date().toISOString();
    } else if (input.action === "undo_checkin") {
      if (rsvp.status !== "checked_in") throw new Error("Not checked in");
      rsvp.status = "going";
      delete rsvp.checkedInAt;
    } else if (input.action === "to_waitlist") {
      rsvp.status = "waitlist";
      delete rsvp.checkedInAt;
    }

    syncGoing(event, data);
    if (input.action === "decline" || input.action === "to_waitlist") {
      promoteWaitlist(event, data);
    }
    return { rsvp: { ...rsvp }, event: { ...event } };
  });
}

export function listUserRsvps(userId: string): Array<RsvpRecord & { event: EventItem }> {
  return readOnly((data) =>
    data.rsvps
      .filter((r) => r.userId === userId && isActive(r.status))
      .map((r) => {
        const event = data.events.find((e) => e.id === r.eventId);
        return event ? { ...r, event } : null;
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          +new Date(a!.event.startAt) - +new Date(b!.event.startAt)
      ) as Array<RsvpRecord & { event: EventItem }>
  );
}

export function listUserGoingEvents(userId: string): EventItem[] {
  return listUserRsvps(userId)
    .filter((r) => r.status === "going" || r.status === "checked_in")
    .map((r) => r.event);
}

export function listUserHostedEvents(userId: string): EventItem[] {
  return readOnly((data) => {
    const calIds = new Set(
      data.calendars.filter((c) => c.ownerUserId === userId).map((c) => c.id)
    );
    return data.events
      .filter((e) => e.hostUserId === userId || calIds.has(e.calendarId))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  });
}

export function guestCounts(eventId: string) {
  return readOnly((data) => {
    const list = data.rsvps.filter((r) => r.eventId === eventId);
    const count = (s: RsvpStatus) => list.filter((r) => r.status === s).length;
    return {
      going: count("going") + count("checked_in"),
      pending: count("pending"),
      waitlist: count("waitlist"),
      checkedIn: count("checked_in"),
      declined: count("declined"),
    };
  });
}

export function listNotifications(userId: string): AppNotification[] {
  return readOnly((data) =>
    data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  );
}

export function markNotificationsRead(userId: string, ids?: string[]) {
  return withStore((data) => {
    let changed = 0;
    for (const n of data.notifications) {
      if (n.userId !== userId || n.read) continue;
      if (!ids || ids.includes(n.id)) {
        n.read = true;
        changed += 1;
      }
    }
    return { changed };
  });
}

export function toSessionUser(user: User): SessionUser {
  return { id: user.id, name: user.name, email: user.email };
}

/** @deprecated use registerUser / loginUser */
export function upsertUser(name: string, email: string): User {
  throw new Error("Password required — use register/login");
}
