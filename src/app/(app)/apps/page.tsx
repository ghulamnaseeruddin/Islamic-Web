"use client";

import { Icon, type IconName } from "@/components/icons";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useInApp } from "@/lib/useInApp";
import type { TKey } from "@/lib/dictionary";

// The native Windows and Android apps are being built. While a link is "", the card shows
// "Coming soon". When an app is published, put its download link here.
const WINDOWS_URL = "";
const ANDROID_URL = "";

type Platform = {
  id: string;
  icon: IconName;
  name: TKey;
  body: TKey;
  url?: string;
  label?: TKey;
  extraUrl?: string;
  extraLabel?: TKey;
};

const PLATFORMS: Platform[] = [
  { id: "windows", icon: "monitor", name: "apps.windows", body: "apps.windowsBody", url: WINDOWS_URL, label: "apps.download" },
  { id: "android", icon: "phone", name: "apps.android", body: "apps.androidBody", url: ANDROID_URL, label: "apps.downloadAndroid" },
];

export default function AppsPage() {
  const { t } = useI18n();
  const inApp = useInApp();
  const router = useRouter();
  // Inside an installed app there is nothing to download: go home.
  useEffect(() => {
    if (inApp) router.replace("/");
  }, [inApp, router]);
  if (inApp !== false) return null;
  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("apps.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("apps.subtitle")}</p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {PLATFORMS.map((p) => {
          const ready = !!p.url;
          return (
            <li key={p.id} className="card flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                  <Icon name={p.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t(p.name)}</p>
                  <p className="text-sm text-muted">{t(p.body)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
                    ready ? "bg-brand text-brand-ink" : "bg-soft text-muted"
                  }`}
                >
                  {t(ready ? "apps.available" : "apps.soon")}
                </span>
              </div>
              {ready ? (
                <>
                  <a href={p.url} className="btn btn-primary w-full justify-center" {...(p.url?.startsWith("#") ? {} : { download: true })}>
                    <Icon name={p.url?.startsWith("#") ? "phone" : "download"} className="h-4 w-4" />
                    {p.label ? t(p.label) : ""}
                  </a>
                  {p.extraUrl && p.extraLabel && (
                    <a href={p.extraUrl} className="text-center text-xs text-muted underline" download>
                      {t(p.extraLabel)}
                    </a>
                  )}
                </>
              ) : (
                <button className="btn btn-ghost w-full justify-center" disabled>
                  {t("apps.soon")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}