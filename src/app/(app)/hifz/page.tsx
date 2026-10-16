"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { dayRange, TOTAL_AYAHS } from "@/lib/khatam";
import { SURAHS } from "@/lib/quran/surahs";
import { useSettings } from "@/lib/settings";
import { supabaseBrowser } from "@/lib/supabase/client";

type Status = "learning" | "memorised";
type Row = { surah: number; status: Status; last_revised: string | null };

const today = () => new Date().toLocaleDateString("en-CA");
const daysAgo = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000) : Infinity);
const REVISE_AFTER = 7;

export default function HifzPage() {
  const { t, lang } = useI18n();
  const { settings, update } = useSettings();
  const [tab, setTab] = useState<"hifz" | "khatam">("hifz");
  const [rows, setRows] = useState<Record<number, Row>>({});
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabaseBrowser().from("hifz_progress").select("surah, status, last_revised");
    const m: Record<number, Row> = {};
    ((data as Row[]) ?? []).forEach((r) => (m[r.surah] = r));
    setRows(m);
    setLoaded(true);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(surah: number, status: Status | null) {
    const sb = supabaseBrowser();
    if (status === null) {
      setRows((r) => {
        const n = { ...r };
        delete n[surah];
        return n;
      });
      await sb.from("hifz_progress").delete().eq("surah", surah);
      return;
    }
    const prev = rows[surah];
    const row: Row = { surah, status, last_revised: status === "memorised" ? prev?.last_revised ?? today() : null };
    setRows((r) => ({ ...r, [surah]: row }));
    const { data: u } = await sb.auth.getUser();
    await sb.from("hifz_progress").upsert({ user_id: u.user?.id, ...row });
  }
  async function revised(surah: number) {
    const row = { ...rows[surah], last_revised: today() };
    setRows((r) => ({ ...r, [surah]: row }));
    const { data: u } = await sb().auth.getUser();
    await sb().from("hifz_progress").upsert({ user_id: u.user?.id, ...row });
  }
  const sb = () => supabaseBrowser();

  const memorisedAyahs = useMemo(
    () => Object.values(rows).filter((r) => r.status === "memorised").reduce((n, r) => n + SURAHS[r.surah - 1].ayahs, 0),
    [rows],
  );
  const due = useMemo(
    () => Object.values(rows).filter((r) => r.status === "memorised" && daysAgo(r.last_revised) >= REVISE_AFTER).sort((a, b) => daysAgo(b.last_revised) - daysAgo(a.last_revised)),
    [rows],
  );

  const list = SURAHS.filter((s) => !filter.trim() || String(s.n) === filter.trim() || s.en.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("hifz.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("hifz.subtitle")}</p>
      <div className="mt-4 flex gap-2">
        <button className="chip" data-active={tab === "hifz"} onClick={() => setTab("hifz")}>{t("hifz.tabHifz")}</button>
        <button className="chip" data-active={tab === "khatam"} onClick={() => setTab("khatam")}>{t("hifz.tabKhatam")}</button>
      </div>

      {tab === "hifz" && (
        <>
          <div className="card mt-4">
            <div className="flex justify-between text-sm">
              <span>{t("hifz.progress")}</span>
              <span className="tabular-nums" dir="ltr">{memorisedAyahs} / {TOTAL_AYAHS}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-brand" style={{ width: `${(memorisedAyahs / TOTAL_AYAHS) * 100}%` }} />
            </div>
          </div>

          {due.length > 0 && (
            <div className="card mt-4">
              <h2 className="text-sm font-semibold text-muted">{t("hifz.due")}</h2>
              <ul className="mt-2 space-y-1">
                {due.slice(0, 6).map((r) => (
                  <li key={r.surah} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/quran/${r.surah}`} className="hover:underline" dir="ltr">{r.surah}. {SURAHS[r.surah - 1].en}</Link>
                    <button className="btn btn-ghost !py-1 text-xs" onClick={() => revised(r.surah)}>{t("hifz.revisedToday")}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <input className="input mt-4" placeholder={t("quran.filter")} value={filter} onChange={(e) => setFilter(e.target.value)} />
          {!loaded && <div className="mt-6 flex justify-center"><span className="spinner" /></div>}
          <ul className="mt-3 space-y-2">
            {list.map((s) => {
              const r = rows[s.n];
              const ago = r ? daysAgo(r.last_revised) : Infinity;
              return (
                <li key={s.n} className="card flex flex-wrap items-center justify-between gap-2 !p-3">
                  <Link href={`/quran/${s.n}`} className="min-w-0 text-sm" dir="ltr">
                    <span className="font-medium">{s.n}. {s.en}</span>
                    <span className="ms-2 text-xs text-muted">{s.ayahs}</span>
                  </Link>
                  <span className="flex items-center gap-1">
                    {r?.status === "memorised" && (
                      <span className="text-xs text-muted">
                        {ago === Infinity ? "" : ago === 0 ? t("hifz.today") : t("hifz.daysAgo", { n: ago })}
                      </span>
                    )}
                    <button className="chip" data-active={r?.status === "learning"} onClick={() => setStatus(s.n, r?.status === "learning" ? null : "learning")}>
                      {t("hifz.learning")}
                    </button>
                    <button className="chip" data-active={r?.status === "memorised"} onClick={() => setStatus(s.n, r?.status === "memorised" ? null : "memorised")}>
                      {t("hifz.memorised")}
                    </button>
                    {r?.status === "memorised" && (
                      <button className="chip" onClick={() => revised(s.n)}>{t("hifz.revise")}</button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === "khatam" && <Khatam />}
    </div>
  );

  function Khatam() {
    const start = settings.khatamStart;
    const days = settings.khatamDays;
    const [custom, setCustom] = useState(String(days));
    const dayNow = start ? Math.floor((new Date(today() + "T12:00:00").getTime() - new Date(start + "T12:00:00").getTime()) / 86400000) + 1 : 0;
    const done = new Set(settings.khatamDone);
    const pct = (done.size / days) * 100;
    const todayPlan = start && dayNow >= 1 && dayNow <= days ? dayRange(dayNow, days) : null;
    const pos = (p: { surah: number; ayah: number }) => `${SURAHS[p.surah - 1].en} ${p.surah}:${p.ayah}`;

    if (!start)
      return (
        <div className="card mt-4 space-y-4">
          <h2 className="font-semibold">{t("khatam.new")}</h2>
          <p className="text-sm text-muted">{t("khatam.body")}</p>
          <div className="flex flex-wrap gap-2">
            {[30, 60, 90].map((d) => (
              <button key={d} className="chip" data-active={days === d} onClick={() => { update({ khatamDays: d }); setCustom(String(d)); }}>
                {t("khatam.days", { n: d })}
              </button>
            ))}
            <input className="input max-w-[7rem]" inputMode="numeric" value={custom} onChange={(e) => { setCustom(e.target.value.replace(/\D/g, "")); const n = Number(e.target.value); if (n >= 7 && n <= 365) update({ khatamDays: n }); }} dir="ltr" />
          </div>
          <p className="text-sm">{t("khatam.perDay", { n: Math.ceil(TOTAL_AYAHS / days) })}</p>
          <button className="btn btn-primary" onClick={() => update({ khatamStart: today(), khatamDone: [] })}>{t("khatam.start")}</button>
        </div>
      );

    return (
      <div className="mt-4 space-y-4">
        <div className="card">
          <div className="flex justify-between text-sm">
            <span>{t("khatam.progress", { a: done.size, b: days })}</span>
            <span className="tabular-nums" dir="ltr">{Math.round(pct)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {todayPlan ? (
          <div className="card">
            <p className="text-xs text-muted">{t("khatam.today", { n: dayNow, total: days })}</p>
            <p className="mt-1 font-medium" dir="ltr">{pos(todayPlan.from)} → {pos(todayPlan.to)}</p>
            <p className="text-sm text-muted">{t("khatam.ayahs", { n: todayPlan.count })}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/quran/${todayPlan.from.surah}#a${todayPlan.from.ayah}`} className="btn btn-primary">{t("khatam.open")}</Link>
              <button className="btn btn-ghost" onClick={() => update({ khatamDone: done.has(dayNow) ? settings.khatamDone.filter((x) => x !== dayNow) : [...settings.khatamDone, dayNow] })}>
                {done.has(dayNow) ? t("khatam.undo") : t("khatam.markDone")}
              </button>
            </div>
          </div>
        ) : (
          <div className="card text-sm">{dayNow > days ? t("khatam.over") : t("khatam.notStarted")}</div>
        )}

        <details className="card">
          <summary className="cursor-pointer text-sm font-medium">{t("khatam.allDays")}</summary>
          <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
              const r = dayRange(d, days);
              return (
                <li key={d} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-soft">
                  <button className="flex items-center gap-2" onClick={() => update({ khatamDone: done.has(d) ? settings.khatamDone.filter((x) => x !== d) : [...settings.khatamDone, d] })}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] ${done.has(d) ? "border-brand bg-brand text-brand-ink" : "border-line"}`}>{done.has(d) ? "✓" : ""}</span>
                    <span className="tabular-nums" dir="ltr">{d}</span>
                  </button>
                  <Link href={`/quran/${r.from.surah}#a${r.from.ayah}`} className="text-xs text-muted hover:underline" dir="ltr">{r.from.surah}:{r.from.ayah} → {r.to.surah}:{r.to.ayah}</Link>
                </li>
              );
            })}
          </ul>
        </details>

        <button className="btn btn-danger" onClick={() => { if (confirm(t("khatam.resetConfirm"))) update({ khatamStart: null, khatamDone: [] }); }}>
          {t("khatam.reset")}
        </button>
      </div>
    );
  }
}
