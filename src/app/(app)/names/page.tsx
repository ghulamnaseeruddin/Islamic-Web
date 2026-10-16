"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { NAMES } from "@/lib/data/names";

export default function NamesPage() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return NAMES;
    return NAMES.filter(
      (n) => String(n.n) === s || n.tr.toLowerCase().includes(s) || n.en.toLowerCase().includes(s) || n.ur.includes(s) || n.ar.includes(s),
    );
  }, [q]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("names.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("names.subtitle")}</p>
      <div className="relative mt-5">
        <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input ps-9" placeholder={t("names.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((n) => (
          <li key={n.n}>
            <button
              type="button"
              onClick={() => setOpen(open === n.n ? null : n.n)}
              className={`card w-full text-center transition hover:bg-soft ${open === n.n ? "!border-brand" : ""}`}
            >
              <span className="block text-xs text-muted">{n.n}</span>
              <span className="font-arabic block text-2xl leading-[1.9]" dir="rtl" lang="ar">{n.ar}</span>
              <span className="block text-sm font-medium" dir="ltr">{n.tr}</span>
              <span className={`mt-1 block text-xs text-muted ${lang === "ur" ? "font-urdu leading-[2]" : ""}`} dir={lang === "ur" ? "rtl" : "ltr"}>
                {lang === "ur" ? n.ur : n.en}
              </span>
              {open === n.n && (
                <span className="mt-2 block border-t border-line pt-2 text-xs text-muted">
                  <span className="block" dir="ltr">{n.en}</span>
                  <span className="font-urdu mt-1 block leading-[2]" dir="rtl">{n.ur}</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="mt-6 text-center text-sm text-muted">{t("common.noResults")}</p>}
      <p className="mt-6 text-xs text-muted">{t("names.note")}</p>
    </div>
  );
}
