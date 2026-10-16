"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="card !p-6 sm:!p-8">
      <h1 className="text-2xl font-semibold">{t("auth.forgotTitle")}</h1>
      {sent ? (
        <>
          <p className="mt-3 text-sm text-muted">{t("auth.resetSent")}</p>
          <Link href="/login" className="btn btn-primary mt-6">
            {t("auth.backToLogin")}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">{t("auth.forgotSubtitle")}</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                {t("auth.email")}
              </label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary w-full !py-2.5" disabled={loading}>
              {loading ? <span className="spinner" /> : t("auth.sendReset")}
            </button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link href="/login" className="text-brand hover:underline">
              {t("auth.backToLogin")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
