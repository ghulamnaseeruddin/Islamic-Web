"use client";

import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="px-4 pb-24 pt-2 text-center text-xs text-muted sm:pb-6">
      {t("footer.credit")}
    </footer>
  );
}