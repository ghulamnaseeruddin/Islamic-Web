// Quran data comes from free public APIs, called straight from the browser.
//   Text, translations, audio: https://alquran.cloud/api
//   Tafsir:                    https://api.quran.com (Quran Foundation)

const BASE = "https://api.alquran.cloud/v1";

export type Ayah = {
  number: number; // number in the whole Quran (1..6236)
  numberInSurah: number;
  text: string;
  juz?: number;
  page?: number;
  ruku?: number; // ruku number in the whole Qur'an (from the data source)
  audio?: string;
};

export type SurahData = {
  arabic: Ayah[];
  translations: { id: string; ayahs: Ayah[] }[];
  audio: Record<number, string>; // numberInSurah -> mp3 url
};

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ]/g;

/** The Arabic text of ayah 1 starts with the Bismillah (except surah 1 and 9). We show it separately. */
export function stripBismillah(surah: number, ayah: number, text: string): string {
  if (ayah !== 1 || surah === 1 || surah === 9) return text;
  const words = text.trim().split(/\s+/);
  if (words.length > 4 && words[0].replace(MARKS, "") === "بسم") {
    return words.slice(4).join(" ");
  }
  return text;
}

export async function fetchSurah(
  surah: number,
  translationIds: string[],
  reciter: string,
  script: "uthmani" | "indopak" = "uthmani",
): Promise<SurahData> {
  const arabicReq = getJson(`${BASE}/surah/${surah}/quran-uthmani`);
  const transReqs = translationIds.map((id) => getJson(`${BASE}/surah/${surah}/${id}`));
  const audioReq = getJson(`${BASE}/surah/${surah}/${reciter}`);

  const arabicJson = await arabicReq;
  const arabic: Ayah[] = arabicJson.data.ayahs.map((a: Ayah) => ({
    ...a,
    text: stripBismillah(surah, a.numberInSurah, a.text),
  }));

  // Indo-Pak (Nastaliq-style) script comes from the Quran.com API. If it fails we keep the standard script.
  if (script === "indopak") {
    try {
      const j = await getJson(`https://api.quran.com/api/v4/quran/verses/indopak?chapter_number=${surah}`);
      const map = new Map<number, string>();
      for (const v of j.verses as { verse_key: string; text_indopak: string }[]) {
        map.set(Number(v.verse_key.split(":")[1]), v.text_indopak);
      }
      if (map.size === arabic.length) {
        arabic.forEach((a) => {
          const txt = map.get(a.numberInSurah);
          if (txt) a.text = txt;
        });
      }
    } catch {
      /* keep standard script */
    }
  }

  const transResults = await Promise.allSettled(transReqs);
  const translations: { id: string; ayahs: Ayah[] }[] = [];
  transResults.forEach((r, i) => {
    if (r.status === "fulfilled") {
      translations.push({ id: translationIds[i], ayahs: r.value.data.ayahs });
    }
  });

  const audio: Record<number, string> = {};
  try {
    const audioJson = await audioReq;
    for (const a of audioJson.data.ayahs as Ayah[]) {
      if (a.audio) audio[a.numberInSurah] = a.audio;
    }
  } catch {
    /* audio is optional */
  }

  return { arabic, translations, audio };
}

export type JuzItem = {
  surah: number;
  n: number; // number in the surah
  arabic: string;
  translations: { id: string; text: string }[];
  audio?: string;
  ruku?: number; // ruku number in the whole Qur'an; a new number means a new ruku starts here
};

/** One juz (para) = all its verses, even across several surahs. Uses the juz endpoint: few requests. */
export async function fetchJuz(
  juz: number,
  translationIds: string[],
  reciter: string,
  script: "uthmani" | "indopak" = "uthmani",
): Promise<JuzItem[]> {
  const arabicReq = getJson(`${BASE}/juz/${juz}/quran-uthmani`);
  const transReqs = translationIds.map((id) => getJson(`${BASE}/juz/${juz}/${id}`));
  const audioReq = getJson(`${BASE}/juz/${juz}/${reciter}`);

  const arabicJson = await arabicReq;
  const base = arabicJson.data.ayahs as (Ayah & { surah: { number: number } })[];
  const items: JuzItem[] = base.map((a) => ({
    surah: a.surah.number,
    n: a.numberInSurah,
    arabic: stripBismillah(a.surah.number, a.numberInSurah, a.text),
    translations: [],
    ruku: typeof a.ruku === "number" ? a.ruku : undefined,
  }));

  if (script === "indopak") {
    try {
      const j = await getJson(`https://api.quran.com/api/v4/quran/verses/indopak?juz_number=${juz}`);
      const map = new Map<string, string>();
      for (const v of j.verses as { verse_key: string; text_indopak: string }[]) map.set(v.verse_key, v.text_indopak);
      if (map.size === items.length) {
        items.forEach((it) => {
          const txt = map.get(`${it.surah}:${it.n}`);
          if (txt) it.arabic = txt;
        });
      }
    } catch {
      /* keep standard script */
    }
  }

  const transResults = await Promise.allSettled(transReqs);
  transResults.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const byNumber = new Map<number, string>();
    for (const a of r.value.data.ayahs as Ayah[]) byNumber.set(a.number, a.text);
    base.forEach((b, k) => {
      const text = byNumber.get(b.number);
      if (text) items[k].translations.push({ id: translationIds[i], text });
    });
  });

  try {
    const audioJson = await audioReq;
    const byNumber = new Map<number, string>();
    for (const a of audioJson.data.ayahs as Ayah[]) if (a.audio) byNumber.set(a.number, a.audio);
    base.forEach((b, k) => {
      const url = byNumber.get(b.number);
      if (url) items[k].audio = url;
    });
  } catch {
    /* audio is optional */
  }

  return items;
}

/**
 * Ruku (رکوع) marks inside a juz. A new ruku starts where the ruku number of the data changes.
 * Returns, for each item index where a ruku starts: its number inside this juz (1, 2, 3 ...) and how many
 * verses of it are in this juz. Returns an empty result when the data has no ruku numbers.
 */
export function rukuMarks(items: JuzItem[]): { starts: Map<number, { no: number; len: number }>; total: number } {
  const starts = new Map<number, { no: number; len: number }>();
  if (items.length === 0 || items.some((it) => typeof it.ruku !== "number")) return { starts, total: 0 };
  let no = 0;
  let startIdx = 0;
  for (let i = 0; i < items.length; i++) {
    if (i === 0 || items[i].ruku !== items[i - 1].ruku) {
      if (i > 0) starts.get(startIdx)!.len = i - startIdx;
      no += 1;
      startIdx = i;
      starts.set(i, { no, len: 0 });
    }
  }
  starts.get(startIdx)!.len = items.length - startIdx;
  return { starts, total: no };
}

export type SearchMatch = {
  surah: number;
  surahName: string;
  ayah: number;
  text: string;
};

export async function searchQuran(keyword: string, edition: string): Promise<SearchMatch[]> {
  const res = await fetch(`${BASE}/search/${encodeURIComponent(keyword)}/all/${edition}`);
  if (!res.ok) return [];
  const json = await res.json();
  const matches = json?.data?.matches;
  if (!Array.isArray(matches)) return [];
  return matches.map((m: any) => ({
    surah: m.surah?.number,
    surahName: m.surah?.englishName ?? "",
    ayah: m.numberInSurah,
    text: m.text,
  }));
}

export type AyahBundle = {
  ref: string;
  surah: number;
  ayah: number;
  surahName: string;
  arabic: string;
  translations: Record<string, string>;
};

export async function fetchAyah(ref: string, translationIds: string[]): Promise<AyahBundle | null> {
  const editions = ["quran-uthmani", ...translationIds].join(",");
  try {
    const json = await getJson(`${BASE}/ayah/${ref}/editions/${editions}`);
    const items: any[] = json.data;
    const arabicItem = items.find((i) => i.edition?.identifier === "quran-uthmani") ?? items[0];
    const translations: Record<string, string> = {};
    for (const it of items) {
      if (it.edition?.identifier && it.edition.identifier !== "quran-uthmani") {
        translations[it.edition.identifier] = it.text;
      }
    }
    const surah = arabicItem.surah?.number;
    const ayah = arabicItem.numberInSurah;
    return {
      ref,
      surah,
      ayah,
      surahName: arabicItem.surah?.englishName ?? "",
      arabic: stripBismillah(surah, ayah, arabicItem.text),
      translations,
    };
  } catch {
    return null;
  }
}

/** Turn the tafsir HTML into clean text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchTafsir(id: number, surah: number, ayah: number): Promise<string> {
  const json = await getJson(`https://api.quran.com/api/v4/tafsirs/${id}/by_ayah/${surah}:${ayah}`);
  const text = json?.tafsir?.text;
  if (typeof text !== "string" || !text.trim()) return "";
  return htmlToText(text);
}