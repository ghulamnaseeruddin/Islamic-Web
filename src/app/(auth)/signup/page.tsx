"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleButton,
  OrDivider,
  PasswordInput,
  StrengthMeter,
} from "@/components/auth";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (fullName.trim().length < 2) return setError(t("auth.nameShort"));
    if (password.length < 8) return setError(t("auth.passwordShort"));
    if (password !== confirm) return setError(t("auth.passwordMismatch"));

    setLoading(true);
    const { data, error } = await supabaseBrowser().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already")) setError(t("auth.alreadyRegistered"));
      else setError(error.message);
      return;
    }
    // Supabase does not return an error for an email that already exists. The user has no identities then.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError(t("auth.alreadyRegistered"));
      return;
    }
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card !p-6 text-center sm:!p-8">
        <h1 className="text-2xl font-semibold">{t("auth.checkEmailTitle")}</h1>
        <p className="mt-3 text-sm text-muted">{t("auth.checkEmailBody", { email })}</p>
        <Link href="/login" className="btn btn-primary mt-6">
          {t("auth.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="card !p-6 sm:!p-8">
      <h1 className="text-2xl font-semibold">{t("auth.signupTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("auth.signupSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="fullName">
            {t("auth.fullName")}
          </label>
          <input
            id="fullName"
            className="input"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            {t("auth.email")}
          </label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            dir="ltr"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            {t("auth.password")}
          </label>
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <StrengthMeter password={password} />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            {t("auth.confirmPassword")}
          </label>
          <PasswordInput id="confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>

        {error && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full !py-2.5" disabled={loading}>
          {loading ? <span className="spinner" /> : t("auth.signup")}
        </button>
      </form>

      <OrDivider />
      <GoogleButton />

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          {t("auth.signin")}
        </Link>
      </p>
    </div>
  );
}
