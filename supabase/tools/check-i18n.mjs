// Checks that every translation key used in src/ exists in both languages.
// Run:  node supabase/tools/check-i18n.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && files.push(p);
  }
})(root);

const dictSrc = readFileSync(join(root, "lib", "dictionary.ts"), "utf8");
const enBlock = dictSrc.slice(dictSrc.indexOf("const en = {"), dictSrc.indexOf("} as const;"));
const urBlock = dictSrc.slice(dictSrc.indexOf("const ur:"));
const keyRe = /^\s*"([a-zA-Z]+\.[A-Za-z0-9]+)":/gm;
const en = new Set([...enBlock.matchAll(keyRe)].map((m) => m[1]));
const ur = new Set([...urBlock.matchAll(keyRe)].map((m) => m[1]));

const used = new Set();
const useRe = /["'`]((?:nav|auth|common|report|note|quran|settings|prayer|hadith|library|azkaar|home|search|saved|profile|admin|ask|more|names|duas|zakat|quiz|seerah|ramadan|qibla|mosques|hifz|khatam|offline|share|study)\.[A-Za-z0-9]+)["'`]/g;
for (const f of files) {
  if (f.endsWith("dictionary.ts")) continue;
  for (const m of readFileSync(f, "utf8").matchAll(useRe)) used.add(m[1]);
}
let bad = 0;
for (const k of used) if (!en.has(k)) (console.log("missing in en:", k), bad++);
for (const k of used) if (!ur.has(k)) (console.log("missing in ur:", k), bad++);
for (const k of en) if (!ur.has(k)) (console.log("en only:", k), bad++);
for (const k of ur) if (!en.has(k)) (console.log("ur only:", k), bad++);
console.log(`${used.size} keys used, ${en.size} en, ${ur.size} ur, ${bad} problems`);
process.exit(bad ? 1 : 0);
