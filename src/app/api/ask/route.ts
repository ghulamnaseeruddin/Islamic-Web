import { NextResponse } from "next/server";
import { chat, cleanKeywords, cleanRefs, NoProviderError, parseJsonLoose, type ChatMsg } from "@/lib/ai";
import { fetchAyah, searchQuran } from "@/lib/quran/api";
import { HADITH_BOOKS, fetchHadith, fetchSection } from "@/lib/hadith/books";
import { searchHadithBooks, type HadithHit } from "@/lib/hadith/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const PLAN_SYSTEM = `You help find Quran verses and hadith for a question. Reply with JSON only:
{"off_topic": boolean, "keywords": string[], "refs": string[]}
- off_topic: true if the question is not about Islam, the Quran or the Sunnah.
- keywords: the question may be in any language (Urdu, Roman Urdu, Arabic, English, ...). Always give up to 3 single English words that appear in the Sahih International translation of relevant verses and in English hadith translations (for example "patience", "parents", "prayer").
- refs: up to 3 verse references "surah:ayah" you are sure are relevant (for example "2:153"). Use [] if unsure.`;

const ANSWER_SYSTEM = (lang: "en" | "ur") => `You are "Ask Noor", a careful study helper inside an Islamic app. The app follows only the Qur'an and the authentic Sunnah, with no sect labels.

Rules:
1. Answer ONLY from the CONTEXT. It has Qur'an verses and hadith. Cite a verse as [surah:ayah], for example [2:153]. Cite a hadith as [book:number], exactly as written in CONTEXT, for example [bukhari:1]. Never cite anything that is not in CONTEXT.
2. Start with the Qur'an, then the hadith. Use a hadith only if it really answers the question. Never quote hadith from memory.
3. Do NOT give fatwas or personal rulings. If the question needs a ruling, give what the verses and hadith say and advise asking a qualified scholar.
4. If scholars differ, say so neutrally in one line. Do not name or attack any group.
5. If CONTEXT does not answer the question, say clearly that you could not find it and suggest searching in the app. Never guess.
6. Keep it short and simple: at most 220 words. No headings.
7. Reply in the same language the user wrote the question in. Urdu script or Roman Urdu (Urdu in English letters): reply in simple Urdu (اردو). English: reply in simple English. Another language: reply in that language if you can, otherwise in English. If you cannot tell, reply in ${lang === "ur" ? "simple Urdu (اردو)" : "simple English"}. Always keep citations like [2:153] and [bukhari:1] unchanged.
8. Be respectful. Say "peace be upon him" after the Prophet's name in the form ﷺ.`;

function clientIssue(message: string, status: number, detail?: string) {
  return NextResponse.json(detail ? { error: message, detail } : { error: message }, { status });
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
      return NextResponse.json({ answer: null, offTopic: true, verses: [], hadiths: [] });
    }
    const keywords = cleanKeywords(plan.keywords);
    const refs = cleanRefs(plan.refs);

    // Step 2: fetch verses and hadith at the same time (the answer may only use these)
    const [bundles, hadithHits] = await Promise.all([
      (async () => {
        const found = new Set<string>(refs);
        for (const k of keywords) {
          try {
            const matches = await searchQuran(k, "en.sahih");
            for (const m of matches.slice(0, 4)) found.add(`${m.surah}:${m.ayah}`);
          } catch (e) {
            console.error("[ASK] quran search failed:", (e as Error).message);
          }
        }
        const list = [...found].slice(0, 8);
        const got = await Promise.all(
          list.map((r) =>
            fetchAyah(r, ["en.sahih", "ur.jalandhry"]).catch((e) => {
              console.error("[ASK] fetchAyah failed:", r, (e as Error).message);
              return null;
            }),
          ),
        );
        return got.filter((b): b is NonNullable<typeof b> => !!b);
      })(),
      searchHadithBooks(keywords).catch((e) => {
        console.error("[ASK] hadith search failed:", (e as Error).message);
        return [] as HadithHit[];
      }),
    ]);

    if (bundles.length === 0 && hadithHits.length === 0) {
      return NextResponse.json({
        answer: lang === "ur"
          ? "مجھے اس سوال کے لیے متعلقہ آیات یا احادیث نہیں ملیں۔ براہ کرم تلاش (Search) استعمال کریں۔"
          : "I could not find verses or hadith for this question. Please try the Search page.",
        verses: [],
        hadiths: [],
      });
    }

    const quranContext = bundles.map((b) => `[${b.surah}:${b.ayah}] ${b.translations["en.sahih"] ?? ""}`).join("\n");
    const hadithContext = hadithHits
      .map(
        (h) =>
          `[${h.slug}:${h.number}] ${h.book}, hadith ${h.number}${h.section ? `, chapter "${h.section}"` : ""}${h.grade ? `, grade: ${h.grade}` : ""}: ${h.text}`,
      )
      .join("\n");
    const context = `QURAN VERSES:\n${quranContext || "(none found)"}\n\nHADITH:\n${hadithContext || "(none found)"}`;

    // Step 3: write the answer
    const ans = await chat({
      system: ANSWER_SYSTEM(lang),
      messages: [...history, { role: "user", content: `CONTEXT:\n${context}\n\nQUESTION: ${question}` }],
      tier: "smart",
      temperature: 0.2,
    });

    const citedVerses = new Set([...ans.text.matchAll(/\[(\d{1,3}):(\d{1,3})\]/g)].map((m) => `${Number(m[1])}:${Number(m[2])}`));
    const verses = bundles
      .filter((b) => citedVerses.has(`${b.surah}:${b.ayah}`))
      .map((b) => ({
        ref: `${b.surah}:${b.ayah}`,
        surahName: b.surahName,
        arabic: b.arabic,
        text: b.translations["en.sahih"] ?? "",
        textUr: b.translations["ur.jalandhry"] ?? "",
      }));

    const citedHadith = new Set([...ans.text.matchAll(/\[([a-z-]+):(\d+)\]/g)].map((m) => `${m[1]}:${Number(m[2])}`));
    const usedHadith = hadithHits.filter((h) => citedHadith.has(`${h.slug}:${h.number}`));
    const hadiths = await Promise.all(
      usedHadith.map(async (h) => {
        const key = HADITH_BOOKS.find((b) => b.slug === h.slug)?.key ?? "";
        const wantUrdu = !!key; // Urdu is always included, next to Arabic and English
        const [ar, ur, secUr] = await Promise.all([
          key ? fetchHadith("ara", key, h.number).catch(() => null) : null,
          wantUrdu ? fetchHadith("urd", key, h.number).catch(() => null) : null,
          wantUrdu && h.sectionNo != null ? fetchSection("urd", key, h.sectionNo).catch(() => null) : null,
        ]);
        return {
          slug: h.slug,
          book: h.book,
          number: h.number,
          sectionNo: h.sectionNo,
          section: h.section,
          grade: h.grade,
          arabic: ar?.text ?? "",
          urdu: ur?.text ?? "",
          sectionUr: secUr?.name ?? "",
          text: h.text,
        };
      }),
    );

    return NextResponse.json({ answer: ans.text.trim(), verses, hadiths });
  } catch (e) {
    const detail = (e as Error).message || String(e);
    console.error("[ASK] failed:", detail);
    if (e instanceof NoProviderError) return clientIssue("The AI is not set up yet. Add GROQ_API_KEY or GEMINI_API_KEY.", 503);

    // Only the admin sees the real reason in the app. Everyone else sees a friendly message.
    let adminDetail: string | undefined;
    try {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (prof?.role === "admin") adminDetail = detail.slice(0, 400);
    } catch {
      /* ignore */
    }
    return clientIssue("The AI is busy right now. Please try again in a minute.", 502, adminDetail);
  }
}