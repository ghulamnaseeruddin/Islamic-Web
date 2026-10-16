// Quick checks for the pure logic. Run:  npx tsx tests/logic.test.ts
import assert from "node:assert/strict";
import { SURAHS } from "../src/lib/quran/surahs";
import { stripBismillah } from "../src/lib/quran/api";
import { computeStreak } from "../src/lib/streak";
import { cleanKeywords, cleanRefs, parseJsonLoose } from "../src/lib/ai";

// 114 surahs and 6236 ayahs
assert.equal(SURAHS.length, 114);
assert.equal(SURAHS.reduce((n, s) => n + s.ayahs, 0), 6236);
assert.equal(SURAHS[0].ayahs, 7);
assert.equal(SURAHS[113].ayahs, 6);

// Bismillah is removed from ayah 1 only (not from Al-Fatihah, where it is ayah 1)
const bis = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ";
assert.equal(stripBismillah(1, 1, bis + "x"), bis + "x");
assert.equal(stripBismillah(2, 1, bis + "الٓمٓ").trim(), "الٓمٓ");
assert.equal(stripBismillah(2, 2, "ذَٰلِكَ"), "ذَٰلِكَ");

// streak
const fmt = (d: Date) => d.toLocaleDateString("en-CA");
const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); };
assert.equal(computeStreak([]), 0);
assert.equal(computeStreak([day(0), day(1), day(2), day(5)]), 3);
assert.equal(computeStreak([day(1), day(2)]), 2);
assert.equal(computeStreak([day(3)]), 0);

// AI helpers
assert.deepEqual(parseJsonLoose('```json\n{"a":1}\n```'), { a: 1 });
assert.deepEqual(parseJsonLoose('Sure! {"a":2} bye'), { a: 2 });
assert.equal(parseJsonLoose("nope"), null);
assert.deepEqual(cleanRefs(["2:153", "2:153", "200:1", "bad", "3:1000", " 94:5 "]), ["2:153", "94:5"]);
assert.deepEqual(cleanKeywords(["Patience", "a", "drop table;", "parents"]), ["patience", "parents"]);

console.log("logic tests passed");
