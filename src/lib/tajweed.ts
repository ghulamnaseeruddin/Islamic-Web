// Quran.com sends tajweed text like:  <tajweed class=ghunnah>نّ</tajweed>
// We read it into plain pieces (no HTML is ever inserted into the page).
export type TajweedPiece = { text: string; cls?: string };

export function parseTajweed(html: string): TajweedPiece[] {
  const out: TajweedPiece[] = [];
  const re = /<tajweed class=([a-z_]+)>([^<]*)<\/tajweed>|<span class=end>[^<]*<\/span>|<[^>]+>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[1]) out.push({ text: m[2], cls: m[1] });
    else if (m[3]) out.push({ text: m[3] });
  }
  return out;
}

/** Colour and meaning of each rule, English and Urdu. */
export const TAJWEED_RULES: { cls: string; color: string; en: string; ur: string }[] = [
  { cls: "ghunnah", color: "#e07b00", en: "Ghunnah (nasal sound, 2 counts)", ur: "غنہ" },
  { cls: "qalqalah", color: "#1d8fd1", en: "Qalqalah (echo)", ur: "قلقلہ" },
  { cls: "ikhfa", color: "#c2185b", en: "Ikhfa (hiding)", ur: "اخفاء" },
  { cls: "ikhfa_shafawi", color: "#c2185b", en: "Ikhfa Shafawi", ur: "اخفاء شفوی" },
  { cls: "iqlab", color: "#7b3fb5", en: "Iqlab (turning)", ur: "اقلاب" },
  { cls: "idgham_ghunnah", color: "#2e9d5a", en: "Idgham with ghunnah", ur: "ادغام مع الغنہ" },
  { cls: "idgham_wo_ghunnah", color: "#6b8e23", en: "Idgham without ghunnah", ur: "ادغام بلا غنہ" },
  { cls: "idgham_shafawi", color: "#2e9d5a", en: "Idgham Shafawi", ur: "ادغام شفوی" },
  { cls: "idgham_mutajanisayn", color: "#6b8e23", en: "Idgham of similar letters", ur: "ادغام متجانسین" },
  { cls: "madda_normal", color: "#d32f2f", en: "Madd (2 counts)", ur: "مد طبعی" },
  { cls: "madda_permissible", color: "#e64a19", en: "Madd (2, 4 or 6 counts)", ur: "مد جائز" },
  { cls: "madda_necessary", color: "#b71c1c", en: "Madd (6 counts, necessary)", ur: "مد لازم" },
  { cls: "madda_obligatory", color: "#c62828", en: "Madd (4 to 5 counts, obligatory)", ur: "مد واجب" },
  { cls: "ham_wasl", color: "#8d8d8d", en: "Hamzat al-Wasl", ur: "ہمزۂ وصل" },
  { cls: "laam_shamsiyah", color: "#8d8d8d", en: "Silent lam (shamsiyyah)", ur: "لامِ شمسیہ" },
  { cls: "slnt", color: "#8d8d8d", en: "Silent letter", ur: "حرفِ ساکن غیر ملفوظ" },
];

export const tajweedColor = (cls: string | undefined) =>
  cls ? TAJWEED_RULES.find((r) => r.cls === cls)?.color : undefined;
