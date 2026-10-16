"use client";

import type { ReactNode } from "react";
import { InstallButton } from "@/components/PwaRegister";
import { CITIES } from "@/lib/cities";
import { useI18n } from "@/lib/i18n";
import { METHODS } from "@/lib/prayer";
import { RECITERS, TAFSIRS, TRANSLATIONS } from "@/lib/quran/editions";
import { useSettings, type ThemeChoice } from "@/lib/settings";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card mt-4 space-y-4">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="sm:max-w-[55%]">
        <p className="text-sm">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <div className="sm:w-64">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-brand" : "bg-line"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "start-[1.4rem]" : "start-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { t, lang } = useI18n();
  const { settings: s, update, reset } = useSettings();

  const themes: { v: ThemeChoice; k: Parameters<typeof t>[0] }[] = [
    { v: "system", k: "settings.themeSystem" },
    { v: "light", k: "settings.themeLight" },
    { v: "dark", k: "settings.themeDark" },
    { v: "sepia", k: "settings.themeSepia" },
  ];

  function toggleTranslation(id: string) {
    const has = s.translations.includes(id);
    const next = has ? s.translations.filter((x) => x !== id) : [...s.translations, id];
    update({ translations: next.slice(0, 3) });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("nav.settings")}</h1>

      <Group title={t("settings.appearance")}>
        <Row label={t("settings.language")}>
          <select className="input" value={s.language} onChange={(e) => update({ language: e.target.value as "en" | "ur" })}>
            <option value="en">English</option>
            <option value="ur">اردو</option>
          </select>
        </Row>
        <Row label={t("settings.theme")}>
          <select className="input" value={s.theme} onChange={(e) => update({ theme: e.target.value as ThemeChoice })}>
            {themes.map((x) => (
              <option key={x.v} value={x.v}>{t(x.k)}</option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.arabicSize")}>
          <input type="range" min={22} max={56} value={s.arabicFontSize} onChange={(e) => update({ arabicFontSize: Number(e.target.value) })} className="w-full accent-[var(--c-brand)]" />
        </Row>
        <Row label={t("settings.urduSize")}>
          <input type="range" min={16} max={36} value={s.urduFontSize} onChange={(e) => update({ urduFontSize: Number(e.target.value) })} className="w-full accent-[var(--c-brand)]" />
        </Row>
        <div className="rounded-xl bg-soft p-4">
          <p className="font-arabic leading-[2.1]" dir="rtl" lang="ar" style={{ fontSize: s.arabicFontSize }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          <p className="font-urdu mt-1 leading-[2.2]" dir="rtl" lang="ur" style={{ fontSize: s.urduFontSize }}>اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے</p>
        </div>
      </Group>

      <Group title={t("settings.quran")}>
        <Row label={t("settings.script")} hint={t("settings.scriptHint")}>
          <select className="input" value={s.script} onChange={(e) => update({ script: e.target.value as "uthmani" | "indopak" })}>
            <option value="uthmani">{t("settings.scriptUthmani")}</option>
            <option value="indopak">{t("settings.scriptIndopak")}</option>
          </select>
        </Row>
        <Row label={t("settings.showTranslation")}>
          <Toggle checked={s.showTranslation} onChange={(v) => update({ showTranslation: v })} label={t("settings.showTranslation")} />
        </Row>
        <div>
          <p className="text-sm">{t("settings.translations")}</p>
          <p className="text-xs text-muted">{t("settings.translationsHint")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TRANSLATIONS.map((tr) => (
              <button key={tr.id} type="button" className="chip" data-active={s.translations.includes(tr.id)} onClick={() => toggleTranslation(tr.id)}>
                {lang === "ur" && tr.nameUr ? tr.nameUr : tr.name}
              </button>
            ))}
          </div>
        </div>
        <Row label={t("settings.tafsir")}>
          <select className="input" value={s.tafsirId} onChange={(e) => update({ tafsirId: Number(e.target.value) })}>
            {TAFSIRS.map((x) => (
              <option key={x.id} value={x.id}>{lang === "ur" ? x.nameUr : x.name}</option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.reciter")}>
          <select className="input" value={s.reciter} onChange={(e) => update({ reciter: e.target.value })}>
            {RECITERS.map((x) => (
              <option key={x.id} value={x.id}>{lang === "ur" ? x.nameUr : x.name}</option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.speed")}>
          <select className="input" value={s.playbackRate} onChange={(e) => update({ playbackRate: Number(e.target.value) })}>
            {[0.75, 1, 1.25, 1.5].map((v) => (
              <option key={v} value={v}>{v}×</option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.repeat")}>
          <select className="input" value={s.repeat} onChange={(e) => update({ repeat: Number(e.target.value) })}>
            {[1, 2, 3, 5, 10].map((v) => (
              <option key={v} value={v}>{v}×</option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.dailyGoal")} hint={t("settings.dailyGoalHint")}>
          <input className="input" type="number" min={1} max={500} value={s.dailyGoalAyahs} onChange={(e) => update({ dailyGoalAyahs: Math.max(1, Math.min(500, Number(e.target.value) || 1)) })} />
        </Row>
      </Group>

      <Group title={t("settings.prayer")}>
        <Row label={t("prayer.city")}>
          <select className="input" value={s.cityKey} onChange={(e) => update({ cityKey: e.target.value })}>
            {s.cityKey === "device" && <option value="device">{lang === "ur" ? "میرا مقام" : "My location"}</option>}
            {CITIES.map((c) => (
              <option key={c.key} value={c.key}>{lang === "ur" ? c.ur : c.en}</option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.method")}>
          <select className="input" value={s.prayerMethod} onChange={(e) => update({ prayerMethod: e.target.value })}>
            {METHODS.map((m) => (
              <option key={m.key} value={m.key}>{lang === "ur" ? m.ur : m.en}</option>
            ))}
          </select>
        </Row>
        <Row label={t("settings.asr")} hint={t("settings.asrHint")}>
          <select className="input" value={s.asr} onChange={(e) => update({ asr: e.target.value as "later" | "standard" })}>
            <option value="later">{t("settings.asrLater")}</option>
            <option value="standard">{t("settings.asrStandard")}</option>
          </select>
        </Row>
        <Row label={t("settings.hijriAdjust")} hint={t("settings.hijriHint")}>
          <select className="input" value={s.hijriAdjust} onChange={(e) => update({ hijriAdjust: Number(e.target.value) })}>
            {[-2, -1, 0, 1, 2].map((v) => (
              <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>
            ))}
          </select>
        </Row>
      </Group>

      <Group title={t("settings.app")}>
        <Row label={t("settings.install")} hint={t("settings.installBody")}>
          <InstallButton />
        </Row>
      </Group>

      <div className="mt-6 flex justify-end">
        <button className="btn btn-ghost" onClick={reset}>{t("settings.reset")}</button>
      </div>
    </div>
  );
}
