"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { getSurah } from "@/lib/quran/surahs";
import { getHadithBook } from "@/lib/hadith/books";

type Verse = { ref: string; surahName: string; arabic: string; text: string; textUr?: string };
type HadithRef = {
  slug: string;
  book: string;
  number: number;
  sectionNo: number | null;
  section: string;
  grade: string;
  arabic: string;
  text: string;
  urdu?: string;
  sectionUr?: string;
};
type Msg = { role: "user" | "assistant"; content: string; verses?: Verse[]; hadiths?: HadithRef[]; error?: boolean };

export default function AskPage() {
  const { t, lang } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const examples = [t("ask.ex1"), t("ask.ex2"), t("ask.ex3")];

  async function send(text: string) {
    const question = text.trim();
    if (question.length < 3 || busy) return;
    const history = msgs.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setQ("");
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lang, history }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setMsgs((m) => [...m, { role: "assistant", content: t("ask.limit"), error: true }]);
      } else if (!res.ok) {
        setMsgs((m) => [...m, { role: "assistant", content: (j.error || t("common.error")) + (j.detail ? `\n\n[Admin only] ${j.detail}` : ""), error: true }]);
      } else if (j.offTopic) {
        setMsgs((m) => [...m, { role: "assistant", content: t("ask.offTopic"), error: true }]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", content: j.answer, verses: j.verses, hadiths: j.hadiths }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: t("common.error"), error: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("ask.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("ask.subtitle")}</p>

      {msgs.length === 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {examples.map((e) => (
            <button key={e} className="chip hover:bg-soft" onClick={() => send(e)}>{e}</button>
          ))}
        </div>
      )}

      <ul className="mt-5 space-y-4">
        {msgs.map((m, i) => (
          <li key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user" ? "max-w-[85%] rounded-2xl bg-brand px-4 py-2.5 text-sm text-brand-ink" : "card"}>
              <p className={`whitespace-pre-wrap text-sm leading-7 ${m.error ? "text-muted" : ""}`} dir="auto">{m.content}</p>
              {m.verses && m.verses.length > 0 && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("ask.refQuran")}</p>
                  <ul className="mt-2 space-y-3">
                    {m.verses.map((v) => (
                      <li key={v.ref}>
                        <Link href={`/quran/${v.ref.split(":")[0]}#a${v.ref.split(":")[1]}`} className="text-xs text-brand underline" dir="ltr">
                          {v.surahName} · {getSurah(Number(v.ref.split(":")[0]))?.ar} · {t("ask.surah")} {v.ref.split(":")[0]}, {t("ask.ayah")} {v.ref.split(":")[1]}
                        </Link>
                        <p className="font-arabic mt-1 text-xl leading-loose" dir="rtl" lang="ar">{v.arabic}</p>
                        {v.textUr && <p className="font-urdu text-sm leading-loose" dir="rtl" lang="ur">{v.textUr}</p>}
                        <p className="mt-1 text-xs text-muted" dir="ltr" lang="en">{v.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {m.hadiths && m.hadiths.length > 0 && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("ask.refHadith")}</p>
                  <ul className="mt-2 space-y-3">
                    {m.hadiths.map((h) => (
                      <li key={`${h.slug}:${h.number}`}>
                        <Link
                          href={h.sectionNo != null ? `/hadith/${h.slug}?s=${h.sectionNo}&h=${h.number}` : `/hadith/${h.slug}`}
                          className="text-xs text-brand underline"
                          dir="ltr"
                        >
                          {h.book} · {getHadithBook(h.slug)?.ar} · {t("ask.hadithNo")} {h.number}
                          {h.sectionNo != null ? ` · ${t("ask.chapter")} ${h.sectionNo}` : ""}
                        </Link>
                        {(h.section || h.sectionUr) && (
                          <p className="text-xs text-muted" dir="auto">
                            {h.section}
                            {h.section && h.sectionUr ? " · " : ""}
                            {h.sectionUr}
                          </p>
                        )}
                        {h.grade && <p className="text-xs text-muted" dir="ltr">{t("ask.grade")}: {h.grade}</p>}
                        {h.arabic && <p className="font-arabic mt-1 text-xl leading-loose" dir="rtl" lang="ar">{h.arabic}</p>}
                        {h.urdu && <p className="font-urdu text-sm leading-loose" dir="rtl" lang="ur">{h.urdu}</p>}
                        <p className="mt-1 text-xs text-muted" dir="ltr" lang="en">{h.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </li>
        ))}
        {busy && (
          <li className="flex justify-start"><span className="spinner" /></li>
        )}
      </ul>
      <div ref={endRef} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(q);
        }}
        className="sticky bottom-20 mt-6 flex gap-2 sm:bottom-4"
      >
        <input className="input shadow-sm" value={q} maxLength={500} onChange={(e) => setQ(e.target.value)} placeholder={t("ask.placeholder")} />
        <button className="btn btn-primary" disabled={busy || q.trim().length < 3} aria-label={t("ask.send")}>
          <Icon name="sparkle" className="h-4 w-4" />
          <span className="hidden sm:inline">{t("ask.send")}</span>
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-muted">{t("ask.disclaimer")}</p>
    </div>
  );
}