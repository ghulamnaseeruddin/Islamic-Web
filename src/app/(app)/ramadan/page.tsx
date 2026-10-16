"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { addDays, EVENTS, hijriOf, HIJRI_MONTHS, nextOccurrence, noon, ramadanDays } from "@/lib/hijri";
import { computeTimes, formatTime, hijriDate, resolvePlace } from "@/lib/prayer";
import { useSettings } from "@/lib/settings";

export default function RamadanPage() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const [tab, setTab] = useState<"timetable" | "events">("timetable");
  const now = useMemo(() => new Date(), []);
  const place = resolvePlace(settings, lang);
  const adj = settings.hijriAdjust;
  const today = noon(now).getTime();

  const days = useMemo(() => ramadanDays(now, adj), [now, adj]);
  const rows = useMemo(
    () =>
      days.map((d, i) => {
        const tm = computeTimes(d, place, settings.prayerMethod, settings.asr);
        return { n: i + 1, d, sehri: tm.fajr, iftar: tm.maghrib };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, place.lat, place.lon, settings.prayerMethod, settings.asr],
  );

  const events = useMemo(
    () =>
      EVENTS.map((e) => ({ e, date: nextOccurrence(e.m, e.d, now, adj) }))
        .filter((x) => x.date)
        .sort((a, b) => a.date!.getTime() - b.date!.getTime()),
    [now, adj],
  );

  const dateFmt = (d: Date) =>
    new Intl.DateTimeFormat(lang === "ur" ? "ur-PK" : "en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d);
  const h = hijriOf(now, adj);

  const fastLen = (a: Date, b: Date) => {
    const mins = Math.round((b.getTime() - a.getTime()) / 60000);
    return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("ramadan.title")}</h1>
      <p className="mt-1 text-sm text-muted">
        {place.label} · {hijriDate(now, adj, lang)}
        {h.m >= 1 && ` · ${lang === "ur" ? HIJRI_MONTHS[h.m - 1].ur : HIJRI_MONTHS[h.m - 1].en}`}
      </p>
      <div className="mt-4 flex gap-2">
        <button className="chip" data-active={tab === "timetable"} onClick={() => setTab("timetable")}>{t("ramadan.timetable")}</button>
        <button className="chip" data-active={tab === "events"} onClick={() => setTab("events")}>{t("ramadan.events")}</button>
      </div>

      {tab === "timetable" && (
        <>
          {rows.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              {t("ramadan.starts", { date: dateFmt(rows[0].d) })}
            </p>
          )}
          <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[30rem] text-sm tabular-nums" dir="ltr">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="p-2 text-start">{t("ramadan.day")}</th>
                  <th className="p-2 text-start">{t("ramadan.date")}</th>
                  <th className="p-2 text-start">{t("ramadan.sehri")}</th>
                  <th className="p-2 text-start">{t("ramadan.iftar")}</th>
                  <th className="p-2 text-start">{t("ramadan.length")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n} className={noon(r.d).getTime() === today ? "bg-soft font-medium" : "border-t border-line"}>
                    <td className="p-2">{r.n}</td>
                    <td className="p-2">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(r.d)}</td>
                    <td className="p-2">{formatTime(r.sehri, "en")}</td>
                    <td className="p-2">{formatTime(r.iftar, "en")}</td>
                    <td className="p-2 text-muted">{fastLen(r.sehri, r.iftar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">{t("ramadan.note")}</p>
        </>
      )}

      {tab === "events" && (
        <>
          <ul className="mt-4 space-y-3">
            {events.map(({ e, date }) => {
              const left = Math.round((noon(date!).getTime() - today) / 86400000);
              return (
                <li key={`${e.m}-${e.d}`} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{lang === "ur" ? e.ur : e.en}</p>
                      <p className="text-xs text-muted" dir="ltr">
                        {e.d} {HIJRI_MONTHS[e.m - 1].en}
                      </p>
                    </div>
                    <div className="text-end text-sm">
                      <p dir="ltr">{dateFmt(date!)}</p>
                      <p className="text-xs text-muted">{left === 0 ? t("ramadan.today") : t("ramadan.inDays", { n: left })}</p>
                    </div>
                  </div>
                  {(lang === "ur" ? e.noteUr : e.noteEn) && (
                    <p className="mt-2 text-sm text-muted" dir={lang === "ur" ? "rtl" : "ltr"}>{lang === "ur" ? e.noteUr : e.noteEn}</p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="card mt-4 text-sm text-muted">{t("ramadan.monthly")}</div>
          <p className="mt-3 text-xs text-muted">{t("ramadan.dateNote")}</p>
        </>
      )}
    </div>
  );
}
