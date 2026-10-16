"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { safeUrl, type LibBook, type LibSection } from "@/lib/library";
import { supabaseBrowser } from "@/lib/supabase/client";

type Report = { id: string; item_type: string; item_ref: string; reason: string; note: string | null; status: string; created_at: string };

export default function AdminPage() {
  const { t } = useI18n();
  const sb = supabaseBrowser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"library" | "reports">("library");
  const [sections, setSections] = useState<LibSection[]>([]);
  const [books, setBooks] = useState<LibBook[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pick, setPick] = useState("");
  const [form, setForm] = useState({ title: "", title_ur: "", author: "", label: "PDF", url: "", app_path: "" });
  const [msg, setMsg] = useState("");

  const loadSections = useCallback(async () => {
    const { data } = await sb.from("library_sections").select("*").order("sort_order");
    setSections((data as LibSection[]) ?? []);
  }, [sb]);

  const loadBooks = useCallback(
    async (sectionId: string) => {
      const { data } = await sb.from("library_books").select("*").eq("section_id", sectionId).order("sort_order");
      setBooks((data as LibBook[]) ?? []);
    },
    [sb],
  );

  const loadReports = useCallback(async () => {
    const { data } = await sb.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
    setReports((data as Report[]) ?? []);
  }, [sb]);

  useEffect(() => {
    (async () => {
      const { data: u } = await sb.auth.getUser();
      const { data: prof } = await sb.from("profiles").select("role").eq("id", u.user?.id ?? "").maybeSingle();
      const ok = prof?.role === "admin";
      setIsAdmin(ok);
      if (ok) {
        loadSections();
        loadReports();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pick) loadBooks(pick);
    else setBooks([]);
  }, [pick, loadBooks]);

  async function toggleSection(s: LibSection) {
    await sb.from("library_sections").update({ is_hidden: !s.is_hidden }).eq("id", s.id);
    loadSections();
  }
  async function toggleBook(b: LibBook) {
    await sb.from("library_books").update({ is_hidden: !b.is_hidden }).eq("id", b.id);
    loadBooks(pick);
  }
  async function removeBook(b: LibBook) {
    if (!confirm(`${t("common.delete")}? ${b.title}`)) return;
    await sb.from("library_books").delete().eq("id", b.id);
    loadBooks(pick);
  }
  async function addBook(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!pick) return setMsg(t("admin.pickSection"));
    if (form.url && safeUrl(form.url) === "#") return setMsg(t("admin.badUrl"));
    const files = form.url ? [{ label: form.label || "PDF", url: form.url.trim() }] : [];
    const { error } = await sb.from("library_books").insert({
      section_id: pick,
      title: form.title.trim(),
      title_ur: form.title_ur.trim() || null,
      author: form.author.trim() || null,
      files,
      app_path: form.app_path.trim() || null,
      sort_order: books.length + 1,
    });
    if (error) return setMsg(error.message);
    setForm({ title: "", title_ur: "", author: "", label: "PDF", url: "", app_path: "" });
    loadBooks(pick);
  }
  async function setReport(r: Report, status: "open" | "done") {
    await sb.from("reports").update({ status }).eq("id", r.id);
    loadReports();
  }
  async function delReport(r: Report) {
    await sb.from("reports").delete().eq("id", r.id);
    loadReports();
  }

  if (isAdmin === null) return <div className="mt-10 flex justify-center"><span className="spinner" /></div>;
  if (!isAdmin) return <div className="card text-center text-sm">{t("admin.denied")}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("nav.admin")}</h1>
      <div className="mt-4 flex gap-2">
        <button className="chip" data-active={tab === "library"} onClick={() => setTab("library")}>{t("nav.library")}</button>
        <button className="chip" data-active={tab === "reports"} onClick={() => setTab("reports")}>
          {t("admin.reports")} ({reports.filter((r) => r.status === "open").length})
        </button>
      </div>

      {tab === "library" && (
        <>
          <section className="card mt-4">
            <h2 className="text-sm font-semibold text-muted">{t("admin.sections")}</h2>
            <ul className="mt-3 divide-y divide-line">
              {sections.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className={s.parent_id ? "ps-4 text-muted" : "font-medium"}>{s.title}</span>
                  <button className="btn btn-ghost !py-1 text-xs" onClick={() => toggleSection(s)}>
                    {s.is_hidden ? t("admin.show") : t("admin.hide")}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card mt-4 space-y-3">
            <h2 className="text-sm font-semibold text-muted">{t("admin.books")}</h2>
            <select className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">{t("admin.pickSection")}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.parent_id ? "— " : ""}{s.title}</option>
              ))}
            </select>

            <ul className="divide-y divide-line">
              {books.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 truncate" dir="auto">{b.title}{b.is_hidden ? " (hidden)" : ""}</span>
                  <span className="flex shrink-0 gap-1">
                    <button className="btn btn-ghost !py-1 text-xs" onClick={() => toggleBook(b)}>{b.is_hidden ? t("admin.show") : t("admin.hide")}</button>
                    <button className="btn btn-danger !py-1 text-xs" onClick={() => removeBook(b)}>{t("common.delete")}</button>
                  </span>
                </li>
              ))}
            </ul>

            <form onSubmit={addBook} className="space-y-2 border-t border-line pt-3">
              <p className="text-sm font-medium">{t("admin.addBook")}</p>
              <input className="input" placeholder={t("admin.bookTitle")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input className="input" placeholder={t("admin.bookTitleUr")} value={form.title_ur} onChange={(e) => setForm({ ...form, title_ur: e.target.value })} />
              <input className="input" placeholder={t("admin.author")} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              <div className="flex gap-2">
                <input className="input max-w-28" placeholder="PDF" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                <input className="input" placeholder="https://…" dir="ltr" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </div>
              <input className="input" placeholder={t("admin.appPath")} dir="ltr" value={form.app_path} onChange={(e) => setForm({ ...form, app_path: e.target.value })} />
              <div className="flex items-center gap-3">
                <button className="btn btn-primary">{t("admin.add")}</button>
                {msg && <span className="text-sm text-danger">{msg}</span>}
              </div>
            </form>
          </section>
        </>
      )}

      {tab === "reports" && (
        <ul className="mt-4 space-y-2">
          {reports.length === 0 && <p className="mt-6 text-center text-sm text-muted">{t("admin.noReports")}</p>}
          {reports.map((r) => (
            <li key={r.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <p className="font-medium" dir="ltr">{r.item_type} · {r.item_ref}</p>
                  <p className="text-muted">{r.reason}{r.note ? ` — ${r.note}` : ""}</p>
                  <p className="mt-1 text-xs text-muted" dir="ltr">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button className="btn btn-ghost !py-1 text-xs" onClick={() => setReport(r, r.status === "open" ? "done" : "open")}>
                    {r.status === "open" ? t("admin.markDone") : t("admin.reopen")}
                  </button>
                  <button className="btn btn-danger !py-1 text-xs" onClick={() => delReport(r)}>{t("common.delete")}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
