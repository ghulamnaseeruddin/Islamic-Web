// Quiz questions. Each answer was checked against the Qur'an or well-known Sunnah facts.
// [english, urdu]
export type Pair = [string, string];
export type QuizQuestion = {
  q: Pair;
  options: Pair[];
  answer: number; // index in options
  why: Pair;
};

const p = (en: string, ur: string): Pair => [en, ur];

export const QUIZ: QuizQuestion[] = [
  { q: p("How many surahs are in the Qur'an?", "قرآن مجید میں کتنی سورتیں ہیں؟"), options: [p("110", "110"), p("114", "114"), p("120", "120"), p("99", "99")], answer: 1, why: p("The Qur'an has 114 surahs.", "قرآن مجید میں 114 سورتیں ہیں۔") },
  { q: p("Which is the longest surah?", "سب سے لمبی سورت کون سی ہے؟"), options: [p("Al-Baqarah", "البقرہ"), p("Al-Imran", "آل عمران"), p("An-Nisa", "النساء"), p("Al-Maidah", "المائدہ")], answer: 0, why: p("Al-Baqarah has 286 ayahs.", "سورۃ البقرہ کی 286 آیات ہیں۔") },
  { q: p("Which is the shortest surah?", "سب سے چھوٹی سورت کون سی ہے؟"), options: [p("Al-Ikhlas", "الاخلاص"), p("Al-Asr", "العصر"), p("Al-Kawthar", "الکوثر"), p("An-Nas", "الناس")], answer: 2, why: p("Al-Kawthar has only 3 ayahs.", "سورۃ الکوثر میں صرف 3 آیات ہیں۔") },
  { q: p("Which word was the first revealed to the Prophet ﷺ?", "نبی ﷺ پر سب سے پہلے کون سا لفظ نازل ہوا؟"), options: [p("Qul (Say)", "قل"), p("Iqra (Read)", "اقرأ"), p("Ya ayyuha (O you)", "یا ایہا"), p("Alif Lam Mim", "الم")], answer: 1, why: p("Surah Al-Alaq (96:1-5) begins with “Iqra”.", "سورۃ العلق (96:1-5) کا آغاز «اقرأ» سے ہوتا ہے۔") },
  { q: p("How many obligatory prayers are there each day?", "روزانہ کتنی نمازیں فرض ہیں؟"), options: [p("3", "3"), p("4", "4"), p("5", "5"), p("6", "6")], answer: 2, why: p("Fajr, Dhuhr, Asr, Maghrib and Isha.", "فجر، ظہر، عصر، مغرب اور عشاء۔") },
  { q: p("How many pillars of Islam are there?", "اسلام کے کتنے ارکان ہیں؟"), options: [p("4", "4"), p("5", "5"), p("6", "6"), p("7", "7")], answer: 1, why: p("Shahadah, prayer, zakat, fasting in Ramadan and Hajj (Bukhari, Muslim).", "شہادت، نماز، زکوٰۃ، رمضان کے روزے اور حج (بخاری، مسلم)۔") },
  { q: p("In which month do Muslims fast?", "مسلمان کس مہینے میں روزے رکھتے ہیں؟"), options: [p("Shaban", "شعبان"), p("Ramadan", "رمضان"), p("Shawwal", "شوال"), p("Muharram", "محرم")], answer: 1, why: p("Qur'an 2:185.", "قرآن 2:185۔") },
  { q: p("Which prophet, with his son Ismail, raised the foundations of the Kaaba?", "کس نبی نے اپنے بیٹے اسماعیل کے ساتھ کعبہ کی بنیادیں اٹھائیں؟"), options: [p("Nuh", "نوح"), p("Ibrahim", "ابراہیم"), p("Musa", "موسیٰ"), p("Yusuf", "یوسف")], answer: 1, why: p("Qur'an 2:127.", "قرآن 2:127۔") },
  { q: p("Which prophet was swallowed by a great fish?", "کس نبی کو بڑی مچھلی نے نگل لیا تھا؟"), options: [p("Yunus", "یونس"), p("Ayyub", "ایوب"), p("Ilyas", "الیاس"), p("Harun", "ہارون")], answer: 0, why: p("Qur'an 37:139-144 and 21:87.", "قرآن 37:139-144 اور 21:87۔") },
  { q: p("In which city was the Prophet ﷺ born?", "نبی ﷺ کس شہر میں پیدا ہوئے؟"), options: [p("Madinah", "مدینہ"), p("Taif", "طائف"), p("Makkah", "مکہ"), p("Jerusalem", "یروشلم")], answer: 2, why: p("He was born in Makkah, in the Year of the Elephant.", "آپ ﷺ مکہ میں عام الفیل میں پیدا ہوئے۔") },
  { q: p("To which city did the Prophet ﷺ migrate (Hijra)?", "نبی ﷺ نے کس شہر کی طرف ہجرت فرمائی؟"), options: [p("Madinah", "مدینہ"), p("Habasha (Abyssinia)", "حبشہ"), p("Taif", "طائف"), p("Damascus", "دمشق")], answer: 0, why: p("The Hijra to Madinah marks the start of the Hijri calendar (622 CE).", "مدینہ کی ہجرت سے ہجری سن شروع ہوتا ہے (622ء)۔") },
  { q: p("Which was the first major battle of the Muslims?", "مسلمانوں کی پہلی بڑی جنگ کون سی تھی؟"), options: [p("Uhud", "احد"), p("Badr", "بدر"), p("Khandaq", "خندق"), p("Hunayn", "حنین")], answer: 1, why: p("Badr took place in Ramadan, 2 AH.", "غزوۂ بدر 2 ہجری رمضان میں ہوا۔") },
  { q: p("Which surah does NOT begin with Bismillah?", "کون سی سورت بسم اللہ سے شروع نہیں ہوتی؟"), options: [p("At-Tawbah", "التوبہ"), p("Al-Anfal", "الانفال"), p("Yasin", "یٰسٓ"), p("Al-Falaq", "الفلق")], answer: 0, why: p("Surah At-Tawbah (9) starts without Bismillah.", "سورۃ التوبہ (9) بسم اللہ کے بغیر شروع ہوتی ہے۔") },
  { q: p("Which surah contains Bismillah twice?", "کس سورت میں بسم اللہ دو بار آئی ہے؟"), options: [p("Al-Fatihah", "الفاتحہ"), p("An-Naml", "النمل"), p("Al-Kahf", "الکہف"), p("Maryam", "مریم")], answer: 1, why: p("At the start and inside 27:30 (the letter of Sulayman).", "آغاز میں اور آیت 27:30 میں (سلیمان کا خط)۔") },
  { q: p("What is the usual rate of zakat on savings above the nisab?", "نصاب سے زائد جمع شدہ مال پر زکوٰۃ کی عام شرح کیا ہے؟"), options: [p("1%", "1%"), p("2.5%", "2.5%"), p("5%", "5%"), p("10%", "10%")], answer: 1, why: p("One-fortieth, which is 2.5%.", "چالیسواں حصہ، یعنی 2.5%۔") },
  { q: p("Who is the angel who brought revelation?", "وحی لانے والے فرشتے کا نام کیا ہے؟"), options: [p("Mikail", "میکائیل"), p("Israfil", "اسرافیل"), p("Jibril", "جبریل"), p("Malik", "مالک")], answer: 2, why: p("Qur'an 2:97 and 26:193.", "قرآن 2:97 اور 26:193۔") },
  { q: p("Laylat al-Qadr is better than how many months?", "لیلۃ القدر کتنے مہینوں سے بہتر ہے؟"), options: [p("100", "100"), p("500", "500"), p("1000", "1000"), p("30", "30")], answer: 2, why: p("Qur'an 97:3.", "قرآن 97:3۔") },
  { q: p("How many ayahs does Surah Al-Fatihah have?", "سورۃ الفاتحہ کی کتنی آیات ہیں؟"), options: [p("5", "5"), p("6", "6"), p("7", "7"), p("8", "8")], answer: 2, why: p("It has 7 ayahs, called Sab' al-Mathani.", "اس کی 7 آیات ہیں۔") },
  { q: p("Who was the first wife of the Prophet ﷺ?", "نبی ﷺ کی پہلی زوجہ کون تھیں؟"), options: [p("Aisha", "عائشہ"), p("Hafsa", "حفصہ"), p("Khadijah", "خدیجہ"), p("Umm Salamah", "ام سلمہ")], answer: 2, why: p("Khadijah bint Khuwaylid (may Allah be pleased with her).", "خدیجہ بنت خویلد رضی اللہ عنہا۔") },
  { q: p("Who was the first caliph after the Prophet ﷺ?", "نبی ﷺ کے بعد پہلے خلیفہ کون تھے؟"), options: [p("Umar", "عمر"), p("Uthman", "عثمان"), p("Ali", "علی"), p("Abu Bakr", "ابوبکر")], answer: 3, why: p("Abu Bakr as-Siddiq (may Allah be pleased with him).", "ابوبکر صدیق رضی اللہ عنہ۔") },
  { q: p("Who was the brother of Musa who helped him?", "موسیٰ علیہ السلام کے بھائی کون تھے جو ان کے مددگار بنے؟"), options: [p("Harun", "ہارون"), p("Ismail", "اسماعیل"), p("Ishaq", "اسحاق"), p("Zakariyya", "زکریا")], answer: 0, why: p("Qur'an 20:29-30.", "قرآن 20:29-30۔") },
  { q: p("Which prophet was given the Zabur (Psalms)?", "کس نبی کو زبور دی گئی؟"), options: [p("Dawud", "داؤد"), p("Sulayman", "سلیمان"), p("Musa", "موسیٰ"), p("Isa", "عیسیٰ")], answer: 0, why: p("Qur'an 4:163.", "قرآن 4:163۔") },
  { q: p("Ayat al-Kursi is in which surah?", "آیۃ الکرسی کس سورت میں ہے؟"), options: [p("Al-Baqarah", "البقرہ"), p("Al-Imran", "آل عمران"), p("Yasin", "یٰسٓ"), p("Al-Hashr", "الحشر")], answer: 0, why: p("It is ayah 255 of Al-Baqarah.", "یہ سورۃ البقرہ کی آیت 255 ہے۔") },
  { q: p("Surah An-Nahl is named after which creature?", "سورۃ النحل کس مخلوق کے نام پر ہے؟"), options: [p("The ant", "چیونٹی"), p("The bee", "شہد کی مکھی"), p("The spider", "مکڑی"), p("The cow", "گائے")], answer: 1, why: p("An-Nahl means the bee (16:68).", "نحل کا مطلب شہد کی مکھی ہے (16:68)۔") },
  { q: p("On which day of Dhul Hijjah is the Day of Arafah?", "یومِ عرفہ ذوالحجہ کی کس تاریخ کو ہوتا ہے؟"), options: [p("8th", "8"), p("9th", "9"), p("10th", "10"), p("12th", "12")], answer: 1, why: p("The 9th. The 10th is Eid al-Adha.", "9 تاریخ کو۔ 10 تاریخ عیدالاضحیٰ ہے۔") },
  { q: p("How many fard rak'ah are in the Fajr prayer?", "نمازِ فجر میں کتنی رکعتیں فرض ہیں؟"), options: [p("2", "2"), p("3", "3"), p("4", "4"), p("1", "1")], answer: 0, why: p("Two rak'ah.", "دو رکعتیں۔") },
  { q: p("Which prophet was thrown into the fire and Allah made it cool and safe?", "کس نبی کو آگ میں ڈالا گیا اور اللہ نے اسے ٹھنڈا اور سلامتی والا بنا دیا؟"), options: [p("Ibrahim", "ابراہیم"), p("Nuh", "نوح"), p("Lut", "لوط"), p("Hud", "ہود")], answer: 0, why: p("Qur'an 21:69.", "قرآن 21:69۔") },
  { q: p("To which prophet did Allah speak directly?", "اللہ نے کس نبی سے براہِ راست کلام فرمایا؟"), options: [p("Musa", "موسیٰ"), p("Yusuf", "یوسف"), p("Salih", "صالح"), p("Shuayb", "شعیب")], answer: 0, why: p("“And Allah spoke to Musa directly” (4:164).", "«اور اللہ نے موسیٰ سے خوب کلام فرمایا» (4:164)۔") },
  { q: p("How many juz (parts) does the Qur'an have?", "قرآن مجید کے کتنے پارے ہیں؟"), options: [p("20", "20"), p("30", "30"), p("40", "40"), p("60", "60")], answer: 1, why: p("30 juz.", "30 پارے۔") },
  { q: p("What was the name of the Prophet's ﷺ mother?", "نبی ﷺ کی والدہ کا نام کیا تھا؟"), options: [p("Aminah", "آمنہ"), p("Halimah", "حلیمہ"), p("Fatimah", "فاطمہ"), p("Sumayyah", "سمیہ")], answer: 0, why: p("Aminah bint Wahb.", "آمنہ بنت وہب۔") },
  { q: p("Who is the last of the prophets?", "آخری نبی کون ہیں؟"), options: [p("Isa", "عیسیٰ"), p("Muhammad ﷺ", "محمد ﷺ"), p("Ibrahim", "ابراہیم"), p("Dawud", "داؤد")], answer: 1, why: p("“…the Messenger of Allah and the Seal of the Prophets” (33:40).", "«…اللہ کے رسول اور خاتم النبیین» (33:40)۔") },
];
