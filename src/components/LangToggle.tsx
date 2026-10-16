"use client";

import { useI18n } from "@/lib/i18n";

/** Small EN | اردو switch used on the login pages. (Inside the app, use Settings.) */
export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-0.5 text-xs" dir="ltr">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-full px-3 py-1 ${lang === "en" ? "bg-brand text-brand-ink" : "text-muted"}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ur")}
        className={`rounded-full px-3 py-1 ${lang === "ur" ? "bg-brand text-brand-ink" : "text-muted"}`}
      >
        اردو
      </button>
    </div>
  );
}
