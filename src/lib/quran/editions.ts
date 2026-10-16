// Translations, tafsirs and reciters. Edit this one file to add or remove choices.
// Translators and authors are shown by name only. No labels or groups.

export type Translation = { id: string; lang: "ur" | "en"; name: string; nameUr?: string };

export const TRANSLATIONS: Translation[] = [
  { id: "ur.jalandhry", lang: "ur", name: "Fateh Muhammad Jalandhry", nameUr: "فتح محمد جالندھری" },
  { id: "ur.maududi", lang: "ur", name: "Abul A'ala Maududi", nameUr: "ابوالاعلیٰ مودودی" },
  { id: "ur.junagarhi", lang: "ur", name: "Muhammad Junagarhi", nameUr: "محمد جوناگڑھی" },
  { id: "ur.ahmedali", lang: "ur", name: "Ahmed Ali", nameUr: "احمد علی" },
  { id: "ur.kanzuliman", lang: "ur", name: "Ahmed Raza Khan", nameUr: "احمد رضا خان" },
  { id: "ur.qadri", lang: "ur", name: "Tahir ul Qadri", nameUr: "طاہر القادری" },
  { id: "ur.jawadi", lang: "ur", name: "Syed Zeeshan Haider Jawadi", nameUr: "علامہ جوادی" },
  { id: "ur.najafi", lang: "ur", name: "Muhammad Hussain Najafi", nameUr: "محمد حسین نجفی" },
  { id: "en.sahih", lang: "en", name: "Sahih International" },
  { id: "en.pickthall", lang: "en", name: "Pickthall" },
  { id: "en.yusufali", lang: "en", name: "Yusuf Ali" },
  { id: "en.asad", lang: "en", name: "Muhammad Asad" },
];

export function translationName(id: string, lang: "en" | "ur") {
  const t = TRANSLATIONS.find((x) => x.id === id);
  if (!t) return id;
  return lang === "ur" && t.nameUr ? t.nameUr : t.name;
}

// Tafsir ids come from the Quran.com content API.
export type Tafsir = { id: number; name: string; nameUr: string; lang: "ur" | "en" | "ar" };

export const TAFSIRS: Tafsir[] = [
  { id: 160, name: "Tafsir Ibn Kathir (Urdu)", nameUr: "تفسیر ابنِ کثیر (اردو)", lang: "ur" },
  { id: 159, name: "Bayan ul Quran — Dr. Israr Ahmad", nameUr: "بیان القرآن — ڈاکٹر اسرار احمد", lang: "ur" },
  { id: 157, name: "Fi Zilal al-Quran — Sayyid Qutb", nameUr: "فی ظلال القرآن — سید قطب", lang: "ur" },
  { id: 818, name: "Tazkir ul Quran — Maulana Wahid Uddin Khan", nameUr: "تذکیر القرآن — مولانا وحید الدین خان", lang: "ur" },
  { id: 168, name: "Ma'arif al-Qur'an — Mufti Muhammad Shafi (English)", nameUr: "معارف القرآن — مفتی محمد شفیع (انگریزی)", lang: "en" },
  { id: 169, name: "Ibn Kathir, Abridged (English)", nameUr: "ابنِ کثیر مختصر (انگریزی)", lang: "en" },
  { id: 14, name: "Tafsir Ibn Kathir (Arabic)", nameUr: "تفسیر ابنِ کثیر (عربی)", lang: "ar" },
];

export const RECITERS: { id: string; name: string; nameUr: string }[] = [
  { id: "ar.alafasy", name: "Mishary Alafasy", nameUr: "مشاری العفاسی" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)", nameUr: "عبد الباسط (مرتل)" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", nameUr: "محمود خلیل الحصری" },
  { id: "ar.minshawi", name: "Muhammad Siddiq Al-Minshawi", nameUr: "محمد صدیق المنشاوی" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais", nameUr: "عبد الرحمن السدیس" },
  { id: "ar.saoodshuraym", name: "Saud Ash-Shuraym", nameUr: "سعود الشریم" },
  { id: "ar.mahermuaiqly", name: "Maher Al-Muaiqly", nameUr: "ماہر المعیقلی" },
  { id: "ur.khan", name: "Shamshad Ali Khan (Urdu translation audio)", nameUr: "شمشاد علی خان (اردو ترجمہ آڈیو)" },
];
