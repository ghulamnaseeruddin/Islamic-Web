"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { HADITH_BOOKS } from "@/lib/hadith/books";

export default function HadithIndexPage() {
  const { t, lang } = useI18n();
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("hadith.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("hadith.subtitle")}</p>

      <Link href="/hadith/search" className="card mt-5 flex items-center justify-between hover:bg-soft">
        <span className="text-sm font-medium">{t("hadith.searchTitle")}</span>
        <Icon name="search" className="h-4 w-4 text-muted" />
      </Link>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {HADITH_BOOKS.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/hadith/${b.slug}`}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-4 transition hover:bg-soft"
            >
              <span>
                <span className="block font-medium">{lang === "ur" ? b.ar : b.name}</span>
                <span className="block text-xs text-muted" dir="ltr">
                  {lang === "ur" ? b.name : b.ar}
                </span>
              </span>
              <Icon name="chevronRight" className="h-5 w-5 text-muted rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-muted">
        {t("hadith.moreBooks")}{" "}
        <Link href="/library" className="text-brand underline">
          {t("nav.library")}
        </Link>
      </p>
    </div>
  );
}
