"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { ProfileButton } from "@/components/ProfileButton";
import { useI18n } from "@/lib/i18n";
import { useInApp } from "@/lib/useInApp";
import type { TKey } from "@/lib/dictionary";
import type { AppUser } from "@/components/AppShell";

export const NAV: { href: string; key: TKey; icon: IconName }[] = [
  { href: "/", key: "nav.home", icon: "home" },
  { href: "/quran", key: "nav.quran", icon: "quran" },
  { href: "/hadith", key: "nav.hadith", icon: "hadith" },
  { href: "/library", key: "nav.library", icon: "library" },
  { href: "/azkaar", key: "nav.azkaar", icon: "tasbih" },
  { href: "/prayer", key: "nav.prayer", icon: "clock" },
  { href: "/ask", key: "nav.ask", icon: "sparkle" },
  { href: "/more", key: "nav.more", icon: "grid" },
];

export function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function Header({ user }: { user: AppUser }) {
  const { t } = useI18n();
  const path = usePathname();
  const inApp = useInApp();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Logo small />
        <nav className="ms-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                isActive(path, n.href)
                  ? "bg-soft font-medium text-brand"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5">
          {inApp === false && (
            <Link
              href="/apps"
              className={`btn btn-primary me-1 hidden !px-3 !py-1.5 text-sm lg:inline-flex ${isActive(path, "/apps") ? "ring-2 ring-brand/30" : ""}`}
            >
              <Icon name="download" className="h-4 w-4" />
              {t("nav.downloadApps")}
            </Link>
          )}
          <Link href="/search" className="icon-btn" aria-label={t("nav.search")}>
            <Icon name="search" />
          </Link>
          <ProfileButton user={user} />
        </div>
      </div>
    </header>
  );
}