"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { searchQuran, type SearchMatch } from "@/lib/quran/api";
import { translationName } from "@/lib/quran/editions";
import { supabaseBrowser } from "@/lib/supabase/client";

const EDITIONS = ["ur.jalandhry", "en.sahih", "quran-simple-clean"];

type Group = { edition: string; matches: SearchMatch[] };

function SearchInner() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [groups, setGroups] = useState<Group[]>([]);
  const [books, setBooks] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function run(term: string) {
    const s = term.trim();
    if (s.length < 2) return;
    setBusy(true);
    setDone(false);
    const clean = s.replace(/[%,()]/g, " ");
    const [res, bk] = await Promise.all([
      Promise.all(EDITIONS.map(async (e) => ({ edition: e, matches: (await searchQuran(s, e)).slice(0, 20) }))),
      supabaseBrowser()
        .from("library_books")
        .select("id, title, library_sections(slug)")
        .ilike("title", `%${clean}%`)
        .limit(15),
    ]);
    setGroups(res.filter((g) => g.matches.length));
    setBooks(
      ((bk.data as unknown as { id: string; title: string; library_sections: { slug: string } | { slug: string }[] | null }[]) ?? []).map((b) => ({
        id: b.id,
        title: b.title,
        slug: (Array.isArray(b.library_sections) ? b.library_sections[0]?.slug : b.library_sections?.slug) ?? "",
      })),
    );
    setBusy(false);
    setDone(true);
  }

  useEffect(() => {
    if (initial) run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(q.trim())}`);
    run(q);
  }

  const label = (e: string) => (e === "quran-simple-clean" ? t("search.arabic") : translationName(e, lang));
  const empty = done && groups.length === 0 && books.length === 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("search.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("search.subtitle")}</p>
      <form onSubmit={submit} className="relative mt-5">
        <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input ps-9" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} />
      </form>

      {busy && <div className="mt-8 flex justify-center"><span className="spinner" /></div>}
      {empty && <p className="mt-8 text-center text-sm text-muted">{t("common.noResults")}</p>}

      {!busy && books.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted">{t("nav.library")}</h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={`/library/${b.slug}`} className="block px-4 py-3 text-sm hover:bg-soft" dir="auto">{b.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!busy &&
        groups.map((g) => (
          <section key={g.edition} className="mt-6">
            <h2 className="text-sm font-semibold text-muted">{t("nav.quran")} · {label(g.edition)}</h2>
            <ul className="mt-2 space-y-2">
              {g.matches.map((m) => (
                <li key={`${m.surah}:${m.ayah}`}>
                  <Link href={`/quran/${m.surah}#a${m.ayah}`} className="card block hover:bg-soft">
                    <span className="text-xs text-muted" dir="ltr">{m.surahName} {m.surah}:{m.ayah}</span>
                    <p
                      className={`mt-1 ${g.edition.startsWith("ur") ? "font-urdu leading-[2.2]" : g.edition.startsWith("quran") ? "font-arabic text-xl leading-loose" : "text-sm leading-7"}`}
                      dir={g.edition.startsWith("en") ? "ltr" : "rtl"}
                    >
                      {m.text}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
