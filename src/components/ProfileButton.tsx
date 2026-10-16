"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AppUser } from "@/components/AppShell";

/** The round button at the top right. It replaces "Sign in" once you are logged in. */
export function ProfileButton({ user }: { user: AppUser }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const item =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-soft";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line bg-brand text-sm font-semibold text-brand-ink"
        aria-label={t("nav.profile")}
        aria-expanded={open}
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-12 z-50 w-64 rounded-2xl border border-line bg-surface p-2 shadow-xl">
          <Link href="/profile" onClick={() => setOpen(false)} className="mb-1 block rounded-xl p-3 hover:bg-soft">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted" dir="ltr">
              {user.email}
            </p>
          </Link>
          <div className="my-1 h-px bg-line" />
          <Link href="/profile" onClick={() => setOpen(false)} className={item}>
            <Icon name="user" className="h-4 w-4" /> {t("nav.profile")}
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)} className={item}>
            <Icon name="settings" className="h-4 w-4" /> {t("nav.settings")}
          </Link>
          <Link href="/saved" onClick={() => setOpen(false)} className={item}>
            <Icon name="bookmark" className="h-4 w-4" /> {t("nav.saved")}
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" onClick={() => setOpen(false)} className={item}>
              <Icon name="shield" className="h-4 w-4" /> {t("nav.admin")}
            </Link>
          )}
          <div className="my-1 h-px bg-line" />
          <button type="button" onClick={signOut} className={`${item} text-danger`}>
            <Icon name="logout" className="h-4 w-4" /> {t("nav.signout")}
          </button>
        </div>
      )}
    </div>
  );
}
