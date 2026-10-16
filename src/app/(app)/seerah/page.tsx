"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SEERAH } from "@/lib/data/seerah";

const PLACE = { Makkah: "seerah.makkah", Madinah: "seerah.madinah", Other: "seerah.other" } as const;

export default function SeerahPage() {
  const { t, lang } = useI18n();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("seerah.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("seerah.subtitle")}</p>
      <ol className="relative mt-6 border-s border-line ps-6">
        {SEERAH.map((e, i) => (
          <li key={i} className="mb-6">
            <span className="absolute -start-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand bg-bg" />
            <p className="text-sm font-semibold text-brand" dir="ltr">
              {e.year}{e.ah ? ` · ${e.ah}` : ""}
            </p>
            <p className="mt-1 text-[15px] leading-7" dir={lang === "ur" ? "rtl" : "ltr"}>
              {lang === "ur" ? e.ur : e.en}
            </p>
            <p className="mt-1 flex items-center gap-2 text-xs text-muted">
              <span className="chip">{t(PLACE[e.place])}</span>
              {e.ref && (
                <Link href={`/quran/${e.ref.split(":")[0]}#a${e.ref.split(":")[1]}`} className="underline" dir="ltr">
                  {t("seerah.ayah")} {e.ref}
                </Link>
              )}
            </p>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">{t("seerah.note")}</p>
    </div>
  );
}
