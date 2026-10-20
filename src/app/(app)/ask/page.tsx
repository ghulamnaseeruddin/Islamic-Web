"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { dictionary, type Lang, type TKey } from "@/lib/dictionary";
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
// Text in the language of the QUESTION (not only the app language)
function tl(l: Lang, key: TKey): string {
  return dictionary[l][key] ?? dictionary.en[key] ?? key;
}

// English and Urdu together
function both(key: TKey): string {
  return `${tl("en", key)}\n${tl("ur", key)}`;
}
function Both({ k }: { k: TKey }) {
  return (
    <>
      <span>{tl("en", k)}</span>
      <span className="mx-1.5 opacity-50">·</span>
      <span dir="rtl" lang="ur" className="font-urdu">{tl("ur", k)}</span>
    </>
  );
}

type Hist = { role: "user" | "assistant"; content: string };
type Confirm = {
  question: string;
  understanding: string;
  en: string; // restatement in English
  ur: string; // restatement in Urdu
  englishQuery: string;
  history: Hist[];
  rl: Lang; // language of the question: the card, buttons and replies use it
  state: "pending" | "yes" | "no" | "dismissed";
};
type Msg = {
  role: "user" | "assistant";
  content: string;
  verses?: Verse[];
  hadiths?: HadithRef[];
  error?: boolean;
  confirm?: Confirm; // "Is this what you are asking?" card
  meta?: boolean; // the Yes / No bubbles; not sent to the AI as history
};

function historyOf(list: Msg[]): Hist[] {
  return list
    .filter((m) => !m.error && !m.confirm && !m.meta)
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-6);
}

export default function AskPage() {
  const { t, lang } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [micMsg, setMicMsg] = useState("");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const examples = [t("ask.ex1"), t("ask.ex2"), t("ask.ex3")];

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setMicMsg(t("ask.micUnsupported"));
      return;
    }
    const rec = new SR();
    rec.lang = lang === "ur" ? "ur-PK" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    const base = q.trim();
    rec.onstart = () => {
      setListening(true);
      setMicMsg(t("ask.micListening"));
    };
    rec.onresult = (ev: any) => {
      let text = "";
      for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
      setQ((base ? base + " " : "") + text);
    };
    rec.onerror = (ev: any) => {
      const denied = ev.error === "not-allowed" || ev.error === "service-not-allowed";
      setMicMsg(denied ? t("ask.micDenied") : ev.error === "aborted" ? "" : t("ask.micError"));
    };
    rec.onend = () => {
      setListening(false);
      setMicMsg((m) => (m === t("ask.micListening") ? "" : m));
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setMicMsg(t("ask.micError"));
    }
  }

  useEffect(() => () => recRef.current?.abort?.(), []);

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    return { res, j };
  }

  function addError(res: Response, j: any, rl: Lang = lang) {
    if (res.status === 429) {
      setMsgs((m) => [...m, { role: "assistant", content: tl(rl, "ask.limit"), error: true }]);
    } else {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: (j.error || t("common.error")) + (j.detail ? `\n\n[Admin only] ${j.detail}` : ""), error: true },
      ]);
    }
  }

  // STEP 1: the user asks. The AI restates the question and asks "Is this what you are asking?"
  async function send(text: string) {
    const question = text.trim();
    if (question.length < 3 || busy) return;
    const history = historyOf(msgs);
    setMsgs((m) => [
      ...m.map((x) => (x.confirm?.state === "pending" ? { ...x, confirm: { ...x.confirm, state: "dismissed" as const } } : x)),
      { role: "user", content: question },
    ]);
    recRef.current?.stop?.();
    setQ("");
    setBusy(true);
    try {
      const { res, j } = await post({ mode: "understand", question, lang, history });
      if (!res.ok) {
        addError(res, j);
      } else if (j.offTopic) {
        setMsgs((m) => [...m, { role: "assistant", content: tl(j.replyLang === "ur" ? "ur" : j.replyLang === "en" ? "en" : lang, "ask.offTopic"), error: true }]);
      } else if (j.clarify) {
        setMsgs((m) => [...m, { role: "assistant", content: j.clarify }]);
      } else if (j.understanding) {
        setMsgs((m) => [
          ...m,
          {
            role: "assistant",
            content: j.understanding,
            confirm: {
              question,
              understanding: j.understanding,
              en: j.understandingEn || j.understanding,
              ur: j.understandingUr || j.understanding,
              englishQuery: j.englishQuery || question,
              history,
              rl: j.replyLang === "ur" ? "ur" : j.replyLang === "en" ? "en" : lang,
              state: "pending",
            },
          },
        ]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", content: t("common.error"), error: true }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: t("common.error"), error: true }]);
    } finally {
      setBusy(false);
    }
  }

  // STEP 2: the user says "Yes, that is exactly it". Now the AI answers with references.
  async function confirmYes(i: number, c: Confirm) {
    if (busy) return;
    setMsgs((m) => [
      ...m.map((x, idx) => (idx === i && x.confirm ? { ...x, confirm: { ...x.confirm, state: "yes" as const } } : x)),
      { role: "user", content: both("ask.confirmYesMsg"), meta: true },
    ]);
    setBusy(true);
    try {
      const { res, j } = await post({
        mode: "answer",
        question: c.question,
        understanding: c.understanding,
        englishQuery: c.englishQuery,
        lang: c.rl,
        history: c.history,
      });
      if (!res.ok) {
        addError(res, j, c.rl);
      } else if (j.offTopic) {
        setMsgs((m) => [...m, { role: "assistant", content: tl(c.rl, "ask.offTopic"), error: true }]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", content: j.answer, verses: j.verses, hadiths: j.hadiths }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: t("common.error"), error: true }]);
    } finally {
      setBusy(false);
    }
  }

  // The user says "No, that is not what I meant". Ask them to explain.
  function confirmNo(i: number, rl: Lang) {
    if (busy) return;
    setMsgs((m) => [
      ...m.map((x, idx) => (idx === i && x.confirm ? { ...x, confirm: { ...x.confirm, state: "no" as const } } : x)),
      { role: "user", content: both("ask.confirmNoMsg"), meta: true },
      { role: "assistant", content: both("ask.confirmNoReply"), meta: true },
    ]);
    setTimeout(() => inputRef.current?.focus(), 50);
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
              {m.confirm && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted"><Both k="ask.confirmTitle" /></p>
              )}
              {m.confirm ? (
                <div className="space-y-1">
                  <p className="text-sm leading-7" dir="ltr" lang="en">{m.confirm.en}</p>
                  <p className="font-urdu text-sm leading-loose" dir="rtl" lang="ur">{m.confirm.ur}</p>
                </div>
              ) : m.meta ? (
                <div className="space-y-1">
                  {m.content.split("\n").map((line, k) => (
                    <p key={k} className="text-sm leading-7" dir="auto">{line}</p>
                  ))}
                </div>
              ) : (
                <p className={`whitespace-pre-wrap text-sm leading-7 ${m.error ? "text-muted" : ""}`} dir="auto">{m.content}</p>
              )}
              {m.confirm && m.confirm.state === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2" dir="ltr">
                  <button className="btn btn-primary" disabled={busy} onClick={() => confirmYes(i, m.confirm!)}>
                    <Both k="ask.confirmYes" />
                  </button>
                  <button className="btn" disabled={busy} onClick={() => confirmNo(i, m.confirm!.rl)}>
                    <Both k="ask.confirmNo" />
                  </button>
                </div>
              )}
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
        <input
          ref={inputRef}
          className="input shadow-sm"
          value={q}
          maxLength={500}
          dir="auto"
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("ask.placeholder")}
        />
        <button
          type="button"
          onClick={toggleMic}
          className={`btn ${listening ? "btn-primary animate-pulse" : ""}`}
          aria-label={listening ? t("ask.micStop") : t("ask.mic")}
          title={listening ? t("ask.micStop") : t("ask.mic")}
        >
          <Icon name={listening ? "stop" : "mic"} className="h-4 w-4" />
        </button>
        <button className="btn btn-primary" disabled={busy || q.trim().length < 3} aria-label={t("ask.send")}>
          <Icon name="sparkle" className="h-4 w-4" />
          <span className="hidden sm:inline">{t("ask.send")}</span>
        </button>
      </form>
      {micMsg && <p className="mt-2 text-center text-xs text-muted" role="status">{micMsg}</p>}
      <p className="mt-3 text-center text-xs text-muted">{t("ask.anyLang")}</p>
      <p className="mt-1 text-center text-xs text-muted">{t("ask.disclaimer")}</p>
    </div>
  );
}