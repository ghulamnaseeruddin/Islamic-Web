"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { ReportDialog } from "@/components/ItemActions";
import { useI18n } from "@/lib/i18n";
import { useBookmarks } from "@/lib/saved";
import { safeUrl, sectionTitle, type LibBook, type LibSection } from "@/lib/library";
import { supabaseBrowser } from "@/lib/supabase/client";

export function LibrarySection({ slug }: { slug: string }) {
  const { t, lang } = useI18n();
  const [section, setSection] = useState<LibSection | null>(null);
  const [parent, setParent] = useState<LibSection | null>(null);
  const [children, setChildren] = useState<LibSection[]>([]);
  const [books, setBooks] = useState<LibBook[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const { refs, toggle } = useBookmarks("book");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      const sb = supabaseBrowser();
      const { data: s, error } = await sb.from("library_sections").select("*").eq("slug", slug).maybeSingle();
      if (cancelled) return;
      if (error) return setState("error");
      if (!s) return setState("missing");
      const sec = s as LibSection;
      setSection(sec);
      const [kids, bks, par] = await Promise.all([
        sb.from("library_sections").select("*").eq("parent_id", sec.id).order("sort_order"),
        sb.from("library_books").select("*").eq("section_id", sec.id).order("sort_order"),
        sec.parent_id ? sb.from("library_sections").select("*").eq("id", sec.parent_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setChildren((kids.data as LibSection[]) ?? []);
      setBooks((bks.data as LibBook[]) ?? []);
      setParent((par.data as LibSection | null) ?? null);
      setState("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === "loading")
    return (
      <div className="mt-10 flex justify-center">
        <span className="spinner" />
      </div>
    );
  if (state === "missing" || state === "error" || !section)
    return (
      <div className="card text-center">
        <p className="text-sm">{state === "error" ? t("library.error") : t("library.missing")}</p>
        <Link href="/library" className="btn btn-ghost mt-3">
          {t("library.back")}
        </Link>
      </div>
    );

  const shown = books.filter((b) => b.title.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div>
      <p className="text-sm text-muted">
        <Link href="/library" className="hover:text-ink">{t("library.title")}</Link>
        {parent && (
          <>
            {" / "}
            <Link href={`/library/${parent.slug}`} className="hover:text-ink">{sectionTitle(parent, lang)}</Link>
          </>
        )}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        {sectionTitle(section, lang)}
        {section.is_hidden && <span className="chip ms-2 align-middle">{t("library.hidden")}</span>}
      </h1>
      {section.note && <p className="mt-2 text-sm text-muted">{section.note}</p>}

      {section.app_path && (
        <Link href={section.app_path} className="card mt-4 flex items-center justify-between hover:bg-soft">
          <span className="text-sm font-medium">{t("library.readInApp")}</span>
          <Icon name="chevronRight" className="h-4 w-4 text-muted rtl:rotate-180" />
        </Link>
      )}

      {children.length > 0 && (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {children.map((c) => (
            <li key={c.id}>
              <Link href={`/library/${c.slug}`} className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 hover:bg-soft">
                <span className="text-sm font-medium">
                  {sectionTitle(c, lang)}
                  {c.is_hidden && <span className="chip ms-2">{t("library.hidden")}</span>}
                </span>
                <Icon name="chevronRight" className="h-4 w-4 text-muted rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {books.length > 0 && (
        <>
          {books.length > 8 && (
            <input className="input mt-5" placeholder={t("library.filter")} value={filter} onChange={(e) => setFilter(e.target.value)} />
          )}
          <p className="mt-4 text-xs text-muted">{t("library.count", { n: shown.length })}</p>
          <ul className="mt-2 space-y-2">
            {shown.map((b) => {
              const isOpen = open === b.id;
              const files = Array.isArray(b.files) ? b.files : [];
              return (
                <li key={b.id} className="card !p-3 sm:!p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium" dir="auto">
                        {lang === "ur" && b.title_ur ? b.title_ur : b.title}
                        {b.is_hidden && <span className="chip ms-2">{t("library.hidden")}</span>}
                      </p>
                      {b.author && <p className="text-xs text-muted">{b.author}</p>}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button className="icon-btn" aria-label={t("common.bookmark")} onClick={() => toggle(b.id, b.title)}>
                        <Icon name="bookmark" className={`h-4 w-4 ${refs.has(b.id) ? "fill-current text-accent" : ""}`} />
                      </button>
                      <button className="icon-btn" aria-label={t("report.title")} onClick={() => setReportFor(b.id)}>
                        <Icon name="flag" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.app_path && (
                      <Link href={b.app_path} className="btn btn-primary !py-1.5 text-xs">
                        {t("library.readInApp")}
                      </Link>
                    )}
                    {files.length === 1 && (
                      <a href={safeUrl(files[0].url)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-1.5 text-xs">
                        {files[0].label} <Icon name="external" className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {files.length > 1 && (
                      <button className="btn btn-ghost !py-1.5 text-xs" onClick={() => setOpen(isOpen ? null : b.id)}>
                        {t("library.files", { n: files.length })}
                        <Icon name="chevronDown" className={`h-3.5 w-3.5 transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {isOpen && files.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                      {files.map((f, i) => (
                        <a key={i} href={safeUrl(f.url)} target="_blank" rel="noopener noreferrer" className="chip hover:bg-soft">
                          {f.label}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ReportDialog open={reportFor !== null} onClose={() => setReportFor(null)} itemType="book" itemRef={reportFor ?? ""} />
    </div>
  );
}
