"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  detectBrowserLocale,
  normalizeLocale,
  translate,
  translateError,
  type Locale,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  browserLocale: Locale;
  ready: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  te: (message: string | null | undefined, fallbackKey?: string) => string;
  locales: typeof LOCALES;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [browserLocale, setBrowserLocale] = useState<Locale>("zh");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const detected = detectBrowserLocale();
    const fromStorage = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    const fromCookie = normalizeLocale(
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
        ?.split("=")[1]
    );
    // 手动选择 > 中间件 cookie（Accept-Language）> 浏览器 navigator
    const next = fromStorage || fromCookie || detected;
    setBrowserLocale(detected);
    if (next !== locale) setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    writeLocaleCookie(next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    writeLocaleCookie(next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const te = useCallback(
    (message: string | null | undefined, fallbackKey?: string) =>
      translateError(locale, message, fallbackKey),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, browserLocale, ready, setLocale, t, te, locales: LOCALES }),
    [locale, browserLocale, ready, setLocale, t, te]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
