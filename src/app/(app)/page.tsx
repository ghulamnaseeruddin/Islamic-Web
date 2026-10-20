"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { formatCountdown, formatTime, hijriDate, nextPrayer, resolvePlace } from "@/lib/prayer";
import { fetchAyah, type AyahBundle } from "@/lib/quran/api";
import { SURAHS } from "@/lib/quran/surahs";
import { useSettings } from "@/lib/settings";
import { computeStreak } from "@/lib/streak";
import { supabaseBrowser } from "@/lib/supabase/client";

// Short, well-known verses for the "Ayah of the day".
const DAILY = [
  "2:152", "2:153", "2:186", "2:255", "2:286", "3:139", "3:159", "3:173", "13:28", "14:7",
  "16:97", "24:35", "29:69", "39:53", "40:60", "65:2", "65:3", "94:5", "94:6", "103:1", "112:1",
];

// Only the part of the verse that is written around the logo: Surah Aal-Imran 3:103 (first part)
const LOGO_ARABIC = "وَٱعْتَصِمُوا۟ بِحَبْلِ ٱللَّهِ جَمِيعًۭا وَلَا تَفَرَّقُوا۟ ۚ";
const LOGO_URDU = "اور سب مل کر اللہ کی رسی کو مضبوطی سے پکڑے رکھو اور تفرقے میں نہ پڑو۔";
const LOGO_ENGLISH = "And hold firmly to the rope of Allah all together and do not become divided";

function dayIndex() {
  const d = new Date();
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
}

export default function HomePage() {
  const { t, lang } = useI18n();
  const { settings, ready } = useSettings();
  const [now, setNow] = useState(() => new Date());
  const [name, setName] = useState("");
  const [last, setLast] = useState<{ surah: number; ayah: number } | null>(null);
  const [daily, setDaily] = useState<AyahBundle | null | undefined>(undefined);
  const [streak, setStreak] = useState(0);
  const [todayAyahs, setTodayAyahs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      const meta = (u.user?.user_metadata ?? {}) as Record<string, string | undefined>;
      const { data: p } = await sb.from("profiles").select("full_name").maybeSingle();
      setName(((p?.full_name as string) || meta.full_name || meta.name || "").split(" ")[0]);
      const { data: r } = await sb.from("reading_progress").select("surah, ayah").maybeSingle();
      if (r) setLast(r as { surah: number; ayah: number });
      const { data: log } = await sb.from("reading_log").select("day, ayahs").order("day", { ascending: false }).limit(400);
      const rows = (log ?? []) as { day: string; ayahs: number }[];
      setStreak(computeStreak(rows.map((x) => x.day)));
      const today = new Date().toLocaleDateString("en-CA");
      setTodayAyahs(rows.find((x) => x.day === today)?.ayahs ?? 0);
    })();
  }, []);

  const trId = settings.translations[0] ?? "ur.jalandhry";
  useEffect(() => {
    if (!ready) return;
    const ref = DAILY[dayIndex() % DAILY.length];
    fetchAyah(ref, [trId]).then(setDaily);
  }, [ready, trId]);

  const place = resolvePlace(settings, lang);
  const next = nextPrayer(now, place, settings.prayerMethod, settings.asr);
  const hour = now.getHours();
  const greet = hour < 12 ? t("home.morning") : hour < 18 ? t("home.afternoon") : t("home.evening");
  const lastInfo = last ? SURAHS[last.surah - 1] : null;

  const tiles: { href: string; icon: IconName; key: Parameters<typeof t>[0] }[] = [
    { href: "/quran", icon: "quran", key: "nav.quran" },
    { href: "/hadith", icon: "hadith", key: "nav.hadith" },
    { href: "/library", icon: "library", key: "nav.library" },
    { href: "/azkaar", icon: "tasbih", key: "nav.azkaar" },
    { href: "/prayer", icon: "clock", key: "nav.prayer" },
    { href: "/ask", icon: "sparkle", key: "nav.ask" },
  ];

  return (
    <div>
      {/* Full logo on the left, its verse (Arabic, Urdu, English) on the right. Stacks on phones. */}
      <section className="grid items-center gap-5 md:grid-cols-2 md:gap-10" dir="ltr">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Noor ul Ilm — Light of Islam"
            width={512}
            height={512}
            className="h-auto w-44 drop-shadow-xl sm:w-56 md:w-72 lg:w-80"
          />
        </div>
        <div className="card min-w-0 text-center">
          <p className="font-arabic leading-[2.1] text-2xl sm:text-3xl" dir="rtl" lang="ar">
            {LOGO_ARABIC}
          </p>
          <p className="font-urdu mt-3 leading-[2.2]" dir="rtl" lang="ur">
            {LOGO_URDU}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted" dir="ltr" lang="en">
            {LOGO_ENGLISH}
          </p>
          <Link href="/quran/3#a103" className="mt-4 inline-block text-xs text-brand underline" dir="ltr">
            Aal-Imran · {t("ask.surah")} 3, {t("ask.ayah")} 103 ·{" "}
            <span className="font-arabic" lang="ar">سورة آل عمران</span>
          </Link>
        </div>
      </section>

      <p className="font-arabic mt-6 text-center text-2xl text-accent" dir="rtl" lang="ar">السلام علیکم ورحمة الله</p>
      <h1 className="mt-2 text-center text-2xl font-semibold">
        {greet}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1 text-center text-sm text-muted">{hijriDate(now, settings.hijriAdjust, lang)}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/prayer" className="card hover:bg-soft">
          <p className="text-xs text-muted">{t("prayer.next")} · {place.label}</p>
          <p className="mt-1 text-xl font-semibold">{t(`prayer.${next.key}` as never)}</p>
          <p className="text-sm text-muted">{formatTime(next.time, lang)}</p>
          <p className="mt-2 text-2xl font-light tabular-nums" dir="ltr">{formatCountdown(next.time.getTime() - now.getTime())}</p>
        </Link>

        <div className="card">
          <p className="text-xs text-muted">{t("home.continue")}</p>
          {lastInfo && last ? (
            <>
              <p className="mt-1 text-xl font-semibold" dir="ltr">{lastInfo.en}</p>
              <p className="text-sm text-muted" dir="ltr">{last.surah}:{last.ayah}</p>
              <Link href={`/quran/${last.surah}#a${last.ayah}`} className="btn btn-primary mt-3">{t("home.resume")}</Link>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">{t("home.noProgress")}</p>
              <Link href="/quran/1" className="btn btn-primary mt-3">{t("home.startReading")}</Link>
            </>
          )}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted">
              <span>{t("home.goal")}</span>
              <span dir="ltr">{Math.min(todayAyahs, settings.dailyGoalAyahs)} / {settings.dailyGoalAyahs}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
              <div