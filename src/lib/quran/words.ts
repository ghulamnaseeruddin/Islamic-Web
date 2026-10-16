// Word-by-word meaning and tajweed colours, from the Quran.com API (https://api.quran.com).
const BASE = "https://api.quran.com/api/v4";

export type Word = { pos: number; ar: string; meaning: string; translit: string };
export type WordVerse = { ayah: number; words: Word[] };

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchWordByWord(surah: number, lang: "ur" | "en"): Promise<WordVerse[]> {
  const out: WordVerse[] = [];
  let page: number | null = 1;
  while (page) {
    const j = await getJson(
      `${BASE}/verses/by_chapter/${surah}?language=${lang}&words=true&word_fields=text_uthmani&per_page=50&page=${page}`,
    );
    for (const v of j.verses as any[]) {
      const ayah = Number(String(v.verse_key).split(":")[1]);
      const words: Word[] = (v.words as any[])
        .filter((w) => w.char_type_name === "word")
        .map((w) => ({
          pos: w.position,
          ar: w.text_uthmani ?? w.text ?? "",
          meaning: w.translation?.text ?? "",
          translit: w.transliteration?.text ?? "",
        }));
      out.push({ ayah, words });
    }
    page = j.pagination?.next_page ?? null;
  }
  return out;
}

export async function fetchTajweed(surah: number): Promise<{ ayah: number; html: string }[]> {
  const j = await getJson(`${BASE}/quran/verses/uthmani_tajweed?chapter_number=${surah}`);
  return (j.verses as any[]).map((v) => ({
    ayah: Number(String(v.verse_key).split(":")[1]),
    html: String(v.text_uthmani_tajweed ?? ""),
  }));
}
