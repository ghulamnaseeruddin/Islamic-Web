"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { NAV, isActive } from "@/components/Header";

// On phones the main pages sit in a bar at the bottom.
const MOBILE = ["/", "/quran", "/hadith", "/library", "/ask", "/apps", "/more"];

export function BottomNav() {
  const { t } = useI18n();
  const path = usePathname();
  const items = NAV.filter((n) => MOBILE.includes(n.href));
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((n) => {
          const active = isActive(path, n.href);
          return (
            <li key={n.href} className="flex-1">
              <Link
                href={n.href}
                className={`flex flex-col items-center gap-0.5 px-0.5 py-2 text-[10px] leading-tight ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <Icon name={n.icon} className="h-5 w-5" />
                <span className="max-w-full truncate">{t(n.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}