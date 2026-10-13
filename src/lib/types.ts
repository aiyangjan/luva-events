export type EventStatus = "upcoming" | "past";
export type EventVisibility = "public" | "private";
export type RsvpStatus =
  | "going"
  | "pending"
  | "waitlist"
  | "cancelled"
  | "declined"
  | "checked_in";

export type NotificationType =
  | "rsvp_pending"
  | "rsvp_approved"
  | "rsvp_declined"
  | "rsvp_waitlist"
  | "rsvp_promoted"
  | "rsvp_cancelled"
  | "new_follower";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
}

export interface TicketType {
  id: string;
  name: string;
  capacity: number | null;
  requireApproval: boolean;
  price: number;
}

export interface Calendar {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover: string;
  city: string;
  ownerUserId?: string;
  followerIds: string[];
  createdAt: string;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover: string;
  startAt: string;
  endAt: string;
  timezone: string;
  location: string;
  city: string;
  host: string;
  hostUserId?: string;
  calendarId: string;
  visibility: EventVisibility;
  capacity: number;
  going: number;
  requireApproval: boolean;
  waitlistEnabled: boolean;
  ticketTypes: TicketType[];
  featured?: boolean;
  tags: string[];
  createdAt: string;
}

export interface RsvpRecord {
  id: string;
  eventId: string;
  userId: string;
  ticketTypeId: string;
  name: string;
  email: string;
  createdAt: string;
  status: RsvpStatus;
  checkedInAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface StoreData {
  users: User[];
  calendars: Calendar[];
  events: EventItem[];
  rsvps: RsvpRecord[];
  notifications: AppNotification[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export const ACTIVE_RSVP: RsvpStatus[] = [
  "going",
  "pending",
  "waitlist",
  "checked_in",
];
