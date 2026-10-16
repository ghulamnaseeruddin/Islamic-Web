<p align="center"><img src="public/logo.png" alt="Noor ul Ilm — Light of Islam" width="160"></p>

# Noor ul Ilm — نور العلم

An Islamic knowledge web app based **only on the Qur'an and the Sunnah**. No sect labels. Made for every Muslim, with Pakistan and Urdu in mind.

**Setup, step by step (VS Code, Supabase, Google login, GitHub, Vercel): [`docs/SETUP.md`](docs/SETUP.md)**

## What is inside

| Area | What it does |
|---|---|
| Sign up / Sign in | Name, email, password, confirm password, and Google. Everything in the app needs a login. |
| Qur'an | 114 surahs, Arabic with up to 3 translations (8 Urdu, 4 English), tafsir (Ibn Kathir and others), audio with 8 reciters, repeat and speed, bookmarks, notes, reading progress. |
| Hadith | Bukhari, Muslim, Tirmizi, Abu Dawood, Ibn Majah, Nisai in Arabic, Urdu and English with grades. Jump by number, and full-text search. |
| Library | All folders and books copied from the original library by name (Al Qur'an, Al Hadith, Research Papers & Azkaar, Other Books). Files open from the original site. |
| Azkaar | Counter with sources, key Qur'anic adhkar, link to azkaar books. |
| Prayer | Times for 22 Pakistani cities or your location, Asr "Later / Standard", methods, Qibla, month table, Hijri date with adjustment, reminders. |
| Ask Noor | AI answers built only from Qur'an verses shown under the answer. Free-tier Groq and Gemini, daily limit per user. |
| Search | Qur'an search in Urdu, English, Arabic, plus library titles. |
| Profile and Settings | Photo, name, city, bio, password, stats and streak, download my data, sign out everywhere, delete account. Themes (light, dark, sepia), text sizes, translations, tafsir, reciter, prayer settings. |
| Security and app | Optional two-step login (authenticator app), installable on phone and desktop, Privacy and Terms pages. |
| Admin | Add, hide and show library books and folders. See user reports. |

## More tools (open the **More** tab)
99 Names of Allah, Duas with sources, Ramadan timetable and Islamic calendar, Zakat calculator, Qibla compass, Hifz tracker and Khatam planner, mosque finder (OpenStreetMap), Islamic quiz, Seerah timeline, offline surahs, share-an-ayah image, and word-by-word / tajweed colours (button on every surah).

Already ran `schema.sql` before? Run `supabase/update_features.sql` once (adds the hifz table).

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

Useful commands: `npm run typecheck`, `npm test`, `npm run check:i18n`, `npm run seed:library`.

## Folder map

```
src/app/(auth)     login, signup, forgot password
src/app/(app)      every page that needs a login
src/app/api        ask (AI) and account/delete
src/components     shared pieces
src/lib            dictionary (English + Urdu), settings, prayer, quran, hadith, ai
supabase/          schema.sql, seed_library.sql, tools/
docs/SETUP.md      full setup guide
```

## Honest notes

* Qur'an text, translations, audio, tafsir and hadith text are loaded live from free public sources (alquran.cloud, Quran.com, a hadith dataset on jsDelivr). If one is down, that part shows a retry message.
* Library files are links to the original library. This app does not host or copy them.
* AI can be wrong. Ask Noor is limited to the verses it shows and never gives fatwas.
* Model names and free-tier limits of Groq and Gemini change. Update them in `.env.local` if needed.
