// Server-side hadith search for "Ask Noor".
// Uses the same free "hadith-api" data as the Hadith pages (English edition of each book).
// Each book is downloaded once per server instance and kept in memory.

import { HADITH_BOOKS, type HadithItem } from "./books";

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

type Loaded = { items: HadithItem[]; sections: Record<string, string> };
const cache = new Map<string, Promise<Loaded | null>>();

async function fetchEdition(id: string): Promise<Loaded | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    let res = await fetch(`${CDN}/${id}.min.json`, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) res = await fetch(`${CDN}/${id}.json`, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      items: Array.isArray(json?.hadiths) ? json.hadiths : [],
      sections: (json?.metadata?.section ?? {}) as Record<string, string>,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function loadBook(key: string): Promise<Loaded | null> {
  const id = `eng-${key}`;
  let p = cache.get(id);
  if (!p) {
    p = fetchEdition(id);
    cache.set(id, p);
    // Do not remember a failed download, so the next question tries again.
    p.then((r) => {
      if (!r) cache.delete(id);
    });
  }
  return p;
}

export type HadithHit = {
  slug: string; // for example "bukhari"
  book: string; // for example "Sahih Bukhari"
  number: number; // hadith number in the book
  sectionNo: number | null;
  section: string; // chapter name
  text: string;
  grade: string;
};

/** Short word stems so "patience" also finds "patient". */
function stem(k: string) {
  return k.length > 6 ? k.slice(0, -2) : k;
}

/**
 * Finds hadith in the six books that contain the keywords.
 * Returns the best few from each book, mixed together (at most `total`).
 * A book that cannot be downloaded is skipped.
 */
export async function searchHadithBooks(keywords: string[], perBook = 2, total = 8): Promise<HadithHit[]> {
  const stems = keywords.map((k) => stem(k.toLowerCase())).filter(Boolean);
  if (stems.length === 0) return [];

  const perBookHits = await Promise.all(
    HADITH_BOOKS.map(async (b) => {
      const loaded = await loadBook(b.key);
      if (!loaded) return [] as HadithHit[];
      const scored: { h: HadithItem; score: number }[] = [];
      for (const h of loaded.items) {
        const text = (h.text ?? "").toLowerCase();
        if (text.length < 60 || text.length > 1200) continue;
        let score = 0;
        for (const s of stems) if (text.includes(s)) score++;
        if (score > 0) scored.push({ h, score });
      }
      scored.sort((x, y) => y.score - x.score || x.h.text.length - y.h.text.length);
      return scored.slice(0, perBook).map(({ h }) => {
        const sectionNo = h.reference?.book ?? null;
        const g = h.grades?.[0];
        return {
          slug: b.slug,
          book: b.name,
          number: h.hadithnumber,
          sectionNo,
          section: sectionNo != null ? String(loaded.sections[String(sectionNo)] ?? "") : "",
          text: (h.text ?? "").replace(/\s+/g, " ").trim().slice(0, 700),
          grade: g ? `${g.grade} (${g.name})` : "",
        };
      });
    }),
  );

  // Mix the books: best of each first, then the second best of each.
  const out: HadithHit[] = [];
  for (let r = 0; r < perBook; r++) {
    for (const list of perBookHits) if (list[r]) out.push(list[r]);
  }
  return out.slice(0, total);
}