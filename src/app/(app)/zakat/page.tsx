"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { calcZakat, NISAB_GOLD_G, NISAB_SILVER_G, type ZakatInput } from "@/lib/zakat";

const KEY = "noor-zakat-v1";
const EMPTY: ZakatInput = {
  cash: 0, goldGrams: 0, silverGrams: 0, goldPrice: 0, silverPrice: 0,
  investments: 0, business: 0, receivables: 0, debts: 0, basis: "silver",
};

export default function ZakatPage() {
  const { t } = useI18n();
  const [v, setV] = useState<ZakatInput>(EMPTY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setV({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, [v]);

  const r = calcZakat(v);
  const money = (n: number) => Math.round(n).toLocaleString("en-US");

  const field = (key: keyof ZakatInput, label: string, hint?: string) => (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input mt-1"
        inputMode="decimal"
        dir="ltr"
        value={v[key] === 0 ? "" : String(v[key])}
        placeholder="0"
        onChange={(e) => setV({ ...v, [key]: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("zakat.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("zakat.subtitle")}</p>

      <section className="card mt-5 grid gap-4 sm:grid-cols-2">
        <h2 className="text-sm font-semibold text-muted sm:col-span-2">{t("zakat.prices")}</h2>
        {field("goldPrice", t("zakat.goldPrice"))}
        {field("silverPrice", t("zakat.silverPrice"))}
        <label className="block sm:col-span-2">
          <span className="label">{t("zakat.basis")}</span>
          <select className="input mt-1" value={v.basis} onChange={(e) => setV({ ...v, basis: e.target.value as "silver" | "gold" })}>
            <option value="silver">{t("zakat.basisSilver", { g: NISAB_SILVER_G })}</option>
            <option value="gold">{t("zakat.basisGold", { g: NISAB_GOLD_G })}</option>
          </select>
          <span className="text-xs text-muted">{t("zakat.basisHint")}</span>
        </label>
      </section>

      <section className="card mt-4 grid gap-4 sm:grid-cols-2">
        <h2 className="text-sm font-semibold text-muted sm:col-span-2">{t("zakat.assets")}</h2>
        {field("cash", t("zakat.cash"))}
        {field("goldGrams", t("zakat.goldGrams"))}
        {field("silverGrams", t("zakat.silverGrams"))}
        {field("investments", t("zakat.investments"))}
        {field("business", t("zakat.business"))}
        {field("receivables", t("zakat.receivables"))}
      </section>

      <section className="card mt-4 grid gap-4 sm:grid-cols-2">
        <h2 className="text-sm font-semibold text-muted sm:col-span-2">{t("zakat.liabilities")}</h2>
        {field("debts", t("zakat.debts"), t("zakat.debtsHint"))}
      </section>

      <section className="card mt-4 space-y-2">
        <Row label={t("zakat.totalAssets")} value={money(r.assets)} />
        <Row label={t("zakat.net")} value={money(r.net)} />
        <Row label={t("zakat.nisab")} value={r.priceMissing ? "—" : money(r.nisab)} />
        <div className="mt-3 rounded-xl bg-soft p-4 text-center">
          {r.priceMissing ? (
            <p className="text-sm text-muted">{t("zakat.needPrices")}</p>
          ) : r.due ? (
            <>
              <p className="text-xs text-muted">{t("zakat.due")}</p>
              <p className="text-3xl font-semibold tabular-nums" dir="ltr">{money(r.zakat)}</p>
            </>
          ) : (
            <p className="text-sm">{t("zakat.notDue")}</p>
          )}
        </div>
      </section>

      <p className="mt-4 text-xs text-muted">{t("zakat.note")}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums" dir="ltr">{value}</span>
    </div>
  );
}
