import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Qibla } from "adhan";
import { getCity } from "@/lib/cities";
import type { Settings } from "@/lib/settings";

export const METHODS: { key: string; en: string; ur: string }[] = [
  { key: "Karachi", en: "University of Islamic Sciences, Karachi", ur: "یونیورسٹی آف اسلامک سائنسز، کراچی" },
  { key: "MuslimWorldLeague", en: "Muslim World League", ur: "مسلم ورلڈ لیگ" },
  { key: "Egyptian", en: "Egyptian General Authority", ur: "مصری جنرل اتھارٹی" },
  { key: "UmmAlQura", en: "Umm al-Qura, Makkah", ur: "ام القریٰ، مکہ" },
  { key: "Dubai", en: "Dubai", ur: "دبئی" },
  { key: "NorthAmerica", en: "ISNA (North America)", ur: "آئی ایس این اے (شمالی امریکہ)" },
  { key: "Turkey", en: "Turkey (Diyanet)", ur: "ترکی (دیانت)" },
];

export type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
export const PRAYER_ORDER: PrayerKey[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

export type Place = { lat: number; lon: number; label: string };

export function resolvePlace(s: Pick<Settings, "cityKey" | "lat" | "lon">, lang: "en" | "ur"): Place {
  if (s.cityKey === "device" && s.lat != null && s.lon != null) {
    return { lat: s.lat, lon: s.lon, label: lang === "ur" ? "میرا مقام" : "My location" };
  }
  const city = getCity(s.cityKey) ?? getCity("islamabad")!;
  return { lat: city.lat, lon: city.lon, label: lang === "ur" ? city.ur : city.en };
}

export function computeTimes(
  date: Date,
  place: { lat: number; lon: number },
  method: string,
  asr: "later" | "standard",
): PrayerTimes {
  const factory = (CalculationMethod as unknown as Record<string, () => any>)[method];
  const params = (typeof factory === "function" ? factory : CalculationMethod.Karachi)();
  // "Later" = the later Asr time. "Standard" = the earlier Asr time.
  params.madhab = asr === "later" ? Madhab.Hanafi : Madhab.Shafi;
  return new PrayerTimes(new Coordinates(place.lat, place.lon), date, params);
}

export function timesAsList(t: PrayerTimes): { key: PrayerKey; time: Date }[] {
  return PRAYER_ORDER.map((key) => ({ key, time: t[key] as Date }));
}

/** The next prayer after "now" (looks into tomorrow after Isha). */
export function nextPrayer(
  now: Date,
  place: { lat: number; lon: number },
  method: string,
  asr: "later" | "standard",
): { key: PrayerKey; time: Date } {
  const today = timesAsList(computeTimes(now, place, method, asr));
  const upcoming = today.find((p) => p.time.getTime() > now.getTime());
  if (upcoming) return upcoming;
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  return timesAsList(computeTimes(tomorrow, place, method, asr))[0];
}

export function qiblaBearing(place: { lat: number; lon: number }): number {
  return Qibla(new Coordinates(place.lat, place.lon));
}

/** Hijri date (calculated). Pakistan's moon sighting can differ by a day, so there is an adjustment. */
export function hijriDate(date: Date, adjustDays: number, lang: "en" | "ur"): string {
  const d = new Date(date.getTime() + adjustDays * 24 * 3600 * 1000);
  try {
    return new Intl.DateTimeFormat(
      lang === "ur" ? "ur-PK-u-ca-islamic-umalqura" : "en-u-ca-islamic-umalqura",
      { day: "numeric", month: "long", year: "numeric" },
    ).format(d);
  } catch {
    return "";
  }
}

export function formatTime(d: Date, lang: "en" | "ur"): string {
  return new Intl.DateTimeFormat(lang === "ur" ? "ur-PK" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
