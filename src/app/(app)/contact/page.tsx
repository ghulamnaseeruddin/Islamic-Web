"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

type Errs = Partial<Record<"name" | "email" | "phone" | "message" | "form", string>>;

export default function ContactPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Fill name and email from the account (the user can change them).
  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) return;
      setEmail((v) => v || u.user?.email || "");
      const { data: p } = await sb.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle();
      setName((v) => v || p?.full_name || "");
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errs = {};
    if (name.trim().length < 2) er.name = t("contact.eName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) er.email = t("contact.eEmail");
    if (phone.trim() && !/^[+\d][\d\s-]{6,19}$/.test(phone.trim())) er.phone = t("contact.ePhone");
    if (message.trim().length < 10) er.message = t("contact.eMessage");
    setErrs(er);
    if (Object.keys(er).length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      if (res.status === 429) setErrs({ form: t("contact.eLimit") });
      else if (!res.ok) setErrs({ form: t("contact.eSend") });
      else {
        setDone(true);
        setMessage("");
      }
    } catch {
      setErrs({ form: t("contact.eSend") });
    }
    setBusy(false);
  }

  if (done)
    return (
      <div className="mx-auto max-w-lg">
        <div className="card py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soft text-2xl text-brand">✓</div>
          <h1 className="text-xl font-semibold">{t("contact.thanksTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("contact.thanksBody")}</p>
          <button className="btn btn-primary mt-6" onClick={() => setDone(false)}>{t("contact.another")}</button>
        </div>
      </div>
    );

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-brand px-6 py-8 text-brand-ink sm:px-10 sm:py-10">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t("contact.title")}</h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">{t("contact.subtitle")}</p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <form onSubmit={submit} noValidate className="card space-y-4">
          <div>
            <label className="label" htmlFor="c-name">{t("contact.name")}</label>
            <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} />
            {errs.name && <p className="mt-1 text-xs text-danger">{errs.name}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-email">{t("contact.email")}</label>
              <input id="c-email" type="email" dir="ltr" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} />
              {errs.email && <p className="mt-1 text-xs text-danger">{errs.email}</p>}
            </div>
            <div>
              <label className="label" htmlFor="c-phone">
                {t("contact.phone")} <span className="font-normal text-muted">{t("contact.optional")}</span>
              </label>
              <input id="c-phone" type="tel" dir="ltr" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+92 300 1234567" maxLength={30} />
              {errs.phone && <p className="mt-1 text-xs text-danger">{errs.phone}</p>}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-msg">{t("contact.message")}</label>
            {/* dir="auto": English types left-to-right, Urdu types right-to-left, by itself */}
            <textarea id="c-msg" dir="auto" className="input min-h-40 font-urdu" style={{ lineHeight: 2 }} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} placeholder={t("contact.placeholder")} />
            <div className="flex justify-between text-xs text-muted">
              <span className="text-danger">{errs.message}</span>
              <span dir="ltr">{message.length} / 2000</span>
            </div>
          </div>
          {errs.form && <p className="text-sm text-danger">{errs.form}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? t("contact.sending") : t("contact.send")}</button>
        </form>

        <aside className="space-y-3">
          {(["a", "b", "c"] as const).map((k) => (
            <div key={k} className="card !bg-soft !border-transparent">
              <h2 className="text-sm font-semibold">{t(`contact.side${k.toUpperCase()}Title` as "contact.sideATitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t(`contact.side${k.toUpperCase()}Body` as "contact.sideABody")}</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}