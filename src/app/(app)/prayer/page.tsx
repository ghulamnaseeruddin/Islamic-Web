"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { CITIES } from "@/lib/cities";
import { useI18n } from "@/lib/i18n";
import {
  computeTimes, formatCountdown, formatTime, hijriDate, nextPrayer, PRAYER_ORDER,
  qiblaBearing, resolvePlace, timesAsList, type PrayerKey,
} from "@/lib/prayer";
import { useSettings } from "@/lib/settings";

export default function PrayerPage() {
  const { t, lang } = useI18n();
  const { settings, update } = useSettings();
  const [now, setNow] = useState(() => new Date());
  const [geoError, setGeoError] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const place = resolvePlace(settings, lang);
  const times = useMemo(
    () => timesAsList(computeTimes(now, place, settings.prayerMethod, settings.asr)),
    // recompute when the day or settings change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now.toDateString(), place.lat, place.lon, settings.prayerMethod, settings.asr],
  );
  const next = nextPrayer(now, place, settings.prayerMethod, settings.asr);
  const qibla = qiblaBearing(place);

  const month = useMemo(() => {
    const y = now.getFullYear(), m = now.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(y, m, i + 1, 12);
      return { d, list: timesAsList(computeTimes(d, place, settings.prayerMethod, settings.asr)) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now.getMonth(), place.lat, place.lon, settings.prayerMethod, settings.asr]);

  function locateMe() {
    setGeoError(false);
    navigator.geolocation?.getCurrentPosition(
      (p) => update({ cityKey: "device", lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setGeoError(true),
      { timeout: 10000 },
    );
  }

  async function toggleNotify() {
    if (settings.notifyPrayers) return update({ notifyPrayers: false });
    if (typeof Notification === "undefined") return setNotifMsg(t("prayer.notSupported"));
    const p = await Notification.requestPermission();
    if (p === "granted") {
      update({ notifyPrayers: true });
      setNotifMsg("");
    } else setNotifMsg(t("prayer.denied"));
  }

  const name = (k: PrayerKey) => t(`prayer.${k}` as never);
  const ms = next.time.getTime() - now.getTime();

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("prayer.title")}</h1>
      <p className="mt-1 text-sm text-muted">
        {place.label} · {hijriDate(now, settings.hijriAdjust, lang)}
      </p>

      <div className="card mt-5 text-center">
        <p className="text-xs text-muted">{t("prayer.next")}</p>
        <p className="mt-1 text-2xl font-semibold">{name(next.key)}</p>
        <p className="mt-1 text-sm text-muted">{formatTime(next.time, lang)}</p>
        <p className="mt-3 text-3xl font-light tabular-nums" dir="ltr">{formatCountdown(ms)}</p>
      </div>

      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
        {times.map((p) => (
          <li key={p.key} className={`flex items-center justify-between px-4 py-3 ${p.key === next.key ? "bg-soft font-medium" : ""}`}>
            <span>{name(p.key)}</span>
            <span className="tabular-nums" dir="ltr">{formatTime(p.time, lang)}</span>
          </li>
        ))}
      </ul>

      <div className="card mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t("prayer.city")}</span>
          <select
            className="input mt-1"
            value={settings.cityKey}
            onChange={(e) => update({ cityKey: e.target.value })}
          >
            {settings.cityKey === "device" && <option value="device">{lang === "ur" ? "میرا مقام" : "My location"}</option>}
            {CITIES.map((c) => (
              <option key={c.key} value={c.key}>{lang === "ur" ? c.ur : c.en}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-col justify-end gap-1">
          <button className="btn btn-ghost" onClick={locateMe}>
            <Icon name="mapPin" className="h-4 w-4" /> {t("prayer.useLocation")}
          </button>
          {geoError && <span className="text-xs text-danger">{t("prayer.geoError")}</span>}
        </div>
        <label className="flex items-center justify-between gap-3 sm:col-span-2">
          <span className="text-sm">{t("prayer.notify")}</span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--c-brand)]" checked={settings.notifyPrayers} onChange={toggleNotify} />
        </label>
        {notifMsg && <p className="text-xs text-danger sm:col-span-2">{notifMsg}</p>}
        <p className="text-xs text-muted sm:col-span-2">{t("prayer.settingsHint")}</p>
      </div>

      <div className="card mt-4 flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-line">
          <span className="absolute top-1 text-[10px] text-muted">N</span>
          <div className="h-20 w-20 transition-transform" style={{ transform: `rotate(${qibla}deg)` }}>
            <div className="mx-auto h-10 w-1 rounded bg-brand" />
          </div>
        </div>
        <div>
          <p className="font-medium">{t("prayer.qibla")}</p>
          <p className="text-sm text-muted" dir="ltr">{qibla.toFixed(1)}° {t("prayer.fromNorth")}</p>
          <p className="mt-1 text-xs text-muted">{t("prayer.qiblaHint")}</p>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-muted">{t("prayer.monthly")}</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[34rem] text-sm tabular-nums" dir="ltr">
          <thead>
            <tr className="text-xs text-muted">
              <th className="p-2 text-start">#</th>
              {PRAYER_ORDER.map((k) => (
                <th key={k} className="p-2 text-start">{name(k)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {month.map(({ d, list }) => (
              <tr key={d.getDate()} className={d.getDate() === now.getDate() ? "bg-soft font-medium" : "border-t border-line"}>
                <td className="p-2">{d.getDate()}</td>
                {list.map((p) => (
                  <td key={p.key} className="p-2">{formatTime(p.time, "en")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
