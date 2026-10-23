"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

// Pages you can open without signing in. The Contact page needs sign-in, so no big button there.
const PUBLIC = ["/login", "/signup", "/forgot-password", "/privacy", "/terms", "/docs", "/verify-2fa"];

export function SiteFooter() {
  const { t } = useI18n();
  const path = usePathname() ?? "";
  const showContact = !PUBLIC.some((p) => path === p || path.startsWith(p + "/"));
  return (
    <footer className="px-4 pb-24 pt-4 text-center text-xs text-muted sm:pb-8">
      {showContact && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/contact" className="btn btn-primary !px-8 !py-3 text-base shadow-sm">
            {t("footer.contact")}
          </Link>
          <Link href="/docs" className="btn btn-ghost !px-8 !py-3 text-base">
            Docs
          </Link>
        </div>
      )}
      <p className="mt-4">{t("footer.credit")}</p>
    </footer>
  );
}
