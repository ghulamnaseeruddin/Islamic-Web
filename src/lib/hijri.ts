// Hijri calendar (calculated, Umm al-Qura). Pakistan's moon sighting can differ by a day,
// so every function takes an "adjust" number of days from Settings.
export type Hijri = { y: number; m: number; d: number };

export const HIJRI_MONTHS: { en: string; ur: string }[] = [
  { en: "Muharram", ur: "محرم" },
  { en: "Safar", ur: "صفر" },
  { en: "Rabi' al-Awwal", ur: "ربیع الاول" },
  { en: "Rabi' al-Thani", ur: "ربیع الثانی" },
  { en: "Jumada al-Ula", ur: "جمادی الاول" },
  { en: "Jumada al-Akhirah", ur: "جمادی الثانی" },
  { en: "Rajab", ur: "رجب" },
  { en: "Sha'ban", ur: "شعبان" },
  { en: "Ramadan", ur: "رمضان" },
  { en: "Shawwal", ur: "شوال" },
  { en: "Dhul Qa'dah", ur: "ذوالقعدہ" },
  { en: "Dhul Hijjah", ur: "ذوالحجہ" },
];

const DAY = 24 * 3600 * 1000;
const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" });

export function hijriOf(date: Date, adjust = 0): Hijri {
  const parts = fmt.formatToParts(new Date(date.getTime() + adjust * DAY));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** Noon of the same local day, so daylight-saving changes never move the date. */
export function noon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12, 0, 0);
  return x;
}

/** The next date (today or later) that falls on this Hijri month and day. */
export function nextOccurrence(m: number, d: number, from: Date, adjust = 0): Date | null {
  const start = noon(from);
  for (let i = 0; i <= 400; i++) {
    const day = addDays(start, i);
    const h = hijriOf(day, adjust);
    if (h.m === m && h.d === d) return day;
  }
  return null;
}

/** Days of the current Ramadan, or the next one if it is over. */
export function ramadanDays(from: Date, adjust = 0): Date[] {
  const start = noon(from);
  let block: Date[] = [];
  for (let i = -30; i <= 420; i++) {
    const day = addDays(start, i);
    const h = hijriOf(day, adjust);
    if (h.m === 9) block.push(day);
    else if (block.length) {
      if (block[block.length - 1].getTime() >= start.getTime()) return block;
      block = [];
    }
  }
  return block;
}

export type IslamicEvent = { m: number; d: number; en: string; ur: string; noteEn?: string; noteUr?: string };

export const EVENTS: IslamicEvent[] = [
  { m: 1, d: 1, en: "Islamic New Year", ur: "اسلامی سال کا آغاز" },
  {
    m: 1, d: 10, en: "Day of Ashura", ur: "یومِ عاشورہ",
    noteEn: "Fasting on this day is recommended; it is better to also fast the 9th or 11th (Sahih Muslim).",
    noteUr: "اس دن کا روزہ مستحب ہے؛ بہتر ہے کہ 9 یا 11 کا روزہ بھی ساتھ رکھیں (صحیح مسلم)۔",
  },
  { m: 9, d: 1, en: "First day of Ramadan", ur: "رمضان کا پہلا دن" },
  {
    m: 9, d: 21, en: "Last ten nights of Ramadan begin", ur: "رمضان کی آخری دس راتیں شروع",
    noteEn: "Seek Laylat al-Qadr, especially on the odd nights (Sahih al-Bukhari).",
    noteUr: "لیلۃ القدر کو تلاش کریں، خاص طور پر طاق راتوں میں (صحیح بخاری)۔",
  },
  { m: 10, d: 1, en: "Eid al-Fitr", ur: "عیدالفطر" },
  {
    m: 10, d: 2, en: "Six fasts of Shawwal can begin", ur: "شوال کے چھ روزے شروع کیے جا سکتے ہیں",
    noteEn: "Fasting Ramadan and then six days of Shawwal is like fasting the whole year (Sahih Muslim).",
    noteUr: "رمضان کے بعد شوال کے چھ روزے پورے سال کے روزوں کے برابر ہیں (صحیح مسلم)۔",
  },
  {
    m: 12, d: 1, en: "First ten days of Dhul Hijjah", ur: "ذوالحجہ کے پہلے دس دن",
    noteEn: "Good deeds on these days are most beloved to Allah (Sahih al-Bukhari).",
    noteUr: "ان دنوں کے نیک اعمال اللہ کو سب سے زیادہ محبوب ہیں (صحیح بخاری)۔",
  },
  {
    m: 12, d: 9, en: "Day of Arafah", ur: "یومِ عرفہ",
    noteEn: "Fasting is recommended for those not on Hajj (Sahih Muslim).",
    noteUr: "جو حج پر نہیں ان کے لیے روزہ مستحب ہے (صحیح مسلم)۔",
  },
  { m: 12, d: 10, en: "Eid al-Adha", ur: "عیدالاضحیٰ" },
  { m: 12, d: 11, en: "Days of Tashreeq (11 to 13)", ur: "ایامِ تشریق (11 تا 13)" },
];
