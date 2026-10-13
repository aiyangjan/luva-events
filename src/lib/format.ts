import type { Locale } from "./i18n";
import { localeTag, translate } from "./i18n";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dateParts(iso: string, locale: Locale = "en") {
  const tag = localeTag(locale);
  const d = new Date(iso);
  const month = new Intl.DateTimeFormat(tag, { month: "short" }).format(d);
  return {
    month,
    monthShort: locale === "zh" ? month : month.toUpperCase(),
    day: new Intl.DateTimeFormat(tag, { day: "numeric" }).format(d),
    weekday: new Intl.DateTimeFormat(tag, { weekday: "short" }).format(d),
    weekdayLong: new Intl.DateTimeFormat(tag, { weekday: "long" }).format(d),
    time: new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit" }).format(d),
  };
}

export function formatRange(startIso: string, endIso: string, locale: Locale = "en") {
  const s = dateParts(startIso, locale);
  const e = dateParts(endIso, locale);
  if (locale === "zh") {
    return `${s.weekday} ${s.month}${s.day}日 · ${s.time} – ${e.time}`;
  }
  return `${s.weekday}, ${s.month} ${s.day} · ${s.time} – ${e.time}`;
}

export type DateGroupKey = "today" | "tomorrow" | "this_week" | "later" | "past";

export function dateGroupKey(iso: string, now = new Date()): DateGroupKey {
  const d = startOfDay(new Date(iso));
  const today = startOfDay(now);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "past";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 7) return "this_week";
  return "later";
}

/** Group events for day sections (labels depend on locale). */
export function groupEventsByDay<T extends { startAt: string }>(events: T[], locale: Locale = "en") {
  const buckets = new Map<string, { key: DateGroupKey; label: string; items: T[] }>();
  for (const event of events) {
    const day = startOfDay(new Date(event.startAt));
    const id = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const key = dateGroupKey(event.startAt);
    if (!buckets.has(id)) {
      const p = dateParts(event.startAt, locale);
      let label: string;
      if (key === "today") label = translate(locale, "home.today");
      else if (key === "tomorrow") label = translate(locale, "home.tomorrow");
      else if (key === "this_week") label = p.weekdayLong;
      else if (locale === "zh") label = `${p.weekdayLong} ${p.month}${p.day}日`;
      else label = `${p.weekdayLong}, ${p.month} ${p.day}`;
      buckets.set(id, { key, label, items: [] });
    }
    buckets.get(id)!.items.push(event);
  }
  return Array.from(buckets.values());
}
