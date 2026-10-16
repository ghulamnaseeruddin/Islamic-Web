# Noor ul Ilm — Setup Guide (from zero)

Follow the steps in order. Each step is small. Total time: about 45 minutes.

You need: a computer, internet, a Gmail account.

---

> Updating an existing project? Also run `supabase/update_features.sql` in the SQL Editor (adds the Hifz tracker table).

## Part 1 — Install the tools

1. **Node.js (LTS version 20 or newer)** — download from https://nodejs.org and install. Check in a terminal: `node -v`.
2. **Git** — https://git-scm.com/downloads . Check: `git --version`.
3. **VS Code** — https://code.visualstudio.com .

## Part 2 — Open the project in VS Code

1. Unzip the project folder (`noor-ul-ilm`).
2. VS Code → **File → Open Folder** → choose `noor-ul-ilm`.
3. VS Code asks to install recommended extensions (Tailwind CSS, ESLint, Prettier). Click **Install**.
4. Open the terminal: **Terminal → New Terminal**.
5. Run: `npm install`

## Part 3 — Create the database (Supabase)

1. Go to https://supabase.com → **Start your project** → sign in → **New project**. Choose a name (`noor-ul-ilm`), a strong database password (save it), and the region nearest to you.
2. Wait 1–2 minutes until the project is ready.
3. Left menu → **SQL Editor → New query**.
   * Open `supabase/schema.sql` in VS Code, copy everything, paste, click **Run**.
   * New query again. Open `supabase/seed_library.sql`, copy everything, paste, click **Run**. (This fills the library.)
4. Left menu → **Project Settings → API**. Copy:
   * **Project URL**
   * **anon / publishable key**
   * **service_role key** (secret!)

## Part 4 — Environment file

1. In VS Code, copy `.env.example` to a new file named `.env.local`.
2. Fill in:
   * `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
   * `SUPABASE_SERVICE_ROLE_KEY` = service_role key
3. AI keys (free):
   * Groq: https://console.groq.com/keys → create key → `GROQ_API_KEY`
   * Gemini: https://aistudio.google.com/apikey → create key → `GEMINI_API_KEY`
   * Leave `OPENAI_API_KEY` empty (OpenAI's API has no free tier).
   * You can use only one of them. The app uses whichever has a key.

## Part 5 — Turn on login

### Email and password
Supabase → **Authentication → Providers → Email** is on by default.
Optional while testing: **Authentication → Sign In / Providers → Email → turn off "Confirm email"** so you can sign in without checking email. Turn it back on for the real launch.

### Google login
1. Go to https://console.cloud.google.com → create a project.
2. **APIs & Services → OAuth consent screen** → External → fill app name (Noor ul Ilm), your email → Save.
3. **Credentials → Create credentials → OAuth client ID → Web application**.
4. Under **Authorized redirect URIs** add exactly the URL shown in Supabase at **Authentication → Providers → Google → Callback URL** (looks like `https://xxxx.supabase.co/auth/v1/callback`).
5. Copy the **Client ID** and **Client Secret** into Supabase **Authentication → Providers → Google**, turn it **on**, Save.

### Two-step login (2FA)
Supabase → **Authentication → Sign In / Providers → Multi-Factor** → make sure **TOTP** is enabled (it is on by default). Users then turn 2FA on in **Profile → Two-step login**.

### Allowed redirect URLs
Supabase → **Authentication → URL Configuration**:
* **Site URL**: `http://localhost:3000` (change to your Vercel URL after Part 8)
* **Redirect URLs**: add `http://localhost:3000/**` (and later `https://YOUR-APP.vercel.app/**`)

## Part 6 — Run it

```bash
npm run dev
```

Open http://localhost:3000. You should see the sign in page. Create an account, then you will see the home page.

### Make yourself admin
After you signed up, in Supabase **SQL Editor** run (put your own email):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Refresh the app. You now see **Admin** in the profile menu.

## Part 7 — Push to GitHub

1. Create an empty repository on https://github.com/new (name `noor-ul-ilm`, **Private** is fine, do **not** add README).
2. In the VS Code terminal:

```bash
git init
git add .
git commit -m "Noor ul Ilm web app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/noor-ul-ilm.git
git push -u origin main
```

`.env.local` is in `.gitignore`, so your secret keys are **not** uploaded. Never remove it from `.gitignore`.

## Part 8 — Deploy on Vercel

1. Go to https://vercel.com → sign in with GitHub → **Add New → Project** → import `noor-ul-ilm`.
2. Framework is detected as **Next.js**. Open **Environment Variables** and add every variable from your `.env.local` (same names and values).
3. Click **Deploy**. After about 2 minutes you get a URL like `https://noor-ul-ilm.vercel.app`.
4. Go back to Supabase **Authentication → URL Configuration**:
   * **Site URL** = your Vercel URL
   * **Redirect URLs** add `https://YOUR-APP.vercel.app/**`
5. Google login needs no change (it uses the Supabase callback URL).
6. Every time you `git push`, Vercel deploys again automatically.

### Before you share it publicly
* Google consent screen → **Publish app** (otherwise only test users can sign in). Google asks for a privacy page: use `https://YOUR-APP.vercel.app/privacy` and terms `https://YOUR-APP.vercel.app/terms`.
* Optional: set `NEXT_PUBLIC_CONTACT_EMAIL` so the Privacy page shows your email.
* Supabase free projects send only a few emails per hour. For real users set your own SMTP in **Authentication → SMTP Settings** (for example Resend or Brevo free plans).
* Install on phone: open the site in Chrome → menu → **Install app / Add to Home screen**.

## Part 9 — Check everything

* Sign up with email → confirm → sign in.
* Sign in with Google.
* Open Qur'an → a surah → play audio, open tafsir, bookmark.
* Prayer times show for your city.
* Library shows folders and books.
* Ask Noor answers (needs an AI key).
* Profile → upload photo; turn on 2FA and sign in again.
* Hadith → Search hadith text.
* Settings → Qur'an script → Indo-Pak.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Supabase keys are missing" | `.env.local` missing or wrong. Restart `npm run dev` after editing it. |
| Library says it cannot load | You did not run `schema.sql` and `seed_library.sql`. |
| Google login goes back to login page | Check Redirect URLs in Part 5, and the Google redirect URI. |
| Ask Noor says not set up | Add `GROQ_API_KEY` or `GEMINI_API_KEY` (on Vercel too) and redeploy. |
| Ask Noor says AI is busy | Free limit reached or a model name changed. Put a current model name in `GROQ_MODEL_SMART` / `GEMINI_MODEL_SMART`. |
| Delete account fails | `SUPABASE_SERVICE_ROLE_KEY` missing on the server. |
| Qur'an or Hadith text does not load | The free source is down or blocked by your network. Press retry. |
| Photo upload fails | `schema.sql` creates the `avatars` bucket. Run it again. |
| Build fails on Vercel | Open the build log, copy the first error. The project is set to ignore type warnings so a build should pass, but a real error (for example a missing package) will show there. |

## Useful commands

```bash
npm run dev         # run locally
npm run build       # production build
npm run typecheck   # find type mistakes
npm test            # logic tests
npm run check:i18n  # English and Urdu words match
npm run seed:library  # rebuild seed_library.sql from supabase/tools/library-data.json
```

## Adding books to the library

Easiest: sign in as admin → **Admin → Books** → choose a folder → fill the title and the link → Add. You can hide any book or whole folder with **Hide**.

For the Google Drive folder "احتساب ناصبیت", the library has one entry that opens the whole folder. To list each book separately, add them from Admin with their exact names and their Drive share links (anyone with the link).

## Free-tier notes

* Supabase free: 500 MB database, 1 GB file storage. A project pauses after a week of no use; open it to resume.
* Vercel Hobby: free for personal, non-commercial projects.
* Groq and Gemini free limits change. The app also limits each user (`AI_DAILY_LIMIT`, default 25 per day).

## Next apps

The desktop app (Windows/Mac) and the mobile app (Android/iOS) will reuse this same Supabase database and the same login. Tell me when you want to start them.
