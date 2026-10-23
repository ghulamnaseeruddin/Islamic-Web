"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { useInApp } from "@/lib/useInApp";
import type { TKey } from "@/lib/dictionary";

const ITEMS: { href: string; icon: IconName; title: TKey; body: TKey }[] = [
  { href: "/names", icon: "sparkle", title: "names.title", body: "more.namesBody" },
  { href: "/duas", icon: "hadith", title: "duas.title", body: "more.duasBody" },
  { href: "/ramadan", icon: "moon", title: "ramadan.title", body: "more.ramadanBody" },
  { href: "/zakat", icon: "library", title: "zakat.title", body: "more.zakatBody" },
  { href: "/qibla", icon: "compass", title: "qibla.title", body: "more.qiblaBody" },
  { href: "/hifz", icon: "quran", title: "hifz.title", body: "more.hifzBody" },
  { href: "/mosques", icon: "mapPin", title: "mosques.title", body: "more.mosquesBody" },
  { href: "/quiz", icon: "check", title: "quiz.title", body: "more.quizBody" },
  { href: "/seerah", icon: "clock", title: "seerah.title", body: "more.seerahBody" },
  { href: "/apps", icon: "download", title: "nav.downloadApps", body: "more.appsBody" },
  { href: "/offline", icon: "download", title: "offline.title", body: "more.offlineBody" },
  { href: "/azkaar", icon: "tasbih", title: "nav.azkaar", body: "more.azkaarBody" },
  { href: "/contact", icon: "note", title: "contact.title", body: "more.contactBody" },
  { href: "/prayer", icon: "clock", title: "nav.prayer", body: "more.prayerBody" },
];

export default function MorePage() {
  const { t } = useI18n();
  const inApp = useInApp();
  const items = inApp === false ? ITEMS : ITEMS.filter((i) => i.href !== "/apps");
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("nav.more")}</h1>
      <p className="mt-1 text-sm text-muted">{t("more.subtitle")}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="card flex h-full items-start gap-3 hover:bg-soft">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                <Icon name={i.icon} className="h-4 w-4" />
              </span>
              <span>
                <span className="block font-medium">{t(i.title)}</span>
                <span className="block text-sm text-muted">{t(i.body)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}