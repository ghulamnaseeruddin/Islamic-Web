"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { DUAS, DUA_CATEGORIES, type DuaCategory } from "@/lib/data/duas";

export default function DuasPage() {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<DuaCategory | "all">("all");
  const [copied, setCopied] = useState("");
  const list = DUAS.filter((d) => cat === "all" || d.cat === cat);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("duas.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("duas.subtitle")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="chip" data-active={cat === "all"} onClick={() => setCat("all")}>{t("duas.all")}</button>
        {DUA_CATEGORIES.map((c) => (
          <button key={c.key} className="chip" data-active={cat === c.key} onClick={() => setCat(c.key)}>
            {lang === "ur" ? c.ur : c.en}
          </button>
        ))}
      </div>
      <ul className="mt-5 space-y-3">
        {list.map((d) => (
          <li key={d.id} className="card">
            <p className="font-arabic text-2xl leading-[2.1]" dir="rtl" lang="ar">{d.ar}</p>
            <p className={`mt-2 ${lang === "ur" ? "font-urdu leading-[2.2]" : "text-sm leading-7"}`} dir={lang === "ur" ? "rtl" : "ltr"}>
              {lang === "ur" ? d.ur : d.en}
            </p>
            {lang === "ur" && <p className="mt-1 text-xs text-muted" dir="ltr">{d.en}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
              <span className="text-xs text-muted" dir="ltr">{d.src}</span>
              <span className="flex items-center gap-1">
                {d.ref && (
                  <Link href={`/quran/${d.ref.split(":")[0]}#a${d.ref.split(":")[1]}`} className="chip">{t("duas.openAyah")}</Link>
                )}
                <button className="icon-btn" aria-label={t("common.copy")} onClick={() => copy(d.id, `${d.ar}\n\n${lang === "ur" ? d.ur : d.en}\n— ${d.src}`)}>
                  <Icon name={copied === d.id ? "check" : "copy"} className="h-4 w-4" />
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted">{t("duas.note")}</p>
    </div>
  );
}
