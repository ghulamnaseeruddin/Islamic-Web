import { NextResponse } from "next/server";
import { chat, cleanKeywords, cleanRefs, NoProviderError, parseJsonLoose, type ChatMsg } from "@/lib/ai";
import { fetchAyah, searchQuran } from "@/lib/quran/api";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const PLAN_SYSTEM = `You help find Quran verses for a question. Reply with JSON only:
{"off_topic": boolean, "keywords": string[], "refs": string[]}
- off_topic: true if the question is not about Islam, the Quran or the Sunnah.
- keywords: up to 3 single English words that appear in the Sahih International translation of relevant verses (for example "patience", "parents", "prayer").
- refs: up to 3 verse references "surah:ayah" you are sure are relevant (for example "2:153"). Use [] if unsure.`;

const ANSWER_SYSTEM = (lang: "en" | "ur") => `You are "Ask Noor", a careful study helper inside an Islamic app. The app follows only the Qur'an and the authentic Sunnah, with no sect labels.

Rules:
1. Answer ONLY from the Qur'an verses given in CONTEXT. Cite a verse as [surah:ayah], for example [2:153]. Never cite a verse that is not in CONTEXT.
2. Do NOT quote any hadith text or give hadith numbers from memory. If the Sunnah is relevant, say so in general words and tell the reader to check the Hadith section of the app (Sahih Bukhari, Sahih Muslim and others).
3. Do NOT give fatwas or personal rulings. If the question needs a ruling, give what the verses say and advise asking a qualified scholar.
4. If scholars differ, say so neutrally in one line. Do not name or attack any group.
5. If CONTEXT does not answer the question, say clearly that you could not find it and suggest searching in the app. Never guess.
6. Keep it short and simple: at most 150 words. No headings.
7. Write the answer in ${lang === "ur" ? "simple Urdu (اردو), but keep citations like [2:153]" : "simple English"}.
8. Be respectful. Say "peace be upon him" after the Prophet's name in the form ﷺ.`;

function clientIssue(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return clientIssue("Please sign in.", 401);

  let body: { question?: unknown; lang?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return clientIssue("Bad request.", 400);
  }
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
  const lang: "en" | "ur" = body.lang === "ur" ? "ur" : "en";
  if (question.length < 3) return clientIssue("Please type a question.", 400);

  const history: ChatMsg[] = Array.isArray(body.history)
    ? (body.history as ChatMsg[])
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }))
    : [];

  // Daily limit per user
  const limit = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 25);
  const { data: allowed, error: quotaError } = await supabase.rpc("consume_ai_quota", { daily_limit: limit });
  if (quotaError) return clientIssue("The AI limit table is not set up. Run supabase/schema.sql.", 500);
  if (!allowed) return clientIssue("limit", 429);

  try {
    // Step 1: find what to look up
    const planRes = await chat({
      system: PLAN_SYSTEM,
      messages: [{ role: "user", content: question }],
      tier: "fast",
      json: true,
      temperature: 0,
    });
    const plan = parseJsonLoose<{ off_topic?: boolean; keywords?: unknown; refs?: unknown }>(planRes.text) ?? {};
    if (plan.off_topic === true) {
      return NextResponse.json({ answer: null, offTopic: true, verses: [] });
    }
    const keywords = cleanKeywords(plan.keywords);
    const refs = cleanRefs(plan.refs);

    // Step 2: fetch verses (the answer may only use these)
    const found = new Set<string>(refs);
    for (const k of keywords) {
      const matches = await searchQuran(k, "en.sahih");
      for (const m of matches.slice(0, 4)) found.add(`${m.surah}:${m.ayah}`);
    }
    const list = [...found].slice(0, 8);
    const bundles = (await Promise.all(list.map((r) => fetchAyah(r, ["en.sahih"])))).filter(
      (b): b is NonNullable<typeof b> => !!b,
    );

    if (bundles.length === 0) {
      return NextResponse.json({
        answer: lang === "ur"
          ? "مجھے اس سوال کے لیے متعلقہ آیات نہیں ملیں۔ براہ کرم تلاش (Search) استعمال کریں۔"
          : "I could not find verses for this question. Please try the Search page.",
        verses: [],
      });
    }

    const context = bundles.map((b) => `[${b.surah}:${b.ayah}] ${b.translations["en.sahih"] ?? ""}`).join("\n");

    // Step 3: write the answer
    const ans = await chat({
      system: ANSWER_SYSTEM(lang),
      messages: [...history, { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${question}` }],
      tier: "smart",
      temperature: 0.2,
    });

    const cited = new Set([...ans.text.matchAll(/\[(\d{1,3}):(\d{1,3})\]/g)].map((m) => `${Number(m[1])}:${Number(m[2])}`));
    const verses = bundles
      .filter((b) => cited.has(`${b.surah}:${b.ayah}`))
      .map((b) => ({
        ref: `${b.surah}:${b.ayah}`,
        surahName: b.surahName,
        arabic: b.arabic,
        text: b.translations["en.sahih"] ?? "",
      }));

    return NextResponse.json({ answer: ans.text.trim(), verses });
  } catch (e) {
    if (e instanceof NoProviderError) return clientIssue("The AI is not set up yet. Add GROQ_API_KEY or GEMINI_API_KEY.", 503);
    return clientIssue("The AI is busy right now. Please try again in a minute.", 502);
  }
}
