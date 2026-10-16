import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>By using Noor ul Ilm you agree to these simple terms.</p>

      <h2>Purpose</h2>
      <p>The app helps you read and learn from the Qur&apos;an and the Sunnah. It is a study aid. It is not a fatwa service. For religious rulings, ask a qualified scholar.</p>

      <h2>Accuracy</h2>
      <p>Qur&apos;an text, translations, tafsir, hadith and audio come from third-party public sources and may contain mistakes or be unavailable. Use the &quot;Report a problem&quot; button to tell us. Prayer times are calculated and may differ slightly from your local mosque; check local timetables. Ask Noor is AI and can make mistakes, so always read the verses shown with the answer.</p>

      <h2>Library</h2>
      <p>Books and papers in the Library are links to files on their original websites. We do not host them. Their copyright belongs to their owners.</p>

      <h2>Your account</h2>
      <p>Keep your password safe. Do not use the app to harm others, to attack the app, or to send spam in reports or notes.</p>

      <h2>No warranty</h2>
      <p>The app is provided as is, free of charge, without any promise that it will always be available.</p>
    </LegalPage>
  );
}
