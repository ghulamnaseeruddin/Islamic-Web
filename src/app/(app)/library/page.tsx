"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { sectionTitle, type LibSection } from "@/lib/library";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LibraryPage() {
  const { t, lang } = useI18n();
  const [sections, setSections] = useState<LibSection[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ id: string; title: string; slug: string; section: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabaseBrowser()
        .from("library_sections")
        .select("*")
        .order("sort_order");
      if (error) setError(true);
      else setSections((data as LibSection[]) ?? []);
    })();
  }, []);

  // Search book titles
  useEffect(() => {
    const s = q.trim();
    if (s.length < 2) {
      setHits([]);
      return;
    }
    const id = setTimeout(async () => {
      const clean = s.replace(/[%,()]/g, " ");
      const { data } = await supabaseBrowser()
        .from("library_books")
        .select("id, title, section_id")
        .ilike("title", `%${clean}%`)
        .limit(30);
      const secs = new Map((sections ?? []).map((x) => [x.id, x]));
      setHits(
        (data ?? []).map((b: { id: string; title: string; section_id: string }) => ({
          id: b.id,
          title: b.title,
          slug: secs.get(b.section_id)?.slug ?? "",
          section: secs.get(b.section_id) ? sectionTitle(secs.get(b.section_id)!, lang) : "",
        })),
      );
    }, 300);
    return () => clearTimeout(id);
  }, [q, sections, lang]);

  const tops = (sections ?? []).filter((s) => !s.parent_id);
  const kids = (id: string) => (sections ?? []).filter((s) => s.parent_id === id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("library.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("library.subtitle")}</p>

      <div className="relative mt-5">
        <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input ps-9" placeholder={t("library.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {hits.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface">
          {hits.map((h) => (
            <li key={h.id}>
              <Link href={`/library/${h.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-soft">
                <span dir="ltr" className="min-w-0 truncate">{h.title}</span>
                <span className="shrink-0 text-xs text-muted">{h.section}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="card mt-6 text-sm">{t("library.error")}</p>}
      {!sections && !error && (
        <div className="mt-10 flex justify-center">
          <span className="spinner" />
        </div>
      )}
      {sections && sections.length === 0 && <p className="card mt-6 text-sm">{t("library.empty")}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tops.map((s) => (
          <section key={s.id} className="card">
            <Link href={`/library/${s.slug}`} className="flex items-center justify-between">
              <h2 className="font-semibold">
                {sectionTitle(s, lang)}
                {s.is_hidden && <span className="chip ms-2">{t("library.hidden")}</span>}
              </h2>
              <Icon name="chevronRight" className="h-4 w-4 text-muted rtl:rotate-180" />
            </Link>
            <ul className="mt-3 space-y-1">
              {kids(s.id).map((k) => (
                <li key={k.id}>
                  <Link href={`/library/${k.slug}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-soft hover:text-ink">
                    <span>
                      {sectionTitle(k, lang)}
                      {k.is_hidden && <span className="chip ms-2">{t("library.hidden")}</span>}
                    </span>
                  </Link>
                </li>
              ))}
              {kids(s.id).length === 0 && (
                <li className="px-2 py-1.5 text-sm text-muted">{t("library.openSection")}</li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
