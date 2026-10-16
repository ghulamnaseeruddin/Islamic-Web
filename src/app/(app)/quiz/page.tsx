"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { QUIZ, type QuizQuestion } from "@/lib/data/quiz";

const COUNT = 10;
const KEY = "noor-quiz-best";

function pick(): QuizQuestion[] {
  const a = [...QUIZ];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, COUNT);
}

export default function QuizPage() {
  const { t, lang } = useI18n();
  const idx = lang === "ur" ? 1 : 0;
  const [qs, setQs] = useState<QuizQuestion[]>([]);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(0);

  useEffect(() => {
    setQs(pick());
    try {
      setBest(Number(localStorage.getItem(KEY)) || 0);
    } catch {
      /* ignore */
    }
  }, []);

  if (qs.length === 0) return null;
  const q = qs[i];

  function choose(n: number) {
    if (chosen !== null) return;
    setChosen(n);
    if (n === q.answer) setScore((s) => s + 1);
  }
  function next() {
    if (i + 1 >= qs.length) {
      const final = score;
      setDone(true);
      try {
        if (final > best) {
          localStorage.setItem(KEY, String(final));
          setBest(final);
        }
      } catch {
        /* ignore */
      }
      return;
    }
    setI(i + 1);
    setChosen(null);
  }
  function again() {
    setQs(pick());
    setI(0);
    setChosen(null);
    setScore(0);
    setDone(false);
  }

  if (done)
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold">{t("quiz.result")}</h1>
        <p className="mt-4 text-5xl font-semibold tabular-nums" dir="ltr">{score} / {qs.length}</p>
        <p className="mt-2 text-sm text-muted">{t("quiz.best", { n: best })}</p>
        <button className="btn btn-primary mt-6" onClick={again}>{t("quiz.again")}</button>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">{t("quiz.title")}</h1>
      <p className="mt-1 text-sm text-muted" dir="ltr">{i + 1} / {qs.length} · {t("quiz.best", { n: best })}</p>
      <div className="card mt-5">
        <p className="text-lg font-medium leading-8" dir="auto">{q.q[idx]}</p>
        <ul className="mt-4 space-y-2">
          {q.options.map((o, n) => {
            const state = chosen === null ? "" : n === q.answer ? "!border-brand bg-soft" : n === chosen ? "!border-danger" : "opacity-60";
            return (
              <li key={n}>
                <button type="button" onClick={() => choose(n)} className={`w-full rounded-xl border border-line px-4 py-3 text-start transition hover:bg-soft ${state}`} dir="auto">
                  {o[idx]}
                </button>
              </li>
            );
          })}
        </ul>
        {chosen !== null && (
          <div className="mt-4">
            <p className="text-sm font-medium">{chosen === q.answer ? t("quiz.correct") : t("quiz.wrong")}</p>
            <p className="mt-1 text-sm text-muted" dir="auto">{q.why[idx]}</p>
            <button className="btn btn-primary mt-4" onClick={next}>{i + 1 >= qs.length ? t("quiz.finish") : t("common.next")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
