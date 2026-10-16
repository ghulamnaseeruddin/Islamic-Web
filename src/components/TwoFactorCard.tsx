"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Turn two-step login (authenticator app) on or off. */
export function TwoFactorCard() {
  const { t } = useI18n();
  const sb = supabaseBrowser();
  const [enabledId, setEnabledId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { data } = await sb.auth.mfa.listFactors();
    setEnabledId(data?.totp?.[0]?.id ?? null); // only verified factors are listed here
    setLoading(false);
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setMsg("");
    setBusy(true);
    // remove half-finished setups first
    const { data: all } = await sb.auth.mfa.listFactors();
    for (const f of all?.all ?? []) if (f.status === "unverified") await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Noor ul Ilm ${Date.now()}` });
    setBusy(false);
    if (error || !data) return setMsg(error?.message || t("common.error"));
    setSetup({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!setup) return;
    setBusy(true);
    setMsg("");
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: setup.id, code: code.trim() });
    setBusy(false);
    if (error) return setMsg(t("twofa.wrong"));
    setSetup(null);
    setCode("");
    setMsg(t("twofa.enabledMsg"));
    refresh();
  }

  async function disable() {
    if (!enabledId || !confirmDisable()) return;
    setBusy(true);
    const { error } = await sb.auth.mfa.unenroll({ factorId: enabledId });
    setBusy(false);
    if (error) return setMsg(error.message);
    setMsg(t("twofa.disabledMsg"));
    refresh();
  }
  const confirmDisable = () => window.confirm(t("twofa.disableConfirm"));

  return (
    <div className="card mt-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted">{t("twofa.title")}</h2>
      <p className="text-sm text-muted">{t("twofa.body")}</p>
      {loading ? (
        <span className="spinner" />
      ) : setup ? (
        <form onSubmit={confirm} className="space-y-3">
          <p className="text-sm">{t("twofa.scan")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="QR code" className="h-44 w-44 rounded-lg bg-white p-2" />
          <p className="text-xs text-muted" dir="ltr">{t("twofa.orType")} <span className="select-all font-mono">{setup.secret}</span></p>
          <input className="input max-w-[12rem] text-center tracking-[0.3em]" inputMode="numeric" maxLength={6} dir="ltr" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy || code.length !== 6}>{t("twofa.verify")}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setSetup(null)}>{t("common.close")}</button>
          </div>
        </form>
      ) : enabledId ? (
        <div className="flex items-center gap-3">
          <span className="chip" data-active="true">{t("twofa.on")}</span>
          <button className="btn btn-danger" onClick={disable} disabled={busy}>{t("twofa.disable")}</button>
        </div>
      ) : (
        <button className="btn btn-ghost" onClick={start} disabled={busy}>{t("twofa.enable")}</button>
      )}
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </div>
  );
}
