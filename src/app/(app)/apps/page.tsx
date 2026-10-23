"use client";

import { Icon, type IconName } from "@/components/icons";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useInApp } from "@/lib/useInApp";
import type { TKey } from "@/lib/dictionary";

// Installers are built and published by the noor-ul-ilm-desktop repository (GitHub Releases).
// Set a link to "" to show "Coming soon" instead of a download button.
const RELEASES = "https://github.com/ghulamnaseeruddin/noor-ul-ilm-desktop/releases/latest/download";
const WINDOWS_URL = `${RELEASES}/Noor-ul-Ilm-Setup.exe`;
const LINUX_URL = `${RELEASES}/Noor-ul-Ilm.AppImage`;
const LINUX_DEB_URL = `${RELEASES}/Noor-ul-Ilm.deb`;
const MAC_ARM_URL = `${RELEASES}/Noor-ul-Ilm-mac-arm64.dmg`;
const MAC_INTEL_URL = `${RELEASES}/Noor-ul-Ilm-mac-x64.dmg`;

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
  {
    id: "linux",
    icon: "monitor",
    name: "apps.linux",
    body: "apps.linuxBody",
    url: LINUX_URL,
    label: "apps.downloadLinux",
    extraUrl: LINUX_DEB_URL,
    extraLabel: "apps.debLink",
  },
  { id: "android", icon: "phone", name: "apps.android", body: "apps.androidBody" },
  { id: "iphone", icon: "phone", name: "apps.iphone", body: "apps.iphoneBody" },
  {
    id: "mac",
    icon: "monitor",
    name: "apps.mac",
    body: "apps.macBody",
    url: MAC_ARM_URL,
    label: "apps.downloadMac",
    extraUrl: MAC_INTEL_URL,
    extraLabel: "apps.macIntel",
  },
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
                  <a href={p.url} className="btn btn-primary w-full justify-center" download>
                    <Icon name="download" className="h-4 w-4" />
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

      <section className="card mt-5">
        <h2 className="font-medium">{t("apps.help")}</h2>
        <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-sm text-muted">
          <li>{t("apps.step1")}</li>
          <li>{t("apps.step2")}</li>
          <li>{t("apps.step3")}</li>
        </ol>
      </section>

      <section className="card mt-3">
        <h2 className="font-medium">{t("apps.helpMac")}</h2>
        <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-muted">
          <li>{t("apps.mstep1")}</li>
          <li>{t("apps.mstep2")}</li>
        </ul>
      </section>

      <section className="card mt-3">
        <h2 className="font-medium">{t("apps.helpLinux")}</h2>
        <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-muted">
          <li>{t("apps.lstep1")}</li>
          <li>{t("apps.lstep2")}</li>
        </ul>
      </section>
    </div>
  );
}