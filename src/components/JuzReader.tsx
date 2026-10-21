"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { NoteDialog, ReportDialog } from "@/components/ItemActions";
import { ShareAyahDialog } from "@/components/ShareAyahDialog";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { useBookmarks } from "@/lib/saved";
import { supabaseBrowser } from "@/lib/supabase/client";
import { fetchJuz, fetchTafsir, rukuMarks, type JuzItem } from "@/lib/quran/api";
import { TAFSIRS, translationName } from "@/lib/quran/editions";
import { JUZ, juzAyahCount, juzRange } from "@/lib/quran/juz";
import { getSurah } from "@/lib/quran/surahs";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

function arabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in the user's time zone
}

function surahEn(n: number) {
  return getSurah(n)?.en ?? String(n);
}

/** Reads one juz (para): only its verses, from its first to its last, across surahs. */
export function JuzReader({ juz }: { juz: number }) {
  const { t, lang } = useI18n();
  const { settings, ready, update } = useSettings();
  const info = JUZ[juz - 1];
  const range = juzRange(juz);
  const { refs: bookmarks, toggle } = useBookmarks("quran");

  const [items, setItems] = useState<JuzItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [noteFor, setNoteFor] = useState<JuzItem | null>(null);
  const [reportFor, setReportFor] = useState<JuzItem | null>(null);
  const [shareFor, setShareFor] = useState<JuzItem | null>(null);
  const [tafsirOpen, setTafsirOpen] = useState<string | null>(null);
  const [tafsirCache, setTafsirCache] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  const [playing, setPlaying] = useState<number | null>(null); // index in items
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repeatLeft = useRef(1);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const itemsRef = useRef<JuzItem[] | null>(null);
  itemsRef.current = items;

  const transKey = settings.translations.join(",");
  const rukus = items ? rukuMarks(items) : { starts: new Map<number, { no: number; len: number }>(), total: 0 };

  // Load the juz
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchJuz(juz, settings.translations, settings.reciter, settings.script)
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setLoading(false);
        const hash = window.location.hash;
        if (hash.startsWith("#a")) {
          setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "center" }), 150);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juz, ready, transKey, settings.reciter, settings.script, attempt]);

  // Start from the top when a new juz opens, and stop audio when leaving
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setItems(null);
    setPlaying(null);
    setIsPlaying(false);
    setTafsirOpen(null);
    return () => {
      audioRef.current?.pause();
    };
  }, [juz]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = settings.playbackRate;
  }, [settings.playbackRate]);

  const start = useCallback((i: number, resetRepeat = true) => {
    const list = itemsRef.current;
    const url = list?.[i]?.audio;
    if (!list || !url) return;
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
        start(i, false);
      } else if (i < list.length - 1) {
        start(i + 1, true); // continues into the next surah inside the juz
      } else {
        setPlaying(null);
        setIsPlaying(false);
      }
    };
    a.src = url;
    a.playbackRate = settingsRef.current.playbackRate;
    a.play().catch(() => setIsPlaying(false));
    setPlaying(i);
    const it = list[i];
    document.getElementById(`a${it.surah}-${it.n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  function togglePlayPause() {
    const a = audioRef.current;
    if (playing == null) return start(0);
    if (!a) return;
    if (isPlaying) a.pause();
    else a.play().catch(() => {});
  }

  function stopPlayer() {
    audioRef.current?.pause();
    setPlaying(null);
    setIsPlaying(false);
  }

  async function openTafsir(it: JuzItem) {
    const id = `${it.surah}:${it.n}`;
    if (tafsirOpen === id) return setTafsirOpen(null);
    setTafsirOpen(id);
    const key = `${settings.tafsirId}:${id}`;
    if (tafsirCache[key] !== undefined) return;
    setTafsirCache((c) => ({ ...c, [key]: "__loading" }));
    try {
      const text = await fetchTafsir(settings.tafsirId, it.surah, it.n);
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
    const [s, n] = tafsirOpen.split(":").map(Number);
    setTafsirCache((c) => ({ ...c, [key]: "__loading" }));
    fetchTafsir(settings.tafsirId, s, n)
      .then((text) => setTafsirCache((c) => ({ ...c, [key]: text || "__empty" })))
      .catch(() => setTafsirCache((c) => ({ ...c, [key]: "__error" })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.tafsirId]);

  async function copyAyah(it: JuzItem) {
    const trans = it.translations.map((tr) => tr.text).join("\n");
    try {
      await navigator.clipboard.writeText(`${it.arabic}\n${trans}\n— ${surahEn(it.surah)} ${it.surah}:${it.n}`);
      setCopied(`${it.surah}:${it.n}`);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  async function markLastRead(it: JuzItem) {
    const sb = supabaseBrowser();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    await sb
      .from("reading_progress")
      .upsert({ user_id: user.id, surah: it.surah, ayah: it.n, updated_at: new Date().toISOString() });
    setSavedMsg(t("quran.savedProgress", { n: it.n }));
    setTimeout(() => setSavedMsg(""), 2000);
  }

  async function finishJuz() {
    if (!items || items.length === 0) return;
    const sb = supabaseBrowser();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    const day = todayKey();
    const { data: existing } = await sb.from("reading_log").select("ayahs").eq("day", day).maybeSingle();
    const total = (existing?.ayahs ?? 0) + items.length;
    await sb.from("reading_log").upsert({ user_id: user.id, day, ayahs: total });
    const lastItem = items[items.length - 1];
    await sb
      .from("reading_progress")
      .upsert({ user_id: user.id, surah: lastItem.surah, ayah: lastItem.n, updated_at: new Date().toISOString() });
    setSavedMsg(t("quran.finishedSaved"));
    setTimeout(() => setSavedMsg(""), 2500);
  }

  const bumpFont = (d: number) => update({ arabicFontSize: Math.min(56, Math.max(22, settings.arabicFontSize + d)) });

  const prev = juz > 1 ? juz - 1 : null;
  const next = juz < 30 ? juz + 1 : null;
  const tafsirMeta = TAFSIRS.find((x) => x.id === settings.tafsirId);
  const startLabel = `${surahEn(range.from.surah)} ${range.from.surah}:${range.from.ayah}`;
  const endLabel = `${surahEn(range.to.surah)} ${range.to.surah}:${range.to.ayah}`;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        {prev ? (
          <Link href={`/quran/juz/${prev}`} className="icon-btn" aria-label={t("quran.prevJuz")}>
            <Icon name="chevronRight" className="h-5 w-5 rotate-180 rtl:rotate-0" />
          </Link>
        ) : (
          <span className="h-9 w-9" />
        )}
        <div className="min-w-0 text-center">
          <p className="font-arabic text-3xl leading-[2]" dir="rtl" lang="ar">{info.name}</p>
          <p className="text-sm font-medium">{t("quran.juz", { n: juz })}</p>
          <p className="text-xs text-muted">
            {t("quran.ayahsCount", { n: juzAyahCount(juz) })}
            {rukus.total > 0 ? ` · ${t("quran.rukusCount", { n: rukus.total })}` : ""}
          </p>
        </div>
        {next ? (
          <Link href={`/quran/juz/${next}`} className="icon-btn" aria-label={t("quran.nextJuz")}>
            <Icon name="chevronRight" className="h-5 w-5 rtl:rotate-180" />
          </Link>
        ) : (
          <span className="h-9 w-9" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted" dir="ltr">
        <span>{t("quran.startsAt")}: <b className="font-medium text-ink">{startLabel}</b></span>
        <span>{t("quran.endsAt")}: <b className="font-medium text-ink">{endLabel}</b></span>
      </div>

      {/* Tools */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-primary" onClick={() => start(0)} disabled={!items}>
          <Icon name="play" className="h-4 w-4" filled /> {t("quran.playJuz")}
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
        <Link href="/settings" className="chip">
          <Icon name="settings" className="h-3.5 w-3.5" /> {t("nav.settings")}
        </Link>
      </div>

      <div className="divider-ornament my-6" />

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

      {items && !loading && (
        <ol className="space-y-4">
          {items.map((it, i) => {
            const n = it.n;
            const ref = `${it.surah}:${n}`;
            const isCurrent = playing === i;
            const key = `${settings.tafsirId}:${ref}`;
            const tafsirState = tafsirCache[key];
            const sm = getSurah(it.surah);
            const newSurah = i === 0 || items[i - 1].surah !== it.surah;
            const rukuStart = rukus.starts.get(i);
            return (
              <li key={ref} className="list-none">
                {newSurah && (
                  <div className="mb-4 mt-2 text-center">
                    <div className="divider-ornament mb-3" />
                    <p className="font-arabic text-3xl leading-[2]" dir="rtl" lang="ar">{sm?.ar}</p>
                    <p className="text-sm text-muted" dir="ltr">
                      {it.surah}. {sm?.en}
                    </p>
                    {n === 1 && it.surah !== 1 && it.surah !== 9 && (
                      <p className="mt-3 font-arabic text-3xl leading-[2]" dir="rtl" lang="ar">
                        {BISMILLAH}
                      </p>
                    )}
                  </div>
                )}
                {rukuStart && (
                  <div className="mb-3 flex items-center gap-3 text-xs text-muted">
                    <span className="h-px flex-1 bg-line" />
                    <span className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
                      <span className="font-arabic text-base text-accent" lang="ar">ع</span>
                      <span>{t("quran.ruku", { n: rukuStart.no })}</span>
                      <span>·</span>
                      <span>{t("quran.ayahsCount", { n: rukuStart.len })}</span>
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                )}
                <div
                  id={`a${it.surah}-${n}`}
                  className={`card scroll-mt-24 transition ${isCurrent ? "!border-brand bg-soft" : ""}`}
                >
                  <p
                    dir="rtl"
                    lang="ar"
                    className={`text-right ${settings.script === "indopak" ? "font-urdu" : "font-arabic"}`}
                    style={{
                      fontSize: settings.script === "indopak" ? settings.arabicFontSize * 0.8 : settings.arabicFontSize,
                      lineHeight: settings.script === "indopak" ? 2.6 : 2.15,
                    }}
                  >
                    {it.arabic}{" "}
                    <span className="text-accent" style={{ fontSize: "0.7em" }}>
                      ﴿{arabicDigits(n)}﴾
                    </span>
                  </p>

                  {settings.showTranslation &&
                    it.translations.map((tr) => {
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
                            {tr.text}
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
                      {sm?.en} {ref}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      data-active={isCurrent && isPlaying}
                      onClick={() => (isCurrent && isPlaying ? audioRef.current?.pause() : start(i))}
                      aria-label={t("quran.play")}
                      disabled={!it.audio}
                    >
                      <Icon name={isCurrent && isPlaying ? "pause" : "play"} className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      data-active={bookmarks.has(ref)}
                      onClick={() => toggle(ref, `${sm?.en} ${ref}`)}
                      aria-label={t("common.bookmark")}
                    >
                      <Icon name="bookmark" className="h-4 w-4" filled={bookmarks.has(ref)} />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => setNoteFor(it)} aria-label={t("note.title")}>
                      <Icon name="note" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      data-active={tafsirOpen === ref}
                      onClick={() => openTafsir(it)}
                      aria-label={t("quran.tafsir")}
                    >
                      <Icon name="library" className="h-4 w-4" />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => copyAyah(it)} aria-label={t("common.copy")}>
                      <Icon name={copied === ref ? "check" : "copy"} className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setShareFor(it)}
                      aria-label={t("share.title")}
                      title={t("share.title")}
                    >
                      <Icon name="share" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => markLastRead(it)}
                      aria-label={t("quran.markLastRead")}
                      title={t("quran.markLastRead")}
                    >
                      <Icon name="mapPin" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn ms-auto"
                      onClick={() => setReportFor(it)}
                      aria-label={t("report.title")}
                    >
                      <Icon name="flag" className="h-4 w-4" />
                    </button>
                  </div>

                  {tafsirOpen === ref && (
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
                      {(tafsirState === undefined || tafsirState === "__loading") && <span className="spinner" />}
                      {tafsirState === "__error" && <p className="text-sm text-muted">{t("quran.tafsirError")}</p>}
                      {tafsirState === "__empty" && <p className="text-sm text-muted">{t("quran.tafsirEmpty")}</p>}
                      {tafsirState && !tafsirState.startsWith("__") && (
                        <div
                          className={`whitespace-pre-wrap ${
                            tafsirMeta?.lang === "ur" ? "font-urdu" : tafsirMeta?.lang === "ar" ? "font-arabic" : ""
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
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {items && !loading && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={finishJuz}>
            <Icon name="check" className="h-4 w-4" /> {t("quran.finishedJuz")}
          </button>
          {savedMsg && <p className="text-sm text-brand">{savedMsg}</p>}
          <div className="flex gap-2">
            {prev && (
              <Link href={`/quran/juz/${prev}`} className="btn btn-ghost">
                {t("quran.prevJuz")}
              </Link>
            )}
            {next && (
              <Link href={`/quran/juz/${next}`} className="btn btn-ghost">
                {t("quran.nextJuz")}
              </Link>
            )}
          </div>
        </div>
      )}

      {savedMsg && items && (
        <p className="fixed bottom-24 start-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-xs text-bg shadow-lg lg:bottom-6">
          {savedMsg}
        </p>
      )}

      {/* Audio player */}
      {playing != null && items && items[playing] && (
        <div className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-line bg-surface p-2 shadow-xl lg:bottom-4">
          <button
            type="button"
            className="icon-btn"
            onClick={() => playing > 0 && start(playing - 1)}
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
            onClick={() => playing < items.length - 1 && start(playing + 1)}
            aria-label={t("common.next")}
          >
            <Icon name="next" className="h-4 w-4" />
          </button>
          <span className="min-w-0 flex-1 truncate px-1 text-xs text-muted" dir="ltr">
            {surahEn(items[playing].surah)} · {items[playing].surah}:{items[playing].n}
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
        itemRef={`${noteFor?.surah ?? 0}:${noteFor?.n ?? 0}`}
        title={noteFor ? `${surahEn(noteFor.surah)} ${noteFor.surah}:${noteFor.n}` : ""}
      />
      <ReportDialog
        open={reportFor != null}
        onClose={() => setReportFor(null)}
        itemType="quran"
        itemRef={`${reportFor?.surah ?? 0}:${reportFor?.n ?? 0}`}
      />
      {shareFor != null && (() => {
        const tr = shareFor.translations[0];
        return (
          <ShareAyahDialog
            open
            onClose={() => setShareFor(null)}
            arabic={shareFor.arabic}
            translation={tr?.text}
            translationIsUrdu={tr?.id.startsWith("ur.")}
            reference={`${surahEn(shareFor.surah)} ${shareFor.surah}:${shareFor.n}`}
          />
        );
      })()}
    </div>
  );
}