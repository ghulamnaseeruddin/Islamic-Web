// Hadith text comes from the free open-source "hadith-api" (served by jsDelivr).
// https://github.com/fawazahmed0/hadith-api
// Names follow the library website. Books not in this list (Mishkat, Musnad Ahmad,
// Al Silsila Sahiha, ...) are available as PDFs in the Library.

export type HadithBook = {
  slug: string;
  name: string;
  ar: string;
  key: string; // used by the data source, e.g. "bukhari"
};

export const HADITH_BOOKS: HadithBook[] = [
  { slug: "bukhari", name: "Sahih Bukhari", ar: "صحیح البخاری", key: "bukhari" },
  { slug: "muslim", name: "Sahih Muslim", ar: "صحیح مسلم", key: "muslim" },
  { slug: "tirmizi", name: "Jamia Tirmizi", ar: "جامع ترمزی", key: "tirmidhi" },
  { slug: "abu-dawood", name: "Sunan Abu Dawood", ar: "سنن ابی دووُد", key: "abudawud" },
  { slug: "ibn-e-majah", name: "Sunan Ibn-e-Majah", ar: "سنن ابن ماجہ", key: "ibnmajah" },
  { slug: "nisai", name: "Sunan Nisai", ar: "سنن نسائی", key: "nasai" },
];

export function getHadithBook(slug: string) {
  return HADITH_BOOKS.find((b) => b.slug === slug);
}

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

export type HadithLang = "ara" | "urd" | "eng";

export type HadithItem = {
  hadithnumber: number;
  text: string;
  grades?: { name: string; grade: string }[];
  reference?: { book: number; hadith: number };
};

export type SectionData = {
  name: string; // section (chapter) name
  hadiths: HadithItem[];
};

/** Returns null when the section number does not exist. */
export async function fetchSection(
  lang: HadithLang,
  key: string,
  section: number,
): Promise<SectionData | null> {
  const res = await fetch(`${CDN}/${lang}-${key}/sections/${section}.json`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const names = json?.metadata?.section ?? {};
  return {
    name: String(names[String(section)] ?? Object.values(names)[0] ?? ""),
    hadiths: Array.isArray(json?.hadiths) ? json.hadiths : [],
  };
}

export async function fetchHadith(
  lang: HadithLang,
  key: string,
  number: number,
): Promise<HadithItem | null> {
  const res = await fetch(`${CDN}/${lang}-${key}/${number}.json`);
  if (!res.ok) return null;
  const json = await res.json();
  const first = Array.isArray(json?.hadiths) ? json.hadiths[0] : null;
  return first ?? null;
}

// ---------- Full-text search ----------
// A whole book is downloaded once (several MB), kept in memory, and searched in the browser.
const editionCache = new Map<string, HadithItem[]>();

export async function loadEdition(lang: HadithLang, key: string): Promise<HadithItem[]> {
  const id = `${lang}-${key}`;
  const cached = editionCache.get(id);
  if (cached) return cached;
  let res = await fetch(`${CDN}/${id}.min.json`);
  if (!res.ok) res = await fetch(`${CDN}/${id}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const items: HadithItem[] = Array.isArray(json?.hadiths) ? json.hadiths : [];
  editionCache.set(id, items);
  return items;
}

const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;

export function normalizeForSearch(s: string): string {
  return s.replace(ARABIC_MARKS, "").replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase();
}

/** Every word you type must appear in the hadith text. */
export function searchItems(items: HadithItem[], query: string, limit = 50) {
  const words = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { total: 0, results: [] as HadithItem[] };
  const results: HadithItem[] = [];
  let total = 0;
  for (const h of items) {
    const text = normalizeForSearch(h.text ?? "");
    if (words.every((w) => text.includes(w))) {
      total++;
      if (results.length < limit) results.push(h);
    }
  }
  return { total, results };
}
