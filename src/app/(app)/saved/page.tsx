"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

type Bm = { id: string; kind: "quran" | "hadith" | "book"; ref: string; title: string | null; created_at: string };
type Note = { id: string; kind: "quran" | "hadith" | "book"; ref: string; title: string | null; body: string; created_at: string };

function hrefFor(kind: string, ref: string, bookSlugs: Record<string, string>) {
  if (kind === "quran") {
    const [s, a] = ref.split(":");
    return `/quran/${s}#a${a}`;
  }
  if (kind === "hadith") {
    const [slug, sec, n] = ref.split(":");
    return `/hadith/${slug}?s=${sec}&h=${n}`;
  }
  return bookSlugs[ref] ? `/library/${bookSlugs[ref]}` : "/library";
}

export default function SavedPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"bookmarks" | "notes">("bookmarks");
  const [bms, setBms] = useState<Bm[] | null>(null);
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [slugs, setSlugs] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const [b, n] = await Promise.all([
        sb.from("bookmarks").select("*").order("created_at", { ascending: false }),
        sb.from("notes").select("*").order("created_at", { ascending: false }),
      ]);
      const bl = (b.data as Bm[]) ?? [];
      setBms(bl);
      setNotes((n.data as Note[]) ?? []);
      const ids = bl.filter((x) => x.kind === "book").map((x) => x.ref);
      if (ids.length) {
        const { data } = await sb.from("library_books").select("id, library_sections(slug)").in("id", ids);
        const m: Record<string, string> = {};
        ((data as unknown as { id: string; library_sections: { slug: string } | { slug: string }[] | null }[]) ?? []).forEach((r) => {
          const s = Array.isArray(r.library_sections) ? r.library_sections[0] : r.library_sections;
          if (s) m[r.id] = s.slug;
        });
        setSlugs(m);
      }
    })();
  }, []);

  async function removeBm(id: string) {
    setBms((l) => (l ?? []).filter((x) => x.id !== id));
    await supabaseBrowser().from("bookmarks").delete().eq("id", id);
  }
  async function removeNote(id: string) {
    setNotes((l) => (l ?? []).filter((x) => x.id !== id));
    await supabaseBrowser().from("notes").delete().eq("id", id);
  }

  const kindLabel = (k: string) => (k === "quran" ? t("nav.quran") : k === "hadith" ? t("nav.hadith") : t("nav.library"));

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("nav.saved")}</h1>
      <div className="mt-4 flex gap-2">
        <button className="chip" data-active={tab === "bookmarks"} onClick={() => setTab("bookmarks")}>{t("saved.bookmarks")}</button>
        <button className="chip" data-active={tab === "notes"} onClick={() => setTab("notes")}>{t("saved.notes")}</button>
      </div>

      {(tab === "bookmarks" ? bms : notes) === null && <div className="mt-10 flex justify-center"><span className="spinner" /></div>}

      {tab === "bookmarks" && bms && (
        <ul className="mt-4 space-y-2">
          {bms.length === 0 && <p className="mt-6 text-center text-sm text-muted">{t("saved.empty")}</p>}
          {bms.map((b) => (
            <li key={b.id} className="card flex items-center justify-between gap-3 !p-3">
              <Link href={hrefFor(b.kind, b.ref, slugs)} className="min-w-0 flex-1">
                <span className="text-xs text-muted">{kindLabel(b.kind)}</span>
                <span className="block truncate text-sm font-medium" dir="auto">{b.title || b.ref}</span>
              </Link>
              <button className="icon-btn" aria-label={t("common.delete")} onClick={() => removeBm(b.id)}>
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "notes" && notes && (
        <ul className="mt-4 space-y-2">
          {notes.length === 0 && <p className="mt-6 text-center text-sm text-muted">{t("saved.emptyNotes")}</p>}
          {notes.map((n) => (
            <li key={n.id} className="card">
              <div className="flex items-center justify-between gap-3">
                <Link href={hrefFor(n.kind, n.ref, slugs)} className="min-w-0 truncate text-xs text-muted hover:text-ink" dir="auto">
                  {kindLabel(n.kind)} · {n.title || n.ref}
                </Link>
                <button className="icon-btn" aria-label={t("common.delete")} onClick={() => removeNote(n.id)}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm" dir="auto">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
