"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useLocale } from "@/components/LocaleProvider";

function SignInForm() {
  const { signIn, signUp, user, loading } = useAuth();
  const { t, te } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await signUp(name, email, password);
      else await signIn(email, password);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(te(err instanceof Error ? err.message : "Failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="shell narrow">
        <Link className="back" href="/">
          {t("auth.back")}
        </Link>
        <div className="panel">
          <h1 className="panel__title">
            {mode === "signin" ? t("auth.welcome") : t("auth.createAccount")}
          </h1>
          <p className="panel__sub">
            {mode === "signin" ? t("auth.subSignIn") : t("auth.subSignUp")}
          </p>

          <LanguageSwitch variant="panel" />

          <div className="tabs" style={{ marginBottom: 18 }}>
            <button
              type="button"
              className={`tab${mode === "signin" ? " is-active" : ""}`}
              onClick={() => setMode("signin")}
            >
              {t("auth.signIn")}
            </button>
            <button
              type="button"
              className={`tab${mode === "signup" ? " is-active" : ""}`}
              onClick={() => setMode("signup")}
            >
              {t("auth.signUp")}
            </button>
          </div>

          <form className="form" onSubmit={onSubmit}>
            {mode === "signup" ? (
              <label>
                {t("auth.name")}
                <input
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
              </label>
            ) : null}
            <label>
              {t("auth.email")}
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              {t("auth.password")}
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPh")}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </label>
            <button type="submit" disabled={busy || loading}>
              {busy
                ? t("auth.wait")
                : mode === "signup"
                  ? t("auth.submitSignUp")
                  : t("auth.submitSignIn")}
            </button>
            {error ? <div className="toast toast--err">{error}</div> : null}
          </form>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <div className="shell">…</div>
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
