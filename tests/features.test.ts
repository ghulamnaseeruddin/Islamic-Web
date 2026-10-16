// Checks for the extra features. Run:  npx tsx tests/features.test.ts
import assert from "node:assert/strict";
import { dayRange, refFromIndex, TOTAL_AYAHS } from "../src/lib/khatam";
import { calcZakat } from "../src/lib/zakat";
import { hijriOf, nextOccurrence, ramadanDays } from "../src/lib/hijri";
import { parseTajweed } from "../src/lib/tajweed";
import { NAMES } from "../src/lib/data/names";
import { QUIZ } from "../src/lib/data/quiz";
import { DUAS } from "../src/lib/data/duas";

assert.equal(TOTAL_AYAHS, 6236);
assert.deepEqual(refFromIndex(0), { surah: 1, ayah: 1 });
assert.deepEqual(refFromIndex(7), { surah: 2, ayah: 1 });
assert.deepEqual(refFromIndex(6235), { surah: 114, ayah: 6 });
for (const days of [7, 30, 60, 90]) {
  let sum = 0;
  for (let d = 1; d <= days; d++) sum += dayRange(d, days).count;
  assert.equal(sum, 6236);
  assert.deepEqual(dayRange(days, days).to, { surah: 114, ayah: 6 });
}
assert.equal(NAMES.length, 99);
assert.equal(new Set(NAMES.map((n) => n.tr + n.ar)).size, 99);
for (const q of QUIZ) assert.ok(q.options.length === 4 && q.answer >= 0 && q.answer < 4);
assert.equal(new Set(DUAS.map((d) => d.id)).size, DUAS.length);

const base = { goldGrams: 0, silverGrams: 0, goldPrice: 20000, silverPrice: 250, investments: 0, business: 0, receivables: 0, debts: 0, basis: "silver" as const };
assert.equal(calcZakat({ ...base, cash: 1000000 }).zakat, 25000);
assert.equal(calcZakat({ ...base, cash: 100 }).zakat, 0);
assert.equal(calcZakat({ ...base, cash: 1000000, debts: 900000 }).due, false);
assert.equal(calcZakat({ ...base, cash: 1000000, silverPrice: 0, goldPrice: 0 }).priceMissing, true);

const h = hijriOf(new Date(2026, 9, 16, 12));
assert.ok(h.y >= 1447 && h.m >= 1 && h.m <= 12);
const r = ramadanDays(new Date(2026, 9, 16, 12));
assert.ok(r.length === 29 || r.length === 30);
assert.equal(hijriOf(r[0]).m, 9);
assert.equal(nextOccurrence(10, 1, r[0])!.getTime() > r[r.length - 1].getTime(), true);

assert.deepEqual(parseTajweed("ب<tajweed class=ghunnah>نّ</tajweed><span class=end>١</span>"), [{ text: "ب" }, { text: "نّ", cls: "ghunnah" }]);
console.log("feature tests passed");
