"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { SURAHS } from "@/lib/quran/surahs";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function QuranIndexPage() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [last, setLast] = useState<{ surah: number; ayah: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser()
        .from("reading_progress")
        .select("surah, ayah")
        .maybeSingle();
      if (data) setLast(data as { surah: number; ayah: number });
    })();
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return SURAHS;
    return SURAHS.filter(
      (x) => String(x.n) === s || x.en.toLowerCase().includes(s) || x.ar.includes(s),
    );
  }, [q]);

  const lastInfo = last ? SURAHS[last.surah - 1] : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("quran.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("quran.subtitle")}</p>

      {lastInfo && last && (
        <Link
          href={`/quran/${last.surah}#a${last.ayah}`}
          className="card mt-5 flex items-center justify-between hover:bg-soft"
        >
          <div>
            <p className="text-xs text-muted">{t("quran.continue")}</p>
            <p className="mt-0.5 font-medium" dir="ltr">
              {lastInfo.en} · {last.surah}:{last.ayah}
            </p>
          </div>
          <Icon name="chevronRight" className="h-5 w-5 text-muted rtl:rotate-180" />
        </Link>
      )}

      <div className="relative mt-5">
        <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="input ps-9"
          placeholder={t("quran.filter")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {list.map((s) => (
          <li key={s.n}>
            <Link
              href={`/quran/${s.n}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition hover:bg-soft"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-sm font-medium text-brand">
                {s.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium" dir="ltr">
                  {s.en}
                </span>
                <span className="block text-xs text-muted">
                  {t("quran.ayahsCount", { n: s.ayahs })}
                </span>
              </span>
              <span className="font-arabic text-xl" dir="rtl" lang={lang === "ur" ? "ar" : undefined}>
                {s.ar.replace("سورة ", "")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-6 text-center text-sm text-muted">{t("common.noResults")}</p>}
    </div>
  );
}
