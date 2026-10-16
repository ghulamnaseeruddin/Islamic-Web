"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type InstallEvent = Event & { prompt: () => Promise<void> };

/** Registers the service worker and offers an "Install app" button (Settings page). */
export function usePwaInstall() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  return {
    canInstall: !!evt,
    install: async () => {
      if (!evt) return;
      await evt.prompt();
      setEvt(null);
    },
  };
}

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

export function InstallButton() {
  const { t } = useI18n();
  const { canInstall, install } = usePwaInstall();
  if (!canInstall) return <p className="text-xs text-muted">{t("settings.installHint")}</p>;
  return (
    <button className="btn btn-ghost" onClick={install}>{t("settings.install")}</button>
  );
}
