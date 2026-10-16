"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";
import { NoteDialog, ReportDialog } from "@/components/ItemActions";
import { useI18n } from "@/lib/i18n";
import { useBookmarks } from "@/lib/saved";
import { useSettings } from "@/lib/settings";
import { fetchHadith, fetchSection, getHadithBook, type HadithItem } from "@/lib/hadith/books";

type Row = { n: number; ara?: HadithItem; urd?: HadithItem; eng?: HadithItem };

export function HadithReader({ slug }: { slug: string }) {
  const book = getHadithBook(slug)!;
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const router = useRouter();
  const params = useSearchParams();
  const section = Math.max(1, Number(params.get("s")) || 1);
  const focus = Number(params.get("h")) || 0;

  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [missing, setMissing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [jump, setJump] = useState("");
  const [jumpError, setJumpError] = useState(false);
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [reportFor, setReportFor] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const { refs, toggle } = useBookmarks("hadith", `${slug}:`);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setMissing(false);
    (async () => {
      try {
        const [a, u, e] = await Promise.allSettled([
          fetchSection("ara", book.key, section),
          fetchSection("urd", book.key, section),
          fetchSection("eng", book.key, section),
        ]);
        if (cancelled) return;
        const val = (r: PromiseSettledResult<Awaited<ReturnType<typeof fetchSection>>>) =>
          r.status === "fulfilled" ? r.value : undefined;
        const A = val(a), U = val(u), E = val(e);
        if (A === null && U === null && E === null) {
          setMissing(true);
          setRows([]);
          setHasNext(false);
        } else if (!A && !U && !E) {
          setError(true);
        } else {
          const map = new Map<number, Row>();
          const add = (items: HadithItem[] | undefined, key: "ara" | "urd" | "eng") =>
            items?.forEach((h) => {
              const r = map.get(h.hadithnumber) ?? { n: h.hadithnumber };
              r[key] = h;
              map.set(h.hadithnumber, r);
            });
          add(A?.hadiths, "ara");
          add(U?.hadiths, "urd");
          add(E?.hadiths, "eng");
          setRows([...map.values()].sort((x, y) => x.n - y.n));
          setName((lang === "ur" ? U?.name : E?.name) || E?.name || U?.name || A?.name || "");
          setHasNext(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, section, attempt]);

  useEffect(() => {
    if (!loading && focus) {
      document.getElementById(`h${focus}`)?.scrollIntoView({ block: "start" });
    } else if (!loading) {
      window.scrollTo({ top: 0 });
    }
  }, [loading, focus, section]);

  const go = (s: number) => router.push(`/hadith/${slug}?s=${s}`);

  async function doJump(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(jump);
    if (!Number.isInteger(n) || n < 1) return;
    setJumpError(false);
    const h = await fetchHadith("ara", book.key, n);
    const sec = h?.reference?.book;
    if (!sec) {
      setJumpError(true);
      return;
    }
    router.push(`/hadith/${slug}?s=${sec}&h=${n}`);
  }

  async function copy(r: Row) {
    const parts = [
      r.ara?.text,
      lang === "ur" ? r.urd?.text : r.eng?.text,
      `${lang === "ur" ? book.ar : book.name} #${r.n}`,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(parts.join("\n\n"));
      setCopied(r.n);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  const gradeOf = (r: Row) => {
    const g = (r.eng?.grades ?? r.ara?.grades ?? r.urd?.grades ?? []).filter((x) => x.grade);
    return g;
  };

  return (
    <div>
      <Link href="/hadith" className="text-sm text-muted hover:text-ink">
        ← {t("hadith.title")}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{lang === "ur" ? book.ar : book.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("hadith.section")} {section}
        {name ? ` · ${name}` : ""}
      </p>

      <form onSubmit={doJump} className="mt-4 flex gap-2">
        <input
          className="input max-w-[12rem]"
          inputMode="numeric"
          placeholder={t("hadith.jump")}
          value={jump}
          onChange={(e) => setJump(e.target.value.replace(/\D/g, ""))}
        />
        <button className="btn btn-ghost" type="submit">
          {t("hadith.go")}
        </button>
        {jumpError && <span className="self-center text-sm text-danger">{t("hadith.notFound")}</span>}
      </form>

      {loading && (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      )}
      {error && !loading && (
        <div className="card mt-6 text-center">
          <p className="text-sm">{t("hadith.loadError")}</p>
          <button className="btn btn-ghost mt-3" onClick={() => setAttempt((a) => a + 1)}>
            {t("common.retry")}
          </button>
        </div>
      )}
      {missing && !loading && (
        <div className="card mt-6 text-center">
          <p className="text-sm">{t("hadith.noSection")}</p>
          <button className="btn btn-ghost mt-3" onClick={() => go(1)}>
            {t("hadith.firstSection")}
          </button>
        </div>
      )}

      {!loading && !error && (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => {
            const ref = `${slug}:${section}:${r.n}`;
            const saved = refs.has(ref);
            const grades = gradeOf(r);
            return (
              <li key={r.n} id={`h${r.n}`} className="card scroll-mt-20">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span dir="ltr">
                    #{r.n}
                  </span>
                  <span className="flex items-center gap-1">
                    <button className="icon-btn" aria-label={t("common.bookmark")} onClick={() => toggle(ref, `${book.name} #${r.n}`)}>
                      <Icon name="bookmark" className={`h-4 w-4 ${saved ? "fill-current text-accent" : ""}`} />
                    </button>
                    <button className="icon-btn" aria-label={t("note.title")} onClick={() => setNoteFor(r.n)}>
                      <Icon name="note" className="h-4 w-4" />
                    </button>
                    <button className="icon-btn" aria-label={t("common.copy")} onClick={() => copy(r)}>
                      <Icon name={copied === r.n ? "check" : "copy"} className="h-4 w-4" />
                    </button>
                    <button className="icon-btn" aria-label={t("report.title")} onClick={() => setReportFor(r.n)}>
                      <Icon name="flag" className="h-4 w-4" />
                    </button>
                  </span>
                </div>

                {r.ara && (
                  <p
                    className="font-arabic mt-3 leading-[2.1]"
                    dir="rtl"
                    lang="ar"
                    style={{ fontSize: Math.max(20, settings.arabicFontSize - 8) }}
                  >
                    {r.ara.text}
                  </p>
                )}
                {r.urd && (
                  <p
                    className="font-urdu mt-3 leading-[2.2]"
                    dir="rtl"
                    lang="ur"
                    style={{ fontSize: settings.urduFontSize - 2 }}
                  >
                    {r.urd.text}
                  </p>
                )}
                {r.eng && (
                  <p className="mt-3 text-[15px] leading-7" dir="ltr" lang="en">
                    {r.eng.text}
                  </p>
                )}

                {grades.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5" dir="ltr">
                    {grades.map((g, i) => (
                      <span key={i} className="chip">
                        {g.name}: {g.grade}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !missing && (
        <div className="mt-8 flex items-center justify-between">
          <button className="btn btn-ghost" disabled={section <= 1} onClick={() => go(section - 1)}>
            {t("common.previous")}
          </button>
          <span className="text-sm text-muted">{section}</span>
          <button className="btn btn-ghost" disabled={!hasNext} onClick={() => go(section + 1)}>
            {t("common.next")}
          </button>
        </div>
      )}

      <NoteDialog
        open={noteFor !== null}
        onClose={() => setNoteFor(null)}
        kind="hadith"
        itemRef={`${slug}:${section}:${noteFor ?? 0}`}
        title={`${book.name} #${noteFor ?? ""}`}
      />
      <ReportDialog
        open={reportFor !== null}
        onClose={() => setReportFor(null)}
        itemType="hadith"
        itemRef={`${slug}:${section}:${reportFor ?? 0}`}
      />
    </div>
  );
}
