"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PasswordInput } from "@/components/auth";
import { TwoFactorCard } from "@/components/TwoFactorCard";
import { Dialog } from "@/components/Dialog";
import { useI18n } from "@/lib/i18n";
import { computeStreak } from "@/lib/streak";
import { supabaseBrowser } from "@/lib/supabase/client";

type Profile = { full_name: string; city: string; bio: string; avatar_url: string | null; email: string; created: string };

export default function ProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const sb = supabaseBrowser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uid, setUid] = useState("");
  const [p, setP] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ ayahs: 0, streak: 0, bookmarks: 0, notes: 0 });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const [delOpen, setDelOpen] = useState(false);
  const [delText, setDelText] = useState("");
  const [delErr, setDelErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await sb.auth.getUser();
      const user = u.user;
      if (!user) return;
      setUid(user.id);
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      const { data: row } = await sb.from("profiles").select("full_name, city, bio, avatar_url").eq("id", user.id).maybeSingle();
      setP({
        full_name: row?.full_name || meta.full_name || meta.name || "",
        city: row?.city || "",
        bio: row?.bio || "",
        avatar_url: row?.avatar_url || meta.avatar_url || meta.picture || null,
        email: user.email ?? "",
        created: user.created_at ?? "",
      });
      const [log, b, n] = await Promise.all([
        sb.from("reading_log").select("day, ayahs"),
        sb.from("bookmarks").select("id", { count: "exact", head: true }),
        sb.from("notes").select("id", { count: "exact", head: true }),
      ]);
      const rows = (log.data as { day: string; ayahs: number }[]) ?? [];
      setStats({
        ayahs: rows.reduce((a, r) => a + (r.ayahs ?? 0), 0),
        streak: computeStreak(rows.map((r) => r.day)),
        bookmarks: b.count ?? 0,
        notes: n.count ?? 0,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!p) return;
    setBusy(true);
    setMsg("");
    const { error } = await sb.from("profiles").upsert({
      id: uid,
      full_name: p.full_name.trim(),
      city: p.city.trim() || null,
      bio: p.bio.trim() || null,
      avatar_url: p.avatar_url,
    });
    await sb.auth.updateUser({ data: { full_name: p.full_name.trim() } });
    setBusy(false);
    setMsg(error ? t("common.error") : t("profile.saved"));
    if (!error) router.refresh();
  }

  async function upload(file: File) {
    if (!p) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      setMsg(t("profile.avatarTooBig"));
      return;
    }
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${uid}/avatar-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setBusy(false);
      setMsg(error.message);
      return;
    }
    const url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    setP({ ...p, avatar_url: url });
    await sb.from("profiles").upsert({ id: uid, avatar_url: url });
    setBusy(false);
    setMsg(t("profile.saved"));
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    if (pw.length < 8) return setPwMsg(t("auth.passwordShort"));
    if (pw !== pw2) return setPwMsg(t("auth.passwordMismatch"));
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) setPwMsg(error.message);
    else {
      setPwMsg(t("auth.passwordUpdated"));
      setPw("");
      setPw2("");
    }
  }

  async function exportData() {
    const tables = ["profiles", "user_settings", "bookmarks", "notes", "reading_progress", "reading_log"];
    const out: Record<string, unknown> = { exportedAt: new Date().toISOString() };
    for (const tb of tables) {
      const { data } = await sb.from(tb).select("*");
      out[tb] = data ?? [];
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "noor-ul-ilm-my-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function signOutEverywhere() {
    await sb.auth.signOut({ scope: "global" });
    router.replace("/login");
    router.refresh();
  }

  async function deleteAccount() {
    setDelErr("");
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setDelErr(j.error || t("common.error"));
      return;
    }
    await sb.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (!p) return <div className="mt-10 flex justify-center"><span className="spinner" /></div>;
  const initial = (p.full_name || p.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("nav.profile")}</h1>

      <div className="mt-5 flex items-center gap-4">
        {p.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-3xl text-brand-ink">{initial}</span>
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={busy}>{t("profile.changePhoto")}</button>
          <p className="mt-1 text-xs text-muted" dir="ltr">{p.email}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [stats.ayahs, t("profile.statAyahs")],
          [stats.streak, t("profile.statStreak")],
          [stats.bookmarks, t("profile.statBookmarks")],
          [stats.notes, t("profile.statNotes")],
        ].map(([n, label]) => (
          <div key={String(label)} className="card text-center !p-3">
            <p className="text-xl font-semibold tabular-nums">{n}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="card mt-5 space-y-4">
        <label className="block">
          <span className="label">{t("auth.fullName")}</span>
          <input className="input mt-1" value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} required minLength={2} />
        </label>
        <label className="block">
          <span className="label">{t("profile.city")}</span>
          <input className="input mt-1" value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">{t("profile.bio")}</span>
          <textarea className="input mt-1" rows={3} maxLength={300} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} />
        </label>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" disabled={busy}>{t("note.save")}</button>
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </form>

      <form onSubmit={changePassword} className="card mt-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted">{t("profile.password")}</h2>
        <PasswordInput value={pw} onChange={setPw} placeholder={t("auth.newPassword")} autoComplete="new-password" />
        <PasswordInput value={pw2} onChange={setPw2} placeholder={t("auth.confirmPassword")} autoComplete="new-password" />
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost">{t("auth.savePassword")}</button>
          {pwMsg && <span className="text-sm text-muted">{pwMsg}</span>}
        </div>
      </form>

      <TwoFactorCard />

      <div className="card mt-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted">{t("profile.dataTitle")}</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={exportData}>{t("profile.export")}</button>
          <button className="btn btn-ghost" onClick={signOutEverywhere}>{t("profile.signOutAll")}</button>
          <button className="btn btn-danger" onClick={() => setDelOpen(true)}>{t("profile.delete")}</button>
        </div>
      </div>

      <Dialog open={delOpen} onClose={() => setDelOpen(false)} title={t("profile.delete")}>
        <div className="space-y-3">
          <p className="text-sm text-muted">{t("profile.deleteWarn")}</p>
          <input className="input" value={delText} onChange={(e) => setDelText(e.target.value)} placeholder="DELETE" dir="ltr" />
          {delErr && <p className="text-sm text-danger">{delErr}</p>}
          <button className="btn btn-danger" disabled={delText !== "DELETE"} onClick={deleteAccount}>{t("profile.deleteConfirm")}</button>
        </div>
      </Dialog>
    </div>
  );
}
