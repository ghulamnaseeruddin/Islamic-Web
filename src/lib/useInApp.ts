"use client";

import { useEffect, useState } from "react";

/**
 * Is the site running inside an installed app (Android app, desktop app, or an installed copy)?
 * Returns null until the browser has been checked, so the "Download apps" button never flashes
 * on screen inside an app. true = inside an app, false = normal website.
 */
export function useInApp(): boolean | null {
  const [inApp, setInApp] = useState<boolean | null>(null);
  useEffect(() => {
    let v = false;
    try {
      v =
        navigator.userAgent.includes("NoorUlIlmDesktop") || // Windows / Linux / Mac app
        window.matchMedia("(display-mode: standalone)").matches || // Android app, installed copy
        (navigator as unknown as { standalone?: boolean }).standalone === true || // iPhone Home Screen
        document.referrer.startsWith("android-app://");
    } catch {
      v = false;
    }
    setInApp(v);
  }, []);
  return inApp;
}
