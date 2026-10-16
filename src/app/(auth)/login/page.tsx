"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleButton, OrDivider, PasswordInput, safeNext } from "@/components/auth";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeNext(params.get("next")));
    if (params.get("error")) setError(t("auth.callbackError"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not confirmed")) setError(t("auth.notConfirmed"));
      else if (msg.includes("invalid")) setError(t("auth.invalid"));
      else setError(error.message);
      setLoading(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="card !p-6 sm:!p-8">
      <h1 className="text-2xl font-semibold">{t("auth.loginTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("auth.loginSubtitle")}</p>

      <div className="mt-6">
        <GoogleButton next={next} />
      </div>
      <OrDivider />

      <form onSubmit={onSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">
              {t("auth.password")}
            </label>
            <Link href="/forgot-password" className="mb-1.5 text-xs text-brand hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>

        {error && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full !py-2.5" disabled={loading}>
          {loading ? <span className="spinner" /> : t("auth.signin")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          {t("auth.signup")}
        </Link>
      </p>
    </div>
  );
}
