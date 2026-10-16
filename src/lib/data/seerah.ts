// A short timeline of the life of the Prophet ﷺ.
// Dates are approximate (CE and AH). Scholars differ on the exact year or day of some events;
// where they differ, the event is marked "approx". Main sources: Ibn Hisham, Ibn Kathir (Al-Bidayah wa'l-Nihayah).
export type SeerahEvent = {
  year: string; // display text, e.g. "~570 CE"
  ah?: string;
  en: string;
  ur: string;
  place: "Makkah" | "Madinah" | "Other";
  ref?: string; // a Qur'an ref where relevant
};

export const SEERAH: SeerahEvent[] = [
  { year: "~570 CE", en: "Birth of the Prophet ﷺ in Makkah, in the Year of the Elephant, on a Monday in Rabi' al-Awwal (the exact day is differed upon).", ur: "نبی ﷺ کی مکہ میں ولادت، عام الفیل میں، ربیع الاول کے مہینے میں پیر کے دن (تاریخ میں اختلاف ہے)۔", place: "Makkah" },
  { year: "~576 CE", en: "Death of his mother Aminah, at about 6 years of age.", ur: "والدہ آمنہ کا انتقال، آپ ﷺ کی عمر تقریباً 6 سال۔", place: "Other" },
  { year: "~578 CE", en: "Death of his grandfather Abd al-Muttalib; his uncle Abu Talib cares for him.", ur: "دادا عبدالمطلب کا انتقال؛ چچا ابو طالب نے کفالت کی۔", place: "Makkah" },
  { year: "~595 CE", en: "Marriage to Khadijah bint Khuwaylid (may Allah be pleased with her).", ur: "خدیجہ بنت خویلد رضی اللہ عنہا سے نکاح۔", place: "Makkah" },
  { year: "~610 CE", en: "The first revelation in the Cave of Hira, at about 40 years of age: “Iqra”.", ur: "غارِ حرا میں پہلی وحی، عمر تقریباً 40 سال: «اقرأ»۔", place: "Makkah", ref: "96:1" },
  { year: "~613 CE", en: "Open call to Islam begins in Makkah.", ur: "مکہ میں اعلانیہ دعوتِ اسلام کا آغاز۔", place: "Makkah", ref: "15:94" },
  { year: "~615 CE", en: "First migration of Muslims to Abyssinia (Habasha) to escape persecution.", ur: "ظلم سے بچنے کے لیے مسلمانوں کی حبشہ کی طرف پہلی ہجرت۔", place: "Other" },
  { year: "~619 CE", en: "The Year of Sorrow: the deaths of Abu Talib and Khadijah. Journey to Taif.", ur: "عام الحزن: ابو طالب اور خدیجہ رضی اللہ عنہا کی وفات۔ طائف کا سفر۔", place: "Makkah" },
  { year: "~621 CE", en: "Al-Isra wal-Mi'raj, the night journey and ascension. The five daily prayers were prescribed (the exact date is differed upon).", ur: "اسراء و معراج، رات کا سفر اور آسمانوں کی سیر؛ پانچ نمازیں فرض ہوئیں (تاریخ میں اختلاف ہے)۔", place: "Makkah", ref: "17:1" },
  { year: "622 CE", ah: "1 AH", en: "The Hijra to Madinah. The Prophet's Mosque is built. The Hijri calendar begins.", ur: "مدینہ کی طرف ہجرت۔ مسجدِ نبوی کی تعمیر۔ ہجری سن کا آغاز۔", place: "Madinah" },
  { year: "624 CE", ah: "2 AH", en: "The qibla is changed to the Kaaba. Fasting of Ramadan is prescribed. The Battle of Badr.", ur: "قبلہ کعبہ کی طرف بدلا۔ رمضان کے روزے فرض ہوئے۔ غزوۂ بدر۔", place: "Madinah", ref: "2:144" },
  { year: "625 CE", ah: "3 AH", en: "The Battle of Uhud.", ur: "غزوۂ احد۔", place: "Madinah", ref: "3:121" },
  { year: "627 CE", ah: "5 AH", en: "The Battle of the Trench (Khandaq), the siege of Madinah.", ur: "غزوۂ خندق، مدینہ کا محاصرہ۔", place: "Madinah", ref: "33:9" },
  { year: "628 CE", ah: "6 AH", en: "The Treaty of Hudaybiyyah.", ur: "صلحِ حدیبیہ۔", place: "Other", ref: "48:1" },
  { year: "629 CE", ah: "7 AH", en: "Khaybar. The Prophet ﷺ performs the Umrah of Qada.", ur: "خیبر۔ نبی ﷺ نے عمرۃ القضاء ادا فرمایا۔", place: "Other" },
  { year: "630 CE", ah: "8 AH", en: "The Conquest of Makkah in Ramadan; the Battle of Hunayn.", ur: "رمضان میں فتحِ مکہ؛ غزوۂ حنین۔", place: "Makkah", ref: "110:1" },
  { year: "631 CE", ah: "9 AH", en: "The expedition to Tabuk. The Year of Delegations: tribes come to accept Islam.", ur: "غزوۂ تبوک۔ عام الوفود: قبائل کے وفود اسلام قبول کرنے آئے۔", place: "Madinah" },
  { year: "632 CE", ah: "10 AH", en: "The Farewell Pilgrimage and the sermon at Arafah.", ur: "حجۃ الوداع اور میدانِ عرفات میں خطبہ۔", place: "Makkah", ref: "5:3" },
  { year: "632 CE", ah: "11 AH", en: "The Prophet ﷺ passes away in Madinah on a Monday in Rabi' al-Awwal (the day of the month is differed upon).", ur: "نبی ﷺ کا مدینہ میں ربیع الاول کے مہینے میں پیر کے دن وصال (مہینے کی تاریخ میں اختلاف ہے)۔", place: "Madinah" },
];
