import { CONTACT, LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Noor ul Ilm is a free app for learning from the Qur&apos;an and the Sunnah. We keep only what the app needs to work. We do not show ads and we do not sell data.</p>

      <h2>What we store</h2>
      <ul>
        <li>Your account: name, email, and a profile photo if you add one or sign in with Google. Passwords are handled by our login provider (Supabase) and are never visible to us.</li>
        <li>Your settings, bookmarks, notes, reading progress and reading days.</li>
        <li>Reports you send about wrong information.</li>
        <li>How many Ask Noor questions you asked today (a number only, to apply the daily limit).</li>
      </ul>

      <h2>Services that receive data</h2>
      <ul>
        <li><b>Supabase</b> stores the data above.</li>
        <li><b>Google</b> if you choose &quot;Continue with Google&quot;. We receive your name, email and photo.</li>
        <li><b>Ask Noor</b> sends your question and a few Qur&apos;an verses to an AI provider (Groq or Google Gemini) to write the answer. Do not type private information in questions.</li>
        <li><b>alquran.cloud, Quran.com, jsDelivr and Google Fonts</b> are contacted by your browser to load Qur&apos;an text, audio, tafsir, hadith and fonts. They may see your IP address.</li>
        <li>Prayer times are calculated on your device. If you press &quot;Use my location&quot;, the location stays in your settings and is not sent anywhere else.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>Download all your data: Profile → Download my data.</li>
        <li>Delete your account and all data: Profile → Delete account.</li>
        <li>Sign out on every device: Profile → Sign out everywhere.</li>
      </ul>

      <h2>Children</h2>
      <p>The app is meant for general use. If you are a parent and want an account removed, use the delete option or contact us.</p>

      <h2>Contact</h2>
      <p>{CONTACT ? <>Write to <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</> : "Contact the site owner using the details on the website where you found this app."}</p>
      <p className="text-xs text-muted">This policy may change. The date of the latest change is the date of the latest deployment of this site.</p>
    </LegalPage>
  );
}
