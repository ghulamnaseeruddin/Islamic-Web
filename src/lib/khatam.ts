import { SURAHS } from "@/lib/quran/surahs";

// Splits the 6,236 ayahs evenly over a number of days.
const CUM: number[] = [];
SURAHS.reduce((sum, s, i) => ((CUM[i] = sum + s.ayahs), sum + s.ayahs), 0);
export const TOTAL_AYAHS = CUM[CUM.length - 1];

export type AyahPos = { surah: number; ayah: number };

export function refFromIndex(i: number): AyahPos {
  const idx = Math.min(Math.max(0, i), TOTAL_AYAHS - 1);
  let s = 0;
  while (CUM[s] <= idx) s++;
  const before = s === 0 ? 0 : CUM[s - 1];
  return { surah: s + 1, ayah: idx - before + 1 };
}

export function dayRange(day: number, days: number) {
  const start = Math.floor(((day - 1) * TOTAL_AYAHS) / days);
  const end = Math.floor((day * TOTAL_AYAHS) / days) - 1;
  return { from: refFromIndex(start), to: refFromIndex(end), count: end - start + 1 };
}
