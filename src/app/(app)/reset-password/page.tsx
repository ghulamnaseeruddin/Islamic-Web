"use client";

import Link from "next/link";
import { useState } from "react";
import { PasswordInput, StrengthMeter, passwordScore } from "@/components/auth";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr(t("auth.passwordShort"));
    if (pw !== pw2) return setErr(t("auth.passwordMismatch"));
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setErr(error.message);
    else setDone(true);
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">{t("auth.newPassword")}</h1>
      {done ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted">{t("auth.passwordUpdated")}</p>
          <Link href="/" className="btn btn-primary">{t("nav.home")}</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <PasswordInput value={pw} onChange={setPw} placeholder={t("auth.password")} autoComplete="new-password" />
          <StrengthMeter password={pw} />
          <PasswordInput value={pw2} onChange={setPw2} placeholder={t("auth.confirmPassword")} autoComplete="new-password" />
          {err && <p className="text-sm text-danger">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy || passwordScore(pw) < 1}>
            {t("auth.savePassword")}
          </button>
        </form>
      )}
    </div>
  );
}
