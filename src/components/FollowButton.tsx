"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

export function FollowButton({
  slug,
  initialFollowing,
  initialCount,
}: {
  slug: string;
  initialFollowing: boolean;
  initialCount: number;
}) {
  const { user, loading } = useAuth();
  const { t, te } = useLocale();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    fetch(`/api/calendars/${slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.following === "boolean") setFollowing(data.following);
        if (typeof data.followerCount === "number") setCount(data.followerCount);
      })
      .catch(() => {});
  }, [slug, loading, user?.id]);

  if (!user) {
    return (
      <Link className="nav__cta" href={`/signin?next=${encodeURIComponent(`/c/${slug}`)}`}>
        {t("cal.signInFollow")}
      </Link>
    );
  }

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendars/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: following ? "unfollow" : "follow" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setFollowing(Boolean(data.following));
      setCount(data.followerCount ?? count);
    } catch (err) {
      setError(te(err instanceof Error ? err.message : "Failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={following ? "nav__cta nav__cta--ghost" : "nav__cta"}
        disabled={busy}
        onClick={toggle}
      >
        {busy ? "…" : following ? t("cal.following", { n: count }) : t("cal.follow", { n: count })}
      </button>
      {error ? (
        <div className="toast toast--err" style={{ marginTop: 8 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
