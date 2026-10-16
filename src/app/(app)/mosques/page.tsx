"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { resolvePlace } from "@/lib/prayer";
import { useSettings } from "@/lib/settings";

type Mosque = { id: string; name: string; lat: number; lon: number; dist: number };

function distance(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function MosquesPage() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const [radius, setRadius] = useState(2000);
  const [list, setList] = useState<Mosque[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [from, setFrom] = useState("");

  async function search(lat: number, lon: number, label: string) {
    setBusy(true);
    setErr("");
    setFrom(label);
    const query = `[out:json][timeout:25];nwr(around:${radius},${lat},${lon})[amenity=place_of_worship][religion=muslim];out center 60;`;
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const j = await res.json();
      const items: Mosque[] = (j.elements as any[])
        .map((e) => {
          const la = e.lat ?? e.center?.lat;
          const lo = e.lon ?? e.center?.lon;
          if (la == null || lo == null) return null;
          const name = e.tags?.["name:ur"] || e.tags?.name || e.tags?.["name:en"] || "";
          return { id: `${e.type}${e.id}`, name, lat: la, lon: lo, dist: distance([lat, lon], [la, lo]) };
        })
        .filter((x): x is Mosque => !!x)
        .sort((a, b) => a.dist - b.dist);
      setList(items);
    } catch {
      setErr(t("mosques.error"));
    } finally {
      setBusy(false);
    }
  }

  function useDevice() {
    setErr("");
    if (!navigator.geolocation) return setErr(t("prayer.geoError"));
    navigator.geolocation.getCurrentPosition(
      (p) => search(p.coords.latitude, p.coords.longitude, t("mosques.nearYou")),
      () => setErr(t("prayer.geoError")),
      { timeout: 10000 },
    );
  }
  function useCity() {
    const p = resolvePlace(settings, lang);
    search(p.lat, p.lon, p.label);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("mosques.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("mosques.subtitle")}</p>

      <div className="card mt-5 space-y-3">
        <label className="block">
          <span className="label">{t("mosques.radius")}</span>
          <select className="input mt-1 max-w-[12rem]" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            {[1000, 2000, 5000, 10000].map((r) => (
              <option key={r} value={r}>{r / 1000} km</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={useDevice} disabled={busy}>{t("prayer.useLocation")}</button>
          <button className="btn btn-ghost" onClick={useCity} disabled={busy}>{t("mosques.useCity")}</button>
        </div>
      </div>

      {busy && <div className="mt-8 flex justify-center"><span className="spinner" /></div>}
      {err && <p className="card mt-4 text-sm text-danger">{err}</p>}

      {list && !busy && (
        <>
          <p className="mt-5 text-sm text-muted">{t("mosques.found", { n: list.length, place: from })}</p>
          <ul className="mt-3 space-y-2">
            {list.map((m) => (
              <li key={m.id} className="card flex items-center justify-between gap-3 !p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" dir="auto">{m.name || t("mosques.unnamed")}</p>
                  <p className="text-xs text-muted" dir="ltr">{m.dist < 1000 ? `${Math.round(m.dist)} m` : `${(m.dist / 1000).toFixed(1)} km`}</p>
                </div>
                <a
                  className="btn btn-ghost !py-1.5 text-xs"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${m.lat}&mlon=${m.lon}#map=18/${m.lat}/${m.lon}`}
                >
                  {t("mosques.map")}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-6 text-xs text-muted">{t("mosques.note")}</p>
    </div>
  );
}
