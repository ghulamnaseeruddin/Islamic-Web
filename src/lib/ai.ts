// Talks to free-tier AI providers (Groq, Gemini; OpenAI only if you add a key).
// Model names and free limits change over time. Change them in .env.local, not here.

export type ChatMsg = { role: "user" | "assistant"; content: string };
type Tier = "smart" | "fast";

type Provider = "groq" | "gemini" | "openai";

const DEFAULT_MODELS: Record<Provider, Record<Tier, string[]>> = {
  groq: {
    smart: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
    fast: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
  },
  gemini: {
    smart: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    fast: ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
  },
  openai: {
    smart: ["gpt-4o-mini"],
    fast: ["gpt-4o-mini"],
  },
};

function models(p: Provider, tier: Tier): string[] {
  const env = process.env[`${p.toUpperCase()}_MODEL_${tier.toUpperCase()}`];
  const list = env ? [env] : [];
  for (const m of DEFAULT_MODELS[p][tier]) if (!list.includes(m)) list.push(m);
  return list;
}

function keyFor(p: Provider): string | undefined {
  const k = process.env[`${p.toUpperCase()}_API_KEY`];
  return k && k.trim() ? k.trim() : undefined;
}

export function providerOrder(): Provider[] {
  const raw = (process.env.AI_PROVIDER_ORDER ?? "groq,gemini").split(",").map((s) => s.trim().toLowerCase());
  const valid = raw.filter((p): p is Provider => p === "groq" || p === "gemini" || p === "openai");
  return valid.filter((p) => keyFor(p));
}

async function withTimeout(url: string, init: RequestInit, ms = 20000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(id);
  }
}

async function callOpenAiStyle(
  base: string,
  key: string,
  model: string,
  system: string,
  messages: ChatMsg[],
  json: boolean,
  temperature: number,
): Promise<string> {
  const res = await withTimeout(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 1200,
      messages: [{ role: "system", content: system }, ...messages],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
}

async function callGemini(
  key: string,
  model: string,
  system: string,
  messages: ChatMsg[],
  json: boolean,
  temperature: number,
): Promise<string> {
  const res = await withTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: {
        temperature,
        maxOutputTokens: 1400,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });
   if (!res.ok) throw new Error(`${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
}

export class NoProviderError extends Error {}

/** Tries each provider and model in turn until one answers. */
/** Tries each provider and model in turn until one answers. */
export async function chat(opts: {
  system: string;
  messages: ChatMsg[];
  tier?: Tier;
  json?: boolean;
  temperature?: number;
}): Promise<{ text: string; provider: Provider; model: string }> {
  const order = providerOrder();
  if (order.length === 0) throw new NoProviderError("No AI key is set. Add GROQ_API_KEY or GEMINI_API_KEY.");
  const tier = opts.tier ?? "smart";
  const temperature = opts.temperature ?? 0.2;
  let lastError = "";
  const started = Date.now();

  // Two passes: if every provider fails with a busy/limit error, wait a moment and try once more.
  for (let pass = 0; pass < 2; pass++) {
    for (const p of order) {
      const key = keyFor(p)!;
      for (const model of models(p, tier)) {
        try {
          let text: string;
          if (p === "gemini") text = await callGemini(key, model, opts.system, opts.messages, !!opts.json, temperature);
          else {
            const base = p === "groq" ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1";
            text = await callOpenAiStyle(base, key, model, opts.system, opts.messages, !!opts.json, temperature);
          }
          return { text, provider: p, model };
        } catch (e) {
          const msg = (e as Error).name === "AbortError" ? "timeout" : (e as Error).message;
          lastError = `${p}/${model}: ${msg}`;
          console.error("[AI]", lastError);
        }
      }
    }
    const busy = /\b(429|500|502|503|504)\b|timeout/.test(lastError);
    if (!busy || Date.now() - started > 25000) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`All AI providers failed (${lastError})`);
}

/** Reads JSON even if the model wrapped it in text or code fences. */
export function parseJsonLoose<T = unknown>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    /* try to cut out the first {...} block */
  }
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a >= 0 && b > a) {
    try {
      return JSON.parse(cleaned.slice(a, b + 1)) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/** Keeps only valid "surah:ayah" references. */
export function cleanRefs(input: unknown, max = 4): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const r of input) {
    const m = /^\s*(\d{1,3}):(\d{1,3})\s*$/.exec(String(r));
    if (!m) continue;
    const s = Number(m[1]), a = Number(m[2]);
    if (s < 1 || s > 114 || a < 1 || a > 286) continue;
    const ref = `${s}:${a}`;
    if (!out.includes(ref)) out.push(ref);
    if (out.length >= max) break;
  }
  return out;
}

export function cleanKeywords(input: unknown, max = 3): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((k) => String(k).trim().toLowerCase())
    .filter((k) => /^[a-z' -]{3,30}$/.test(k))
    .slice(0, max);
}
