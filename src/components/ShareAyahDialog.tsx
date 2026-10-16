"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/Dialog";
import { useI18n } from "@/lib/i18n";
import { renderAyahImage, type ShareStyle } from "@/lib/shareImage";

export function ShareAyahDialog({
  open,
  onClose,
  arabic,
  translation,
  translationIsUrdu,
  reference,
}: {
  open: boolean;
  onClose: () => void;
  arabic: string;
  translation?: string;
  translationIsUrdu?: boolean;
  reference: string;
}) {
  const { t } = useI18n();
  const [style, setStyle] = useState<ShareStyle>("green");
  const [withTr, setWithTr] = useState(true);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let made = "";
    setBusy(true);
    setErr(false);
    renderAyahImage({ arabic, translation: withTr ? translation : undefined, translationIsUrdu, reference, style })
      .then((b) => {
        if (cancelled) return;
        made = URL.createObjectURL(b);
        setBlob(b);
        setUrl(made);
      })
      .catch(() => !cancelled && setErr(true))
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [open, arabic, translation, translationIsUrdu, reference, style, withTr]);

  const fileName = `noor-ul-ilm-${reference.replace(/[^\d:]/g, "").replace(":", "-")}.png`;

  function download() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  }
  async function share() {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: reference });
      else download();
    } catch {
      /* cancelled */
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("share.title")}>
      <div className="flex flex-wrap gap-2">
        {(["green", "light", "dark"] as ShareStyle[]).map((s) => (
          <button key={s} className="chip" data-active={style === s} onClick={() => setStyle(s)}>
            {t(s === "green" ? "share.styleGreen" : s === "light" ? "share.styleLight" : "share.styleDark")}
          </button>
        ))}
        {translation && (
          <button className="chip" data-active={withTr} onClick={() => setWithTr(!withTr)}>
            {t("share.withTranslation")}
          </button>
        )}
      </div>
      <div className="mt-4 flex min-h-40 items-center justify-center">
        {busy && <span className="spinner" />}
        {err && <p className="text-sm text-muted">{t("share.error")}</p>}
        {!busy && url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={reference} className="max-h-[50vh] w-full rounded-lg border border-line object-contain" />}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary" onClick={share} disabled={!blob}>{t("share.share")}</button>
        <button className="btn btn-ghost" onClick={download} disabled={!blob}>{t("share.download")}</button>
      </div>
    </Dialog>
  );
}
