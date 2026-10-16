"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { HADITH_BOOKS, loadEdition, searchItems, type HadithItem, type HadithLang } from "@/lib/hadith/books";

export default function HadithSearchPage() {
  const { t, lang } = useI18n();
  const [slug, setSlug] = useState(HADITH_BOOKS[0].slug);
  const [hl, setHl] = useState<HadithLang>(lang === "ur" ? "urd" : "eng");
  const [q, setQ] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [res, setRes] = useState<{ total: number; results: HadithItem[] }>({ total: 0, results: [] });
  const book = HADITH_BOOKS.find((b) => b.slug === slug)!;

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setState("loading");
    try {
      const items = await loadEdition(hl, book.key);
      setRes(searchItems(items, q));
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <Link href="/hadith" className="text-sm text-muted hover:text-ink">← {t("hadith.title")}</Link>
      <h1 className="mt-2 text-2xl font-semibold">{t("hadith.searchTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("hadith.searchHint")}</p>

      <form onSubmit={run} className="mt-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {HADITH_BOOKS.map((b) => (
              <option key={b.slug} value={b.slug}>{lang === "ur" ? b.ar : b.name}</option>
            ))}
          </select>
          <select className="input" value={hl} onChange={(e) => setHl(e.target.value as HadithLang)}>
            <option value="urd">اردو</option>
            <option value="eng">English</option>
            <option value="ara">العربية</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} dir="auto" autoFocus />
          <button className="btn btn-primary" disabled={state === "loading"}>{t("hadith.searchBtn")}</button>
        </div>
      </form>

      {state === "loading" && (
        <div className="mt-8 text-center">
          <span className="spinner" />
          <p className="mt-2 text-xs text-muted">{t("hadith.loadingBook")}</p>
        </div>
      )}
      {state === "error" && <p className="card mt-6 text-sm">{t("hadith.loadError")}</p>}
      {state === "done" && (
        <>
          <p className="mt-6 text-sm text-muted">{t("hadith.found", { n: res.total })}</p>
          <ul className="mt-3 space-y-3">
            {res.results.map((h) => (
              <li key={h.hadithnumber}>
                <Link
                  href={`/hadith/${slug}?s=${h.reference?.book ?? 1}&h=${h.hadithnumber}`}
                  className="card block hover:bg-soft"
                >
                  <span className="text-xs text-muted" dir="ltr">{book.name} #{h.hadithnumber}</span>
                  <p
                    className={`mt-1 line-clamp-5 ${hl === "ara" ? "font-arabic text-lg leading-loose" : hl === "urd" ? "font-urdu leading-[2.1]" : "text-sm leading-7"}`}
                    dir={hl === "eng" ? "ltr" : "rtl"}
                  >
                    {h.text}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
