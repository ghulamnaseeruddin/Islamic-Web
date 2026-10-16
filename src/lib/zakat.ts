// Zakat calculator. Nisab is 87.48 g of gold or 612.36 g of silver (scholars use either; the
// silver nisab is lower). Zakat is 2.5% of net wealth held for one lunar year.
export const NISAB_GOLD_G = 87.48;
export const NISAB_SILVER_G = 612.36;
export const ZAKAT_RATE = 0.025;

export type ZakatInput = {
  cash: number;
  goldGrams: number;
  silverGrams: number;
  goldPrice: number; // per gram
  silverPrice: number; // per gram
  investments: number;
  business: number;
  receivables: number;
  debts: number;
  basis: "silver" | "gold";
};

export function calcZakat(i: ZakatInput) {
  const n = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);
  const assets =
    n(i.cash) + n(i.goldGrams) * n(i.goldPrice) + n(i.silverGrams) * n(i.silverPrice) +
    n(i.investments) + n(i.business) + n(i.receivables);
  const net = Math.max(0, assets - n(i.debts));
  const nisab = i.basis === "silver" ? NISAB_SILVER_G * n(i.silverPrice) : NISAB_GOLD_G * n(i.goldPrice);
  const priceMissing = nisab === 0;
  const due = !priceMissing && net >= nisab;
  return { assets, net, nisab, due, priceMissing, zakat: due ? net * ZAKAT_RATE : 0 };
}
