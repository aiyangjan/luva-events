"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CoverUploader } from "@/components/CoverUploader";
import { useLocale } from "@/components/LocaleProvider";

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreatePage() {
  const { user, loading } = useAuth();
  const { t, te, locale } = useLocale();
  const router = useRouter();

  const defaults = useMemo(() => {
    const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return { start: toLocalInputValue(start), end: toLocalInputValue(end) };
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState(locale === "zh" ? "上海" : "Shanghai");
  const [startAt, setStartAt] = useState(defaults.start);
  const [endAt, setEndAt] = useState(defaults.end);
  const [capacity, setCapacity] = useState(40);
  const [tags, setTags] = useState(locale === "zh" ? "社区" : "Community");
  const [cover, setCover] = useState(
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
  );
  const [requireApproval, setRequireApproval] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(true);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [ticketName, setTicketName] = useState(locale === "zh" ? "标准票" : "Standard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/signin?next=${encodeURIComponent("/create")}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          city,
          startAt,
          endAt,
          capacity,
          tags,
          cover: cover || undefined,
          requireApproval,
          waitlistEnabled,
          visibility,
          ticketName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      router.push(`/e/${data.event.slug}`);
      router.refresh();
    } catch (err) {
      setError(te(err instanceof Error ? err.message : "Create failed", "create.failed"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="shell">
          <div className="skeleton-block" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="shell narrow">
          <div className="panel">
            <h1 className="panel__title">{t("create.needSignInTitle")}</h1>
            <p className="panel__sub">{t("create.needSignIn")}</p>
            <Link className="btn-block" href={`/signin?next=${encodeURIComponent("/create")}`}>
              {t("nav.signIn")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell wide">
        <div className="create-layout">
          <div>
            <Link className="back" href="/">
              {t("create.cancel")}
            </Link>
            <h1 className="page__title" style={{ marginBottom: 8 }}>
              {t("create.title")}
            </h1>
            <p className="page__sub" style={{ marginBottom: 22 }}>
              {t("create.hostingAs", { name: user.name })}
            </p>

            <form className="form" onSubmit={onSubmit}>
              <label>
                {t("create.eventName")}
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("create.eventNamePh")}
                  autoFocus
                />
              </label>
              <label>
                {t("create.description")}
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("create.descriptionPh")}
                />
              </label>
              <div className="form-row">
                <label>
                  {t("create.start")}
                  <input
                    required
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </label>
                <label>
                  {t("create.end")}
                  <input required type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t("create.location")}
                  <input
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t("create.locationPh")}
                  />
                </label>
                <label>
                  {t("create.city")}
                  <input required value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t("create.capacity")}
                  <input
                    required
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                  />
                </label>
                <label>
                  {t("create.ticketName")}
                  <input value={ticketName} onChange={(e) => setTicketName(e.target.value)} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t("create.tags")}
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("create.tagsPh")} />
                </label>
                <label>
                  {t("create.visibility")}
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                  >
                    <option value="public">{t("create.public")}</option>
                    <option value="private">{t("create.private")}</option>
                  </select>
                </label>
              </div>
              <div className="check-row">
                <label>
                  <input
                    type="checkbox"
                    checked={requireApproval}
                    onChange={(e) => setRequireApproval(e.target.checked)}
                  />
                  {t("create.requireApproval")}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={waitlistEnabled}
                    onChange={(e) => setWaitlistEnabled(e.target.checked)}
                  />
                  {t("create.waitlist")}
                </label>
              </div>
              <button type="submit" disabled={busy}>
                {busy ? t("create.publishing") : t("create.publish")}
              </button>
              {error ? <div className="toast toast--err">{error}</div> : null}
            </form>
          </div>

          <div>
            <CoverUploader value={cover} onChange={setCover} />
            <div className="create-preview__card" style={{ marginTop: 14 }}>
              <div className="card__when">{title || t("create.untitled")}</div>
              <p className="muted tiny" style={{ margin: "6px 0 0" }}>
                {location || t("create.location")} · {city}
              </p>
              <p className="muted tiny">
                {capacity} · {visibility === "public" ? t("create.public") : t("create.private")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
