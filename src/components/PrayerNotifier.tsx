"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings";
import { useI18n } from "@/lib/i18n";
import { nextPrayer, resolvePlace } from "@/lib/prayer";

/**
 * Shows a browser notification at prayer time while the app is open in a tab.
 * (Notifications when the app is closed need push notifications: a later step.)
 */
export function PrayerNotifier() {
  const { settings, ready } = useSettings();
  const { lang, t } = useI18n();

  useEffect(() => {
    if (!ready || !settings.notifyPrayers) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      const place = resolvePlace(settings, lang);
      const next = nextPrayer(new Date(), place, settings.prayerMethod, settings.asr);
      const wait = next.time.getTime() - Date.now();
      if (wait < 0 || wait > 2147483000) return;
      timer = setTimeout(() => {
        try {
          const title = t("prayer.notifyTitle");
          const opts = { body: `${t(`prayer.${next.key}` as never)}`, icon: "/icon-192.png" };
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistration().then((reg) => {
              if (reg) reg.showNotification(title, opts);
              else new Notification(title, opts);
            });
          } else {
            new Notification(title, opts);
          }
        } catch {
          /* ignore */
        }
        schedule();
      }, wait + 500);
    };
    schedule();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    ready,
    lang,
    t,
    settings.notifyPrayers,
    settings.cityKey,
    settings.lat,
    settings.lon,
    settings.prayerMethod,
    settings.asr,
    settings,
  ]);

  return null;
}
