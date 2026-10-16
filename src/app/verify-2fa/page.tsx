"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Verify2faPage() {
  const { t } = useI18n();
  const router = useRouter();
  const sb = supabaseBrowser();
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.mfa.listFactors();
      const f = data?.totp?.[0];
      if (f) setFactorId(f.id);
      else router.replace("/");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) return setErr(t("twofa.wrong"));
    router.replace("/");
    router.refresh();
  }

  async function signOut() {
    await sb.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Logo />
      <form onSubmit={submit} className="card mt-6 w-full max-w-sm space-y-4 !p-6">
        <h1 className="text-xl font-semibold">{t("twofa.verifyTitle")}</h1>
        <p className="text-sm text-muted">{t("twofa.verifyBody")}</p>
        <input
          className="input text-center text-xl tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          dir="ltr"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
        />
        {err && <p className="text-sm text-danger">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy || code.length !== 6 || !factorId}>
          {t("twofa.verify")}
        </button>
        <button type="button" className="btn btn-quiet w-full" onClick={signOut}>
          {t("nav.signout")}
        </button>
      </form>
    </div>
  );
}
