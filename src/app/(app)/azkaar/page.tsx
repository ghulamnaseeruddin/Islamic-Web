"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { fetchAyah, type AyahBundle } from "@/lib/quran/api";

// Only well-known adhkar from the Sunnah, each with its source.
const DHIKR = [
  { id: "sub", ar: "سُبْحَانَ اللَّهِ", en: "SubhanAllah", ur: "سبحان اللہ", target: 33, src: "Bukhari 843, Muslim 595" },
  { id: "hamd", ar: "الْحَمْدُ لِلَّهِ", en: "Alhamdulillah", ur: "الحمد للہ", target: 33, src: "Bukhari 843, Muslim 595" },
  { id: "akbar", ar: "اللَّهُ أَكْبَرُ", en: "Allahu Akbar", ur: "اللہ اکبر", target: 34, src: "Bukhari 843, Muslim 595" },
  { id: "bihamd", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", en: "SubhanAllahi wa bihamdihi", ur: "سبحان اللہ و بحمدہ", target: 100, src: "Muslim 2692" },
  { id: "istighfar", ar: "أَسْتَغْفِرُ اللَّهَ", en: "Astaghfirullah", ur: "استغفر اللہ", target: 3, src: "Muslim 591" },
  { id: "hawqala", ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", en: "La hawla wa la quwwata illa billah", ur: "لا حول ولا قوۃ الا باللہ", target: 100, src: "Bukhari 4205, Muslim 2704" },
];

const QURAN_REFS = [
  { ref: "2:255", key: "azkaar.kursi" },
  { ref: "112:1", key: "azkaar.ikhlas" },
  { ref: "113:1", key: "azkaar.falaq" },
  { ref: "114:1", key: "azkaar.nas" },
  { ref: "2:285", key: "azkaar.baqarahEnd" },
] as const;

function loadCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem("noor-dhikr-counts");
    if (raw) {
      const p = JSON.parse(raw);
      if (p.day === new Date().toDateString()) return p.counts ?? {};
    }
  } catch {
    /* ignore */
  }
  return {};
}

export default function AzkaarPage() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ayahs, setAyahs] = useState<Record<string, AyahBundle | null>>({});
  const trId = settings.translations[0] ?? "ur.jalandhry";

  useEffect(() => setCounts(loadCounts()), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await Promise.all(QURAN_REFS.map((r) => fetchAyah(r.ref, [trId])));
      if (cancelled) return;
      const m: Record<string, AyahBundle | null> = {};
      QURAN_REFS.forEach((r, i) => (m[r.ref] = res[i]));
      setAyahs(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [trId]);

  function bump(id: string, d: number) {
    setCounts((c) => {
      const next = { ...c, [id]: Math.max(0, (c[id] ?? 0) + d) };
      try {
        localStorage.setItem("noor-dhikr-counts", JSON.stringify({ day: new Date().toDateString(), counts: next }));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("azkaar.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("azkaar.subtitle")}</p>

      <h2 className="mt-6 text-sm font-semibold text-muted">{t("azkaar.counter")}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {DHIKR.map((d) => {
          const c = counts[d.id] ?? 0;
          const done = c >= d.target;
          return (
            <li key={d.id} className="card">
              <p className="font-arabic text-2xl leading-loose" dir="rtl" lang="ar">{d.ar}</p>
              <p className="text-sm text-muted">{lang === "ur" ? d.ur : d.en}</p>
              <div className="mt-3 flex items-center justify-between">
                <button
                  className={`btn ${done ? "btn-ghost" : "btn-primary"} min-w-28 text-lg`}
                  onClick={() => bump(d.id, 1)}
                  aria-label={t("azkaar.tap")}
                >
                  {c} / {d.target}
                </button>
                <button className="btn btn-quiet text-xs" onClick={() => bump(d.id, -c)}>
                  {t("azkaar.reset")}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted" dir="ltr">{d.src}</p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 text-sm font-semibold text-muted">{t("azkaar.fromQuran")}</h2>
      <ul className="mt-3 space-y-3">
        {QURAN_REFS.map((r) => {
          const a = ayahs[r.ref];
          return (
            <li key={r.ref} className="card">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{t(r.key)}</span>
                <Link href={`/quran/${r.ref.split(":")[0]}#a${r.ref.split(":")[1]}`} className="underline" dir="ltr">
                  {r.ref}
                </Link>
              </div>
              {a === undefined ? (
                <div className="mt-4 flex justify-center"><span className="spinner" /></div>
              ) : a === null ? (
                <p className="mt-3 text-sm text-muted">{t("common.error")}</p>
              ) : (
                <>
                  <p className="font-arabic mt-3 leading-[2.1]" dir="rtl" lang="ar" style={{ fontSize: Math.max(22, settings.arabicFontSize - 6) }}>
                    {a.arabic}
                  </p>
                  {a.translations[trId] && (
                    <p className={`mt-2 ${trId.startsWith("ur") ? "font-urdu leading-[2.2]" : "text-sm leading-7"}`} dir={trId.startsWith("ur") ? "rtl" : "ltr"}>
                      {a.translations[trId]}
                    </p>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>

      <Link href="/library/sunnat-azkaar" className="card mt-8 block text-sm hover:bg-soft">
        {t("azkaar.pdfs")}
      </Link>
    </div>
  );
}
