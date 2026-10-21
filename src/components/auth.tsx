"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Top bar of the login pages. Not logged in, so it shows Sign in / Sign up. */
export function AuthHeader() {
  const { t } = useI18n();
  const path = usePathname();
  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-8">
      <Logo />
      <div className="flex items-center gap-2">
        <LangToggle />
        <Link
          href="/login"
          className={`btn ${path === "/login" ? "btn-primary" : "btn-ghost"}`}
        >
          {t("auth.signin")}
        </Link>
        <Link
          href="/signup"
          className={`btn hidden sm:inline-flex ${path === "/signup" ? "btn-primary" : "btn-ghost"}`}
        >
          {t("auth.signup")}
        </Link>
      </div>
    </header>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        className="input pe-11"
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        className="absolute end-1.5 top-1/2 -translate-y-1/2 icon-btn !h-8 !w-8"
        onClick={() => setShow((s) => !s)}
        aria-label="Show or hide password"
      >
        <Icon name={show ? "eyeOff" : "eye"} className="h-4 w-4" />
      </button>
    </div>
  );
}

/** 0 (empty) to 4 (strong) */
export function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export function StrengthMeter({ password }: { password: string }) {
  const { t } = useI18n();
  if (!password) return null;
  const score = passwordScore(password);
  const labels = [t("auth.weak"), t("auth.weak"), t("auth.fair"), t("auth.good"), t("auth.strong")];
  const colors = ["bg-danger", "bg-danger", "bg-accent", "bg-brand", "bg-brand"];
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= score ? colors[score] : "bg-line"}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted">{labels[score]}</span>
    </div>
  );
}

export function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export function GoogleButton({ next = "/" }: { next?: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: {
        // Inside the Windows/Linux app, login finishes in the normal browser and the
        // callback hands a one-time code back to the app (see /auth/callback).
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          navigator.userAgent.includes("NoorUlIlmDesktop") ? "/desktop-auth" : next,
        )}`,
      },
    });
    if (error) setBusy(false);
  }

  return (
    <button type="button" className="btn btn-ghost w-full !py-2.5" onClick={go} disabled={busy}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z" />
      </svg>
      {t("auth.google")}
    </button>
  );
}

export function OrDivider() {
  const { t } = useI18n();
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-line" />
      {t("auth.or")}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}