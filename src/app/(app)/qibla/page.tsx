"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { qiblaBearing, resolvePlace } from "@/lib/prayer";
import { useSettings } from "@/lib/settings";

type OrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

export default function QiblaPage() {
  const { t, lang } = useI18n();
  const { settings, update } = useSettings();
  const place = resolvePlace(settings, lang);
  const qibla = qiblaBearing(place);

  const [heading, setHeading] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "on" | "denied" | "none">("idle");
  const smooth = useRef<number | null>(null);

  const handler = useCallback((e: Event) => {
    const ev = e as OrientationEvent;
    let h: number | null = null;
    if (typeof ev.webkitCompassHeading === "number") h = ev.webkitCompassHeading; // iPhone
    else if (ev.absolute && ev.alpha != null) h = (360 - ev.alpha) % 360; // Android
    if (h == null || Number.isNaN(h)) return;
    // smooth the movement (handles the 359 to 0 jump)
    const prev = smooth.current ?? h;
    let diff = h - prev;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const next = (prev + diff * 0.25 + 360) % 360;
    smooth.current = next;
    setHeading(next);
  }, []);

  async function start() {
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (typeof D.requestPermission === "function") {
        const r = await D.requestPermission();
        if (r !== "granted") return setState("denied");
      }
    } catch {
      return setState("denied");
    }
    if (!("DeviceOrientationEvent" in window)) return setState("none");
    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);
    setState("on");
    setTimeout(() => {
      if (smooth.current === null) setState("none");
    }, 3000);
  }

  useEffect(
    () => () => {
      window.removeEventListener("deviceorientationabsolute", handler, true);
      window.removeEventListener("deviceorientation", handler, true);
    },
    [handler],
  );

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (p) => update({ cityKey: "device", lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {},
      { timeout: 10000 },
    );
  }

  const rotation = heading === null ? 0 : (qibla - heading + 360) % 360;
  const aligned = heading !== null && Math.min(rotation, 360 - rotation) <= 4;

  useEffect(() => {
    if (aligned && "vibrate" in navigator) navigator.vibrate?.(60);
  }, [aligned]);

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold">{t("qibla.title")}</h1>
      <p className="mt-1 text-sm text-muted">{place.label} · <span dir="ltr">{qibla.toFixed(1)}°</span></p>

      <div className="relative mx-auto mt-8 h-72 w-72">
        <div className={`absolute inset-0 rounded-full border-2 ${aligned ? "border-brand" : "border-line"} bg-surface`} />
        <span className="absolute left-1/2 top-2 -translate-x-1/2 text-xs text-muted">{heading === null ? "N" : "▲"}</span>
        {/* the arrow points to the Qibla; it turns as you turn the phone */}
        <div className="absolute inset-4 transition-transform duration-150" style={{ transform: `rotate(${heading === null ? qibla : rotation}deg)` }}>
          <div className="mx-auto h-1/2 w-1.5 rounded-full bg-brand" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 border-x-[10px] border-b-[16px] border-x-transparent border-b-[var(--c-brand)]" />
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-3xl">🕋</span>
      </div>

      {state === "on" && heading !== null && (
        <p className={`mt-4 text-sm ${aligned ? "font-medium text-brand" : "text-muted"}`}>
          {aligned ? t("qibla.aligned") : t("qibla.turn")}
        </p>
      )}
      {state === "idle" && (
        <button className="btn btn-primary mt-6" onClick={start}>{t("qibla.start")}</button>
      )}
      {state === "denied" && <p className="mt-4 text-sm text-danger">{t("qibla.denied")}</p>}
      {state === "none" && <p className="mt-4 text-sm text-muted">{t("qibla.none")}</p>}

      <div className="mt-6 flex justify-center gap-2">
        <button className="btn btn-ghost" onClick={locate}>{t("prayer.useLocation")}</button>
      </div>
      <p className="mt-4 text-xs text-muted">{t("qibla.hint")}</p>
    </div>
  );
}
