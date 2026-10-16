"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { NoteDialog, ReportDialog } from "@/components/ItemActions";
import { ShareAyahDialog } from "@/components/ShareAyahDialog";
import { getOffline, saveOffline } from "@/lib/offline";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { useBookmarks } from "@/lib/saved";
import { supabaseBrowser } from "@/lib/supabase/client";
import { fetchSurah, fetchTafsir, type SurahData } from "@/lib/quran/api";
import { TAFSIRS, translationName } from "@/lib/quran/editions";
import { getSurah } from "@/lib/quran/surahs";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

function arabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in the user's time zone
}

export function QuranReader({ surah }: { surah: number }) {
  const { t, lang } = useI18n();
  const { settings, ready, update } = useSettings();
  const meta = getSurah(surah)!;
  const { refs: bookmarks, toggle } = useBookmarks("quran", `${surah}:`);

  const [data, setData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [reportFor, setReportFor] = useState<number | null>(null);
  const [shareFor, setShareFor] = useState<number | null>(null);
  const [offlineMsg, setOfflineMsg] = useState("");
  const [tafsirOpen, setTafsirOpen] = useState<number | null>(null);
  const [tafsirCache, setTafsirCache] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<number | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  const [playing, setPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repeatLeft = useRef(1);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const dataRef = useRef<SurahData | null>(null);
  dataRef.current = data;

  const transKey = settings.translations.join(",");

  // Load the surah
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchSurah(surah, settings.translations, settings.reciter, settings.script)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
        const hash = window.location.hash;
        if (hash.startsWith("#a")) {
          setTimeout(
            () => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "center" }),
            150,
          );
        }
      })
      .catch(async () => {
        const off = await getOffline(surah).catch(() => null);
        if (cancelled) return;
        if (off) {
          setData(off.data);
          setOfflineMsg(t("offline.usingSaved"));
        } else setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah, ready, transKey, settings.reciter, settings.script, attempt]);

  // Stop audio when leaving
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, [surah]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = settings.playbackRate;
  }, [settings.playbackRate]);

  const start = useCallback(
    (n: number, resetRepeat = true) => {
      const url = dataRef.current?.audio[n];
      if (!url) return;
      if (resetRepeat) repeatLeft.current = settingsRef.current.repeat;
      if (!audioRef.current) {
        const a = new Audio();
        a.onplay = () => setIsPlaying(true);
        a.onpause = () => setIsPlaying(false);
        audioRef.current = a;
      }
      const a = audioRef.current;
      a.onended = () => {
        if (repeatLeft.current > 1) {
          repeatLeft.current -= 1;
          start(n, false);
        } else if (n < meta.ayahs) {
          start(n + 1, true);
        } else {
          setPlaying(null);
          setIsPlaying(false);
        }
      };
      a.src = url;
      a.playbackRate = settingsRef.current.playbackRate;
      a.play().catch(() => setIsPlaying(false));
      setPlaying(n);
      document.getElementById(`a${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [meta.ayahs],
  );

  function togglePlayPause() {
    const a = audioRef.current;
    if (playing == null) return start(1);
    if (!a) return;
    if (isPlaying) a.pause();
    else a.play().catch(() => {});
  }

  function stopPlayer() {
    audioRef.current?.pause();
    setPlaying(null);
    setIsPlaying(false);
  }

  async function openTafsir(n: number) {
    if (tafsirOpen === n) return setTafsirOpen(null);
    setTafsirOpen(n);
    const key = `${settings.tafsirId}:${n}`;
    if (tafsirCache[key] !== undefined) return;
    setTafsirCache((c) => ({ ...c, [key]: "__loading" }));
    try {
      const text = await fetchTafsir(settings.tafsirId, surah, n);
      setTafsirCache((c) => ({ ...c, [key]: text || "__empty" }));
    } catch {
      setTafsirCache((c) => ({ ...c, [key]: "__error" }));
    }
  }

  // reload tafsir if the user changes the tafsir while one is open
  useEffect(() => {
    if (tafsirOpen == null) return;
    const key = `${settings.tafsirId}:${tafsirOpen}`;
    if (tafsirCache[key] !== undefined) return;
    setTafsirCache((c) => ({ ...c, [key]: "__loading" }));
    fetchTafsir(settings.tafsirId, surah, tafsirOpen)
      .then((text) => setTafsirCache((c) => ({ ...c, [key]: text || "__empty" })))
      .catch(() => setTafsirCache((c) => ({ ...c, [key]: "__error" })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.tafsirId]);

  async function copyAyah(n: number) {
    if (!data) return;
    const ar = data.arabic.find((a) => a.numberInSurah === n)?.text ?? "";
    const trans = data.translations
      .map((tr) => tr.ayahs.find((a) => a.numberInSurah === n)?.text)
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(`${ar}\n${trans}\n— ${meta.en} ${surah}:${n}`);
      setCopied(n);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  async function markLastRead(n: number) {
    const sb = supabaseBrowser();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    await sb
      .from("reading_progress")
      .upsert({ user_id: user.id, surah, ayah: n, updated_at: new Date().toISOString() });
    setSavedMsg(t("quran.savedProgress", { n }));
    setTimeout(() => setSavedMsg(""), 2000);
  }

  async function finishSurah() {
    const sb = supabaseBrowser();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    const day = todayKey();
    const { data: existing } = await sb
      .from("reading_log")
      .select("ayahs")
      .eq("day", day)
      .maybeSingle();
    const total = (existing?.ayahs ?? 0) + meta.ayahs;
    await sb.from("reading_log").upsert({ user_id: user.id, day, ayahs: total });
    await sb
      .from("reading_progress")
      .upsert({ user_id: user.id, surah, ayah: meta.ayahs, updated_at: new Date().toISOString() });
    setSavedMsg(t("quran.finishedSaved"));
    setTimeout(() => setSavedMsg(""), 2500);
  }

  const bumpFont = (d: number) =>
    update({ arabicFontSize: Math.min(56, Math.max(22, settings.arabicFontSize + d)) });

  const prev = surah > 1 ? surah - 1 : null;
  const next = surah < 114 ? surah + 1 : null;
  const tafsirMeta = TAFSIRS.find((x) => x.id === settings.tafsirId);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        {prev ? (
          <Link href={`/quran/${prev}`} className="icon-btn" aria-label={t("quran.prevSurah")}>
            <Icon name="chevronRight" className="h-5 w-5 rotate-180 rtl:rotate-0" />
          </Link>
        ) : (
          <span className="h-9 w-9" />
        )}
        <div className="text-center">
          <p className="font-arabic text-3xl leading-[2]">{meta.ar}</p>
          <p className="text-sm text-muted" dir="ltr">
            {surah}. {meta.en} · {t("quran.ayahsCount", { n: meta.ayahs })}
          </p>
        </div>
        {next ? (
          <Link href={`/quran/${next}`} className="icon-btn" aria-label={t("quran.nextSurah")}>
            <Icon name="chevronRight" className="h-5 w-5 rtl:rotate-180" />
          </Link>
        ) : (
          <span className="h-9 w-9" />
        )}
      </div>

      {/* Tools */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => start(1)} disabled={!data}>
          <Icon name="play" className="h-4 w-4" filled /> {t("quran.playSurah")}
        </button>
        <button type="button" className="chip" onClick={() => bumpFont(-2)} aria-label="Smaller">
          A−
        </button>
        <button type="button" className="chip" onClick={() => bumpFont(2)} aria-label="Larger">
          A+
        </button>
        <button
          type="button"
          className="chip"
          data-active={settings.showTranslation}
          onClick={() => update({ showTranslation: !settings.showTranslation })}
        >
          {t("quran.translation")}
        </button>
        <Link href={`/quran/${surah}/study`} className="chip">
          {t("study.open")}
        </Link>
        <button
          type="button"
          className="chip"
          disabled={!data}
          onClick={async () => {
            if (!data) return;
            try {
              await saveOffline(surah, data, settings.translations);
              setOfflineMsg(t("offline.saved"));
            } catch {
              setOfflineMsg(t("offline.failed"));
            }
          }}
        >
          {t("offline.save")}
        </button>
        <Link href="/settings" className="chip">
          <Icon name="settings" className="h-3.5 w-3.5" /> {t("nav.settings")}
        </Link>
      </div>
      {offlineMsg && <p className="mt-2 text-center text-xs text-muted">{offlineMsg}</p>}

      <div className="divider-ornament my-6" />

      {surah !== 1 && surah !== 9 && (
        <p className="mb-6 text-center font-arabic text-3xl leading-[2]" dir="rtl" lang="ar">
          {BISMILLAH}
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <span className="spinner" />
        </div>
      )}

      {error && (
        <div className="card text-center">
          <p className="text-sm text-muted">{t("quran.loadError")}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => setAttempt((a) => a + 1)}>
            <Icon name="refresh" className="h-4 w-4" /> {t("common.retry")}
          </button>
        </div>
      )}

      {data && !loading && (
        <ol className="space-y-4">
          {data.arabic.map((a) => {
            const n = a.numberInSurah;
            const ref = `${surah}:${n}`;
            const isCurrent = playing === n;
            const key = `${settings.tafsirId}:${n}`;
            const tafsirState = tafsirCache[key];
            return (
              <li
                key={a.number}
                id={`a${n}`}
                className={`card scroll-mt-24 transition ${isCurrent ? "!border-brand bg-soft" : ""}`}
              >
                <p
                  dir="rtl"
                  lang="ar"
                  className={`text-right ${settings.script === "indopak" ? "font-urdu" : "font-arabic"}`}
                  style={{ fontSize: settings.script === "indopak" ? settings.arabicFontSize * 0.8 : settings.arabicFontSize, lineHeight: settings.script === "indopak" ? 2.6 : 2.15 }}
                >
                  {a.text}{" "}
                  <span className="text-accent" style={{ fontSize: "0.7em" }}>
                    ﴿{arabicDigits(n)}﴾
                  </span>
                </p>

                {settings.showTranslation &&
                  data.translations.map((tr) => {
                    const text = tr.ayahs.find((x) => x.numberInSurah === n)?.text;
                    if (!text) return null;
                    const isUrdu = tr.id.startsWith("ur.");
                    return (
                      <div key={tr.id} className="mt-3 border-t border-line pt-3">
                        <p
                          dir={isUrdu ? "rtl" : "ltr"}
                          lang={isUrdu ? "ur" : "en"}
                          className={isUrdu ? "font-urdu" : ""}
                          style={
                            isUrdu
                              ? { fontSize: settings.urduFontSize, lineHeight: 2.4 }
                              : { fontSize: 16, lineHeight: 1.7 }
                          }
                        >
                          {text}
                        </p>
                        <p className="mt-1 text-[11px] text-muted" dir="ltr">
                          {translationName(tr.id, "en")}
                        </p>
                      </div>
                    );
                  })}

                {/* Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-0.5 border-t border-line pt-2">
                  <span className="me-2 text-xs text-muted" dir="ltr">
                    {ref}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    data-active={isCurrent && isPlaying}
                    onClick={() => (isCurrent && isPlaying ? audioRef.current?.pause() : start(n))}
                    aria-label={t("quran.play")}
                    disabled={!data.audio[n]}
                  >
                    <Icon name={isCurrent && isPlaying ? "pause" : "play"} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    data-active={bookmarks.has(ref)}
                    onClick={() => toggle(ref, `${meta.en} ${ref}`)}
                    aria-label={t("common.bookmark")}
                  >
                    <Icon name="bookmark" className="h-4 w-4" filled={bookmarks.has(ref)} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setNoteFor(n)}
                    aria-label={t("note.title")}
                  >
                    <Icon name="note" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    data-active={tafsirOpen === n}
                    onClick={() => openTafsir(n)}
                    aria-label={t("quran.tafsir")}
                  >
                    <Icon name="library" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => copyAyah(n)}
                    aria-label={t("common.copy")}
                  >
                    <Icon name={copied === n ? "check" : "copy"} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShareFor(n)}
                    aria-label={t("share.title")}
                    title={t("share.title")}
                  >
                    <Icon name="share" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => markLastRead(n)}
                    aria-label={t("quran.markLastRead")}
                    title={t("quran.markLastRead")}
                  >
                    <Icon name="mapPin" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn ms-auto"
                    onClick={() => setReportFor(n)}
                    aria-label={t("report.title")}
                  >
                    <Icon name="flag" className="h-4 w-4" />
                  </button>
                </div>

                {tafsirOpen === n && (
                  <div className="mt-3 rounded-xl bg-soft p-4">
                    <select
                      className="input mb-3 !py-2 text-xs"
                      value={settings.tafsirId}
                      onChange={(e) => update({ tafsirId: Number(e.target.value) })}
                    >
                      {TAFSIRS.map((x) => (
                        <option key={x.id} value={x.id}>
                          {lang === "ur" ? x.nameUr : x.name}
                        </option>
                      ))}
                    </select>
                    {(tafsirState === undefined || tafsirState === "__loading") && (
                      <span className="spinner" />
                    )}
                    {tafsirState === "__error" && (
                      <p className="text-sm text-muted">{t("quran.tafsirError")}</p>
                    )}
                    {tafsirState === "__empty" && (
                      <p className="text-sm text-muted">{t("quran.tafsirEmpty")}</p>
                    )}
                    {tafsirState &&
                      !tafsirState.startsWith("__") && (
                        <div
                          className={`whitespace-pre-wrap ${
                            tafsirMeta?.lang === "ur"
                              ? "font-urdu"
                              : tafsirMeta?.lang === "ar"
                                ? "font-arabic"
                                : ""
                          }`}
                          dir={tafsirMeta?.lang === "en" ? "ltr" : "rtl"}
                          style={{
                            fontSize: tafsirMeta?.lang === "en" ? 15 : settings.urduFontSize - 2,
                            lineHeight: tafsirMeta?.lang === "en" ? 1.75 : 2.3,
                          }}
                        >
                          {tafsirState}
                        </div>
                      )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {data && !loading && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={finishSurah}>
            <Icon name="check" className="h-4 w-4" /> {t("quran.finished")}
          </button>
          {savedMsg && <p className="text-sm text-brand">{savedMsg}</p>}
          <div className="flex gap-2">
            {prev && (
              <Link href={`/quran/${prev}`} className="btn btn-ghost">
                {t("quran.prevSurah")}
              </Link>
            )}
            {next && (
              <Link href={`/quran/${next}`} className="btn btn-ghost">
                {t("quran.nextSurah")}
              </Link>
            )}
          </div>
        </div>
      )}

      {savedMsg && data && (
        <p className="fixed bottom-24 start-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-xs text-bg shadow-lg lg:bottom-6">
          {savedMsg}
        </p>
      )}

      {/* Audio player */}
      {playing != null && (
        <div className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-xl lg:bottom-4">
          <button
            type="button"
            className="icon-btn"
            onClick={() => playing > 1 && start(playing - 1)}
            aria-label={t("common.previous")}
          >
            <Icon name="prev" className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-ink"
            onClick={togglePlayPause}
            aria-label={isPlaying ? t("quran.pause") : t("quran.play")}
          >
            <Icon name={isPlaying ? "pause" : "play"} className="h-4 w-4" filled={!isPlaying} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => playing < meta.ayahs && start(playing + 1)}
            aria-label={t("common.next")}
          >
            <Icon name="next" className="h-4 w-4" />
          </button>
          <span className="min-w-0 flex-1 truncate px-1 text-xs text-muted" dir="ltr">
            {meta.en} · {surah}:{playing}
          </span>
          <select
            className="rounded-lg border border-line bg-surface px-1.5 py-1 text-xs"
            value={settings.playbackRate}
            onChange={(e) => update({ playbackRate: Number(e.target.value) })}
            aria-label={t("settings.speed")}
          >
            {[0.75, 1, 1.25, 1.5].map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-line bg-surface px-1.5 py-1 text-xs"
            value={settings.repeat}
            onChange={(e) => {
              const v = Number(e.target.value);
              update({ repeat: v });
              repeatLeft.current = v;
            }}
            aria-label={t("settings.repeat")}
          >
            {[1, 2, 3, 5, 10].map((r) => (
              <option key={r} value={r}>
                ↻ {r}
              </option>
            ))}
          </select>
          <button type="button" className="icon-btn" onClick={stopPlayer} aria-label={t("common.close")}>
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      )}

      <NoteDialog
        open={noteFor != null}
        onClose={() => setNoteFor(null)}
        kind="quran"
        itemRef={`${surah}:${noteFor ?? 0}`}
        title={`${meta.en} ${surah}:${noteFor ?? ""}`}
      />
      <ReportDialog
        open={reportFor != null}
        onClose={() => setReportFor(null)}
        itemType="quran"
        itemRef={`${surah}:${reportFor ?? 0}`}
      />
      {shareFor != null && data && (() => {
        const tr = data.translations[0];
        return (
          <ShareAyahDialog
            open
            onClose={() => setShareFor(null)}
            arabic={data.arabic.find((x) => x.numberInSurah === shareFor)?.text ?? ""}
            translation={tr?.ayahs.find((x) => x.numberInSurah === shareFor)?.text}
            translationIsUrdu={tr?.id.startsWith("ur.")}
            reference={`${meta.en} ${surah}:${shareFor}`}
          />
        );
      })()}
    </div>
  );
}
