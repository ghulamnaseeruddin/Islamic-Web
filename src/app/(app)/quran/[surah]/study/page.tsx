"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getSurah } from "@/lib/quran/surahs";
import { fetchTajweed, fetchWordByWord, type WordVerse } from "@/lib/quran/words";
import { parseTajweed, TAJWEED_RULES, tajweedColor } from "@/lib/tajweed";

export default function StudyPage() {
  const { t, lang } = useI18n();
  const n = Number(useParams<{ surah: string }>().surah);
  const meta = getSurah(n);
  const [mode, setMode] = useState<"words" | "tajweed">("words");
  const [wl, setWl] = useState<"ur" | "en">(lang === "ur" ? "ur" : "en");
  const [words, setWords] = useState<WordVerse[] | null>(null);
  const [taj, setTaj] = useState<{ ayah: number; html: string }[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!meta) return;
    setError(false);
    if (mode === "words") {
      setWords(null);
      fetchWordByWord(n, wl).then(setWords).catch(() => setError(true));
    } else if (!taj) fetchTajweed(n).then(setTaj).catch(() => setError(true));
  }, [n, mode, wl, meta, taj]);

  if (!meta) return <p>Not found</p>;
  return (
    <div>
      <Link href={`/quran/${n}`} className="text-sm text-muted hover:underline">← {meta.en}</Link>
      <h1 className="mt-1 text-2xl font-semibold" dir="ltr">{n}. {meta.en}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="chip" data-active={mode === "words"} onClick={() => setMode("words")}>{t("study.words")}</button>
        <button className="chip" data-active={mode === "tajweed"} onClick={() => setMode("tajweed")}>{t("study.tajweed")}</button>
        {mode === "words" && (
          <>
            <button className="chip" data-active={wl === "ur"} onClick={() => setWl("ur")}>اردو</button>
            <button className="chip" data-active={wl === "en"} onClick={() => setWl("en")}>English</button>
          </>
        )}
      </div>

      {error && <div className="card mt-4 text-sm text-muted">{t("study.error")}</div>}
      {!error && ((mode === "words" && !words) || (mode === "tajweed" && !taj)) && (
        <div className="mt-6 flex justify-center"><span className="spinner" /></div>
      )}

      {mode === "tajweed" && taj && (
        <>
          <details className="card mt-4" open>
            <summary className="cursor-pointer text-sm font-medium">{t("study.legend")}</summary>
            <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {TAJWEED_RULES.map((r) => (
                <li key={r.cls} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: r.color }} />
                  {lang === "ur" ? r.ur : r.en}
                </li>
              ))}
            </ul>
          </details>
          <ol className="mt-4 space-y-3">
            {taj.map((v) => (
              <li key={v.ayah} className="card" id={`a${v.ayah}`}>
                <p dir="rtl" lang="ar" className="font-arabic text-right" style={{ fontSize: 30, lineHeight: 2.2 }}>
                  {parseTajweed(v.html).map((p, i) => (
                    <span key={i} style={p.cls ? { color: tajweedColor(p.cls) } : undefined}>{p.text}</span>
                  ))}{" "}
                  <span className="text-accent text-base">﴿{v.ayah}﴾</span>
                </p>
              </li>
            ))}
          </ol>
        </>
      )}

      {mode === "words" && words && (
        <ol className="mt-4 space-y-3">
          {words.map((v) => (
            <li key={v.ayah} className="card" id={`a${v.ayah}`}>
              <p className="mb-2 text-xs text-muted" dir="ltr">{n}:{v.ayah}</p>
              <div className="flex flex-row-reverse flex-wrap gap-x-4 gap-y-3" dir="rtl">
                {v.words.map((w) => (
                  <div key={w.pos} className="min-w-[3rem] text-center">
                    <div className="font-arabic text-2xl" lang="ar">{w.ar}</div>
                    <div className={`mt-1 text-xs text-muted ${wl === "ur" ? "font-urdu" : ""}`} dir={wl === "ur" ? "rtl" : "ltr"}>{w.meaning}</div>
                    {w.translit && <div className="text-[10px] text-muted/70" dir="ltr">{w.translit}</div>}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
