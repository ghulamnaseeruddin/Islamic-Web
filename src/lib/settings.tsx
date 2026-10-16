"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/dictionary";

export type ThemeChoice = "system" | "light" | "dark" | "sepia";

export type Settings = {
  language: Lang;
  theme: ThemeChoice;
  script: "uthmani" | "indopak";
  arabicFontSize: number;
  urduFontSize: number;
  showTranslation: boolean;
  translations: string[];
  tafsirId: number;
  reciter: string;
  playbackRate: number;
  repeat: number;
  prayerMethod: string;
  asr: "later" | "standard";
  cityKey: string; // a city key, or "device"
  lat: number | null;
  lon: number | null;
  hijriAdjust: number;
  notifyPrayers: boolean;
  dailyGoalAyahs: number;
  khatamStart: string | null; // YYYY-MM-DD
  khatamDays: number;
  khatamDone: number[]; // finished day numbers
};

export const DEFAULT_SETTINGS: Settings = {
  language: "en",
  theme: "system",
  script: "uthmani",
  arabicFontSize: 34,
  urduFontSize: 22,
  showTranslation: true,
  translations: ["ur.jalandhry"],
  tafsirId: 160,
  reciter: "ar.alafasy",
  playbackRate: 1,
  repeat: 1,
  prayerMethod: "Karachi",
  asr: "later",
  cityKey: "islamabad",
  lat: null,
  lon: null,
  hijriAdjust: 0,
  notifyPrayers: false,
  dailyGoalAyahs: 10,
  khatamStart: null,
  khatamDays: 30,
  khatamDone: [],
};

const STORAGE_KEY = "noor-settings-v1";

type Ctx = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  ready: boolean;
};

const SettingsContext = createContext<Ctx | null>(null);

export function applyTheme(theme: ThemeChoice) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  document.cookie = `noor-theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function SettingsProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const { lang, setLang } = useI18n();
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, language: lang });
  const [ready, setReady] = useState(false);
  const latest = useRef<Settings>(settings);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load: local copy first (instant), then the saved copy from the database.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let local: Partial<Settings> = {};
      try {
        const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
        if (raw) local = JSON.parse(raw);
      } catch {
        /* ignore */
      }
      let remote: Partial<Settings> = {};
      try {
        const { data } = await supabaseBrowser()
          .from("user_settings")
          .select("settings")
          .eq("user_id", userId)
          .maybeSingle();
        if (data?.settings && typeof data.settings === "object") {
          remote = data.settings as Partial<Settings>;
        }
      } catch {
        /* offline or table missing: keep local */
      }
      if (cancelled) return;
      const merged: Settings = { ...DEFAULT_SETTINGS, language: lang, ...local, ...remote };
      latest.current = merged;
      setSettings(merged);
      if (merged.language !== lang) setLang(merged.language);
      applyTheme(merged.theme);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const persist = useCallback(
    (next: Settings) => {
      try {
        localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        supabaseBrowser()
          .from("user_settings")
          .upsert({
            user_id: userId,
            settings: latest.current,
            updated_at: new Date().toISOString(),
          })
          .then(() => {});
      }, 800);
    },
    [userId],
  );

  const update = useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...latest.current, ...patch };
      latest.current = next;
      setSettings(next);
      if (patch.language) setLang(patch.language);
      if (patch.theme) applyTheme(patch.theme);
      persist(next);
    },
    [persist, setLang],
  );

  const reset = useCallback(() => {
    update({ ...DEFAULT_SETTINGS, language: latest.current.language });
  }, [update]);

  return (
    <SettingsContext.Provider value={{ settings, update, reset, ready }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
