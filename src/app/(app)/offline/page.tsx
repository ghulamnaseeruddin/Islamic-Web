"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { listOffline, removeOffline, type OfflineSurah } from "@/lib/offline";
import { getSurah } from "@/lib/quran/surahs";

export default function OfflinePage() {
  const { t } = useI18n();
  const [items, setItems] = useState<OfflineSurah[] | null>(null);
  const load = () => listOffline().then((l) => setItems(l.sort((a, b) => a.surah - b.surah))).catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("offline.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("offline.body")}</p>
      {items === null && <div className="mt-6 flex justify-center"><span className="spinner" /></div>}
      {items?.length === 0 && <div className="card mt-4 text-sm text-muted">{t("offline.empty")}</div>}
      <ul className="mt-4 space-y-2">
        {items?.map((o) => (
          <li key={o.surah} className="card flex items-center justify-between gap-2 !p-3">
            <Link href={`/quran/${o.surah}`} className="text-sm font-medium hover:underline" dir="ltr">
              {o.surah}. {getSurah(o.surah)?.en}
              <span className="ms-2 text-xs text-muted">{new Date(o.savedAt).toLocaleDateString()}</span>
            </Link>
            <button className="btn btn-ghost !py-1 text-xs" onClick={async () => { await removeOffline(o.surah); load(); }}>
              {t("common.delete")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
