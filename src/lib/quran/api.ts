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
