import type { ReactNode } from "react";
import { A, Callout, DocTable } from "@/components/docs/ui";

// The text of every Docs page (English only). The keys match the slugs in docs.ts.

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
const UPDATED = "23 October 2026";

export const DOC_BODIES: Record<string, ReactNode> = {
  welcome: (
    <>
      <p>
        Noor ul Ilm is a free website and app for reading the Qur&apos;an and Hadith, checking prayer times, and asking questions that
        are answered only from the verses and hadith shown next to the answer. I build it and look after it myself.
      </p>
      <Callout>
        <p>
          Just want to use it? Go to the <A href="/">app</A>. Want it on your phone or computer? See{" "}
          <A href="/docs/install">Install the apps</A>.
        </p>
      </Callout>
      <h2 id="where">Where to find things</h2>
      <DocTable
        head={["Section", "What it does"]}
        rows={[
          [<A key="q" href="/docs/quran">Qur&apos;an</A>, "Read by surah or by Para, with translations, tafsir and audio."],
          [<A key="h" href="/docs/hadith">Hadith and Library</A>, "Six hadith books, plus a library of books and papers."],
          [<A key="a" href="/docs/ask">Ask Noor</A>, "Ask a question and get an answer with the verses and hadith it comes from."],
          [<A key="p" href="/docs/prayer">Prayer</A>, "Prayer times, Qibla and the Islamic calendar."],
          [<A key="o" href="/docs/offline">Offline</A>, "Surahs you saved to read without internet."],
          [<A key="m" href="/docs/more">More</A>, "Names of Allah, duas, zakat, hifz tracker, quiz and more."],
        ]}
      />
      <h2 id="rules">One rule I keep</h2>
      <p>
        The app is built only on the Qur&apos;an and the Sunnah. It is a study aid, not a fatwa service. For a religious ruling, please ask a
        qualified scholar.
      </p>
    </>
  ),

  account: (
    <>
      <p>You need an account to save bookmarks, notes and reading progress. It&apos;s free.</p>
      <h2 id="signup">Sign up</h2>
      <ul>
        <li>Open the app and choose <b>Create account</b>. Enter your full name, your email and a password of at least 8 characters.</li>
        <li>I send a confirmation link to your email. Open it and your account is ready. If you can&apos;t find it, check your spam folder.</li>
        <li>Or tap <b>Continue with Google</b> and skip the password.</li>
      </ul>
      <h2 id="signin">Sign in</h2>
      <p>Use the same email and password, or Google. If two-step login is on, you&apos;ll be asked for a code after your password.</p>
      <h2 id="reset">Forgot your password</h2>
      <p>
        On the sign-in page tap <b>Forgot password?</b>, enter your email and I&apos;ll send a reset link. For safety the page says the same thing
        whether or not that email has an account.
      </p>
    </>
  ),

  install: (
    <>
      <p>
        I&apos;m building native apps for <b>Windows</b> and <b>Android</b>. They aren&apos;t ready yet, so the <b>Download apps</b> page on the
        website shows &quot;Coming soon&quot; for both. Until then, the website works in any browser on your phone or computer.
      </p>
      <DocTable
        head={["Device", "Status"]}
        rows={[
          ["Windows", "Native app coming soon."],
          ["Android", "Native app coming soon."],
        ]}
      />
      <h2 id="now">Use it like an app today</h2>
      <p>
        In Chrome or Edge, open Noor ul Ilm and click <b>Install</b> in the address bar. On an Android phone, use the browser menu and choose{" "}
        <b>Add to Home screen</b>. On an iPhone, open the site in Safari, tap Share, then <b>Add to Home Screen</b>. You get an icon that opens
        the site full screen.
      </p>
      <p>I&apos;ll announce the native apps on the Download apps page when they&apos;re ready.</p>
    </>
  ),

  quran: (
    <>
      <p>Open <b>Qur&apos;an</b> and choose how you want to read: by surah or by Para.</p>
      <h2 id="surah">By surah</h2>
      <p>Pick a surah from the list, or search by name or number. The <b>Continue reading</b> card takes you back to where you stopped.</p>
      <h2 id="para">By Para (Juz)</h2>
      <p>
        The <b>Para</b> tab lists all 30 Paras. Each card shows how many verses it has and where it starts and ends. Opening a Para shows only
        that Para&apos;s verses, with <b>Starts at</b> and <b>Ends at</b> at the top, and buttons for the next and previous Para.
      </p>
      <h3 id="ruku">Ruku marks</h3>
      <p>
        Inside a Para, each ruku is marked with the Arabic letter ع, its number and how many verses it has. Numbers count inside that Para.
        They come from the data source I use, so in a few places they may differ by a verse from the printed Qur&apos;an you own. If you spot one,
        tell me.
      </p>
      <h2 id="settings">Make it yours</h2>
      <ul>
        <li>Choose up to three translations and a tafsir book.</li>
        <li>Pick the Arabic script: Standard (Uthmani) or Indo-Pak, the style used in Pakistan and India.</li>
        <li>Choose a reciter, the audio speed, and whether each verse repeats.</li>
        <li>Set a daily goal. It counts when you tap <b>I finished this surah</b>.</li>
        <li>Change the Arabic and Urdu text size, and switch between Light, Dark and Sepia themes.</li>
      </ul>
      <p>All of these are in <b>Settings</b>.</p>
      <h2 id="sources">Where the text comes from</h2>
      <p>
        The Qur&apos;an text, translations and audio come from alquran.cloud, and tafsir comes from Quran.com. They&apos;re free public sources and
        can occasionally be down or contain a mistake. Use <b>Report a problem</b> to tell me.
      </p>
    </>
  ),

  hadith: (
    <>
      <h2 id="books">The six books</h2>
      <p>Hadith reading covers these books, with Arabic and translation:</p>
      <ul>
        <li>Sahih Bukhari</li>
        <li>Sahih Muslim</li>
        <li>Jamia Tirmizi</li>
        <li>Sunan Abu Dawood</li>
        <li>Sunan Ibn-e-Majah</li>
        <li>Sunan Nisai</li>
      </ul>
      <p>The text comes from a free open-source hadith collection.</p>
      <h2 id="library">Library</h2>
      <p>
        Other books, such as Mishkat al-Masabih, Musnad Ahmad and Al Silsila Sahiha, are in the <b>Library</b> as PDFs. The Library only links to
        files on their original websites. I don&apos;t host them, and the copyright belongs to their owners.
      </p>
      <h2 id="search">Search</h2>
      <p>The search icon at the top looks through the Qur&apos;an and Hadith for the words you type.</p>
    </>
  ),

  ask: (
    <>
      <p>
        Ask Noor answers questions about Islam using only the Qur&apos;an verses and hadith it finds. Every answer shows those verses and hadith with
        their references, so you can check them yourself.
      </p>
      <h2 id="how">How it works</h2>
      <ol className="list-decimal ps-6">
        <li>Type your question, or tap the microphone and speak. Any language works. Urdu gets an Urdu answer, English gets an English answer.</li>
        <li>Noor first tells you what it thinks you&apos;re asking and shows <b>Yes</b> and <b>No</b>. This is shown in English and Urdu together.</li>
        <li>If you tap <b>Yes</b>, it writes the answer. If you tap <b>No</b>, you can ask again in different words.</li>
      </ol>
      <Callout>
        <p>Only the Yes step uses up one of your questions for the day. There&apos;s a daily limit, currently 25 questions.</p>
      </Callout>
      <h2 id="verified">What &quot;verified&quot; means</h2>
      <p>
        An answer can only quote verses and hadith that were actually found. If a reference can&apos;t be backed up, it&apos;s removed. If nothing could
        be checked, Noor says so instead of guessing.
      </p>
      <h2 id="limits">Things to know</h2>
      <ul>
        <li>It&apos;s an AI, so it can make mistakes. Always read the verses shown.</li>
        <li>It isn&apos;t a fatwa. For a ruling, ask a qualified scholar.</li>
        <li>It needs internet.</li>
        <li>The microphone works in Chrome, Edge and Safari, not in Firefox.</li>
        <li>Your question and a few verses are sent to an AI provider (Groq or Google Gemini) to write the answer. Please don&apos;t type private details.</li>
      </ul>
    </>
  ),

  prayer: (
    <>
      <h2 id="times">Prayer times</h2>
      <p>
        Times are worked out on your device from your location. If you tap <b>Use my location</b>, it&apos;s saved in your settings and isn&apos;t sent
        anywhere else. They can differ by a few minutes from your local mosque, so check your local timetable.
      </p>
      <h2 id="adjust">Adjusting them</h2>
      <ul>
        <li><b>Calculation method</b>: pick the one your community follows.</li>
        <li><b>Asr time</b>: Later (shadow twice the object, the default) or Standard (shadow equal to the object).</li>
        <li><b>Hijri date adjustment</b>: moon sighting can differ by a day, so move the date by a day if you need to.</li>
      </ul>
      <h2 id="reminders">Reminders</h2>
      <p>
        If you allow notifications, the app can remind you of prayer times while it&apos;s open. Reminders when the app is closed need push
        notifications, which I haven&apos;t built yet.
      </p>
      <h2 id="qibla">Qibla and Ramadan</h2>
      <p>
        <b>Qibla</b> uses your phone&apos;s compass. Hold the phone flat and away from metal. <b>Ramadan</b> shows the sehri and iftar timetable and
        Islamic calendar events.
      </p>
    </>
  ),

  offline: (
    <>
      <p>Some things work without internet, and many don&apos;t. Here&apos;s the honest list.</p>
      <DocTable
        head={["Works offline", "Needs internet"]}
        rows={[
          ["Surahs you saved with Save offline", "Surahs you didn't save"],
          ["The app's look and fonts, after you've opened it once online", "Ask Noor"],
          ["The Offline page, which lists your saved surahs", "Hadith, Library, prayer times lookup, audio and tafsir"],
        ]}
      />
      <h2 id="save">Save a surah</h2>
      <ol className="list-decimal ps-6">
        <li>Open a surah while you&apos;re online.</li>
        <li>Tap <b>Save offline</b>.</li>
        <li>Open <b>More → Offline surahs</b> once while online, so the app is ready to work offline.</li>
      </ol>
      <p>When there&apos;s no internet and you open a saved surah, the app shows your saved copy and tells you so.</p>
      <Callout>
        <p>Full offline reading of the whole Qur&apos;an and Hadith isn&apos;t built yet. It&apos;s on my list.</p>
      </Callout>
    </>
  ),

  more: (
    <>
      <p>Everything else lives under <b>More</b>.</p>
      <DocTable
        head={["Tool", "What it does"]}
        rows={[
          ["Names of Allah", "The 99 names with their meanings."],
          ["Duas", "Duas from the Qur'an and Sunnah, with sources."],
          ["Azkaar", "Morning, evening and daily remembrance."],
          ["Zakat", "A calculator for your zakat."],
          ["Hifz", "A memorisation tracker and a Khatam planner."],
          ["Mosques", "Find mosques near you."],
          ["Quiz", "Test your Islamic knowledge."],
          ["Seerah", "A timeline of the Prophet's ﷺ life."],
        ]}
      />
      <p>Zakat figures are a calculation aid. If your situation is complicated, ask a qualified scholar.</p>
    </>
  ),

  security: (
    <>
      <p>You&apos;re in charge of your data. All of this is under <b>Profile</b>.</p>
      <h2 id="download">Download my data</h2>
      <p>Get a copy of everything I have about you: your account details, settings, bookmarks, notes and reading progress.</p>
      <h2 id="delete">Delete my account</h2>
      <p>This removes your account and all its data. It can&apos;t be undone, so download your data first if you want a copy.</p>
      <h2 id="signout">Sign out everywhere</h2>
      <p>Signs you out on every device, which is useful if you lost a phone or used a shared computer.</p>
      <h2 id="twostep">Two-step login</h2>
      <p>You can turn on two-step login with an authenticator app. After your password, you&apos;ll enter a code from the app.</p>
      <h2 id="passwords">Passwords</h2>
      <p>Your password goes straight to my login provider (Supabase). I can&apos;t see it. Use a password you don&apos;t use anywhere else.</p>
    </>
  ),

  privacy: (
    <>
      <p>
        I built Noor ul Ilm as a free app for learning from the Qur&apos;an and the Sunnah. I keep only what the app needs to work. There are no ads,
        and I don&apos;t sell anything about you.
      </p>
      <p className="text-sm text-muted">Last updated {UPDATED}</p>
      <h2 id="store">What I store</h2>
      <ul>
        <li>Your account: name, email, and a profile photo if you add one or sign in with Google. Passwords go straight to my login provider (Supabase). I can&apos;t see them.</li>
        <li>Your settings, bookmarks, notes, reading progress and the days you read.</li>
        <li>Any report you send me about wrong information.</li>
        <li>How many Ask Noor questions you asked today. It&apos;s just a number, so I can apply the daily limit.</li>
      </ul>
      <h2 id="others">Who else receives data</h2>
      <ul>
        <li><b>Supabase</b> keeps the data listed above.</li>
        <li><b>Google</b>, only if you tap &quot;Continue with Google&quot;. I get your name, email and photo.</li>
        <li><b>Ask Noor</b> sends your question and a few verses to an AI provider (Groq or Google Gemini) so it can write the answer. Please don&apos;t type private details into your questions.</li>
        <li><b>alquran.cloud, Quran.com, jsDelivr and Google Fonts</b> are contacted by your browser to load the Qur&apos;an text, audio, tafsir, hadith and fonts. They can see your IP address.</li>
        <li>Prayer times are worked out on your device. If you tap &quot;Use my location&quot;, it stays in your settings and goes nowhere else.</li>
      </ul>
      <h2 id="choices">What you can do</h2>
      <ul>
        <li>Download everything I have about you: Profile → Download my data.</li>
        <li>Delete your account and all its data: Profile → Delete account.</li>
        <li>Sign out of every device: Profile → Sign out everywhere.</li>
      </ul>
      <h2 id="children">Children</h2>
      <p>The app is for everyone. If you&apos;re a parent and want a child&apos;s account removed, use the delete option or write to me.</p>
      <h2 id="contact">Contact</h2>
      <p>
        {CONTACT ? (
          <>
            Questions or corrections? Write to me at <a className="text-brand underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </>
        ) : (
          <>
            Questions or corrections? Use the <A href="/contact">Contact page</A> in the app.
          </>
        )}
      </p>
      <p className="text-sm text-muted">If this policy changes, I&apos;ll update the date at the top.</p>
    </>
  ),

  terms: (
    <>
      <p>By using Noor ul Ilm you agree to these simple terms.</p>
      <p className="text-sm text-muted">Last updated {UPDATED}</p>
      <h2 id="purpose">What the app is for</h2>
      <p>
        It helps you read and learn from the Qur&apos;an and the Sunnah. It&apos;s a study aid, not a fatwa service. For religious rulings, please ask a
        qualified scholar.
      </p>
      <h2 id="accuracy">Accuracy</h2>
      <p>
        The Qur&apos;an text, translations, tafsir, hadith and audio come from third-party public sources. They can contain mistakes or be
        unavailable. If you spot a problem, use the <b>Report a problem</b> button and tell me.
      </p>
      <p>
        Prayer times are calculated and may differ slightly from your local mosque, so check your local timetable. Ask Noor is an AI and can make
        mistakes, so always read the verses shown with the answer.
      </p>
      <h2 id="library">Library</h2>
      <p>Books and papers in the Library are links to files on their original websites. I don&apos;t host them. Their copyright belongs to their owners.</p>
      <h2 id="account">Your account</h2>
      <p>Keep your password safe. Please don&apos;t use the app to harm others, attack it, or send spam in reports or notes.</p>
      <h2 id="warranty">No promises</h2>
      <p>The app is free and provided as it is. I can&apos;t promise it will always be available.</p>
    </>
  ),

  contact: (
    <>
      <p>I read every message. Here&apos;s the quickest way to reach me.</p>
      <DocTable
        head={["If you want to…", "Do this"]}
        rows={[
          ["Report wrong Qur'an, hadith or translation text", "Tap Report a problem next to the item."],
          ["Ask a question, suggest something or fix a typo", <>Open the <A key="c" href="/contact">Contact page</A> in the app (you need to be signed in).</>],
          ["Ask me to delete your data", "Profile → Delete account, or write to me."],
        ]}
      />
      {CONTACT && (
        <p>
          You can also email me at <a className="text-brand underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      )}
    </>
  ),
};