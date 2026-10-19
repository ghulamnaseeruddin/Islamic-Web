import { NextResponse } from "next/server";
import { chat, cleanKeywords, cleanRefs, NoProviderError, parseJsonLoose, type ChatMsg } from "@/lib/ai";
import { fetchAyah, searchQuran } from "@/lib/quran/api";
import { HADITH_BOOKS, fetchHadith, fetchSection } from "@/lib/hadith/books";
import { searchHadithBooks, type HadithHit } from "@/lib/hadith/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// STEP 1: understand the question and restate it, so the user can confirm it.
const UNDERSTAND_SYSTEM = (lang: "en" | "ur") => `You are the first step of "Ask Noor", an Islamic study helper. A user typed a question. It may be in Urdu, Roman Urdu (Urdu in English letters), Arabic, English or another language, and it may have spelling mistakes or vague words. Work out exactly what the user means. Reply with JSON only:
{"off_topic": boolean, "clear": boolean, "understanding": string, "english_query": string, "clarify": string}
- off_topic: true only if the question has nothing to do with Islam, the Qur'an or the Sunnah.
- clear: true if you are confident what the user wants to know. false if the question is too vague or has several very different meanings.
- understanding: ONE short sentence that restates the question from the user's point of view, in the user's own language: simple Urdu script (for example "آپ جاننا چاہتے ہیں کہ ...") if they wrote Urdu or Roman Urdu, simple English (for example "You want to know ...") if they wrote English. If you cannot tell, use ${lang === "ur" ? "Urdu script" : "English"}. Do not answer the question.
- english_query: the same question in clear English, used for searching.
- clarify: only when clear is false: ONE short, polite question in the user's language that asks what you need to know.
Use the earlier messages for context when the question is a follow-up. Never answer the question in this step.`;

// STEP 2 (after the user says "yes"): find verses and hadith.
const PLAN_SYSTEM = `You help find Quran verses and hadith for a question. Reply with JSON only:
{"off_topic": boolean, "keywords": string[], "refs": string[]}
- off_topic: true if the question is not about Islam, the Quran or the Sunnah.
- keywords: up to 3 single English words that appear in the Sahih International translation of relevant verses and in English hadith translations (for example "patience", "parents", "prayer").
- refs: up to 3 verse references "surah:ayah" you are sure are relevant (for example "2:153"). Use [] if unsure.`;

// STEP 3: write the answer from the verified CONTEXT only.
const ANSWER_SYSTEM = (lang: "en" | "ur") => `You are "Ask Noor", a careful study helper inside an Islamic app. The app follows only the Qur'an and the authentic Sunnah, with no sect labels. Religious accuracy is the highest priority. Accuracy matters more than speed or length.

Rules:
1. Answer ONLY from the CONTEXT. It has Qur'an verses and hadith. Cite a verse as [surah:ayah], for example [2:153]. Cite a hadith as [book:number], exactly as written in CONTEXT, for example [bukhari:1]. Never cite anything that is not in CONTEXT.
2. Never guess. Never invent, translate from memory, or change a verse or a hadith. Never present a personal opinion as an Islamic ruling.
3. Start with the Qur'an, then the hadith. Use a hadith only if it directly answers the question. When CONTEXT gives a grade for a hadith, mention it.
4. Do NOT give fatwas or personal rulings. If the question needs a ruling, say what the verses and hadith say, and advise asking a qualified scholar.
5. If recognized scholars differ on the question, say so clearly in one or two lines, and name the evidence from CONTEXT for each view. Do not present a disputed view as settled. Do not name or attack any group.
6. If CONTEXT only partly answers the question, say clearly what is covered and what you could not verify. If it does not answer at all, say you could not find authentic evidence for it. Then advise asking a qualified scholar for complex or disputed matters.
7. The user has already CONFIRMED what they mean (see CONFIRMED MEANING). Answer exactly that, no more.
8. Keep it clear and simple: at most 250 words. No headings.
9. Reply in the same language the user wrote the question in. Urdu script or Roman Urdu: reply in simple Urdu (اردو). English: reply in simple English. Another language: reply in that language if you can, otherwise in English. If you cannot tell, reply in ${lang === "ur" ? "simple Urdu (اردو)" : "simple English"}. Always keep citations like [2:153] and [bukhari:1] unchanged.
10. Be respectful. After the Prophet's name write ﷺ.`;

function clientIssue(message: string, status: number, detail?: string) {
  return NextResponse.json(detail ? { error: message, detail } : { error: message }, { status });
}

function clip(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return clientIssue("Please sign in.", 401);

  let body: {
    mode?: unknown;
    question?: unknown;
    lang?: unknown;
    history?: unknown;
    understanding?: unknown;
    englishQuery?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return clientIssue("Bad request.", 400);
  }
  const mode: "understand" | "answer" = body.mode === "understand" ? "understand" : "answer";
  const question = clip(body.question, 500);
  const lang: "en" | "ur" = body.lang === "ur" ? "ur" : "en";
  if (question.length < 3) return clientIssue("Please type a question.", 400);

  const history: ChatMsg[] = Array.isArray(body.history)
    ? (body.history as ChatMsg[])
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }))
    : [];

  // Shared error handling (the real reason is shown to the admin only)
  async function failure(e: unknown) {
    const detail = (e as Error)?.message || String(e);
    console.error("[ASK] failed:", detail);
    if (e instanceof NoProviderError) return clientIssue("The AI is not set up yet. Add GROQ_API_KEY or GEMINI_API_KEY.", 503);
    let adminDetail: string | undefined;
    try {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user!.id).maybeSingle();
      if (prof?.role === "admin") adminDetail = detail.slice(0, 400);
    } catch {
      /* ignore */
    }
    return clientIssue("The AI is busy right now. Please try again in a minute.", 502, adminDetail);
  }

  // ---------- STEP 1: understand the question and ask the user to confirm ----------
  if (mode === "understand") {
    try {
      const res = await chat({
        system: UNDERSTAND_SYSTEM(lang),
        messages: [...history, { role: "user", content: question }],
        tier: "smart",
        json: true,
        temperature: 0,
      });
      const u =
        parseJsonLoose<{
          off_topic?: boolean;
          clear?: boolean;
          understanding?: unknown;
          english_query?: unknown;
          clarify?: unknown;
        }>(res.text) ?? {};
      if (u.off_topic === true) return NextResponse.json({ offTopic: true });
      const clarify = clip(u.clarify, 300);
      if (u.clear === false && clarify) return NextResponse.json({ clarify });
      const understanding = clip(u.understanding, 400) || question;
      const englishQuery = clip(u.english_query, 400) || question;
      return NextResponse.json({ understanding, englishQuery });
    } catch (e) {
      return failure(e);
    }
  }

  // ---------- STEP 2 and 3: the user confirmed, so find evidence and answer ----------
  const understanding = clip(body.understanding, 400) || question;
  const englishQuery = clip(body.englishQuery, 400) || question;

  // Daily limit per user (counted once per confirmed question)
  const limit = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 25);
  const { data: allowed, error: quotaError } = await supabase.rpc("consume_ai_quota", { daily_limit: limit });
  if (quotaError) return clientIssue("The AI limit table is not set up. Run supabase/schema.sql.", 500);
  if (!allowed) return clientIssue("limit", 429);

  try {
    const planRes = await chat({
      system: PLAN_SYSTEM,
      messages: [{ role: "user", content: englishQuery }],
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

    // Fetch verses and hadith at the same time (the answer may only use these)
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
        answer:
          lang === "ur"
            ? "مجھے اس سوال کے لیے مستند آیات یا احادیث نہیں ملیں، اس لیے میں اندازے سے جواب نہیں دوں گا۔ براہ کرم تلاش (Search) استعمال کریں یا کسی مستند عالم سے پوچھیں۔"
            : "I could not find authentic verses or hadith for this question, so I will not guess. Please try the Search page or ask a qualified scholar.",
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

    const ans = await chat({
      system: ANSWER_SYSTEM(lang),
      messages: [
        ...history,
        {
          role: "user",
          content: `CONTEXT:\n${context}\n\nQUESTION: ${question}\n\nCONFIRMED MEANING: ${understanding}`,
        },
      ],
      tier: "smart",
      temperature: 0.1,
    });

    // Safety check: remove any reference that is not in CONTEXT (the AI must not invent references)
    const allowedVerses = new Set(bundles.map((b) => `${b.surah}:${b.ayah}`));
    const allowedHadith = new Set(hadithHits.map((h) => `${h.slug}:${h.number}`));
    const cleanText = ans.text
      .replace(/\[(\d{1,3}):(\d{1,3})\]/g, (m, s, a) => (allowedVerses.has(`${Number(s)}:${Number(a)}`) ? m : ""))
      .replace(/\[([a-z-]+):(\d+)\]/g, (m, slug, n) => (allowedHadith.has(`${slug}:${Number(n)}`) ? m : ""))
      .replace(/[ \t]{2,}/g, " ")
      .trim();

    const citedVerses = new Set([...cleanText.matchAll(/\[(\d{1,3}):(\d{1,3})\]/g)].map((m) => `${Number(m[1])}:${Number(m[2])}`));
    const verses = bundles
      .filter((b) => citedVerses.has(`${b.surah}:${b.ayah}`))
      .map((b) => ({
        ref: `${b.surah}:${b.ayah}`,
        surahName: b.surahName,
        arabic: b.arabic,
        text: b.translations["en.sahih"] ?? "",
        textUr: b.translations["ur.jalandhry"] ?? "",
      }));

    const citedHadith = new Set([...cleanText.matchAll(/\[([a-z-]+):(\d+)\]/g)].map((m) => `${m[1]}:${Number(m[2])}`));
    const usedHadith = hadithHits.filter((h) => citedHadith.has(`${h.slug}:${h.number}`));

    // No verified reference left in the answer = an unsupported claim. Do not show it.
    if (verses.length === 0 && citedHadith.size === 0) {
      return NextResponse.json({
        answer:
          lang === "ur"
            ? "میں اس سوال کا جواب مستند حوالوں کے ساتھ تصدیق نہیں کر سکا، اس لیے میں اندازے سے جواب نہیں دوں گا۔ براہ کرم سوال دوسرے الفاظ میں لکھیں، یا کسی مستند عالم سے پوچھیں۔"
            : "I could not verify an answer to this question with authentic references, so I will not guess. Please rephrase it, or ask a qualified scholar.",
        verses: [],
        hadiths: [],
      });
    }
    const hadiths = await Promise.all(
      usedHadith.map(async (h) => {
        const key = HADITH_BOOKS.find((b) => b.slug === h.slug)?.key ?? "";
        const [ar, ur, secUr] = await Promise.all([
          key ? fetchHadith("ara", key, h.number).catch(() => null) : null,
          key ? fetchHadith("urd", key, h.number).catch(() => null) : null,
          key && h.sectionNo != null ? fetchSection("urd", key, h.sectionNo).catch(() => null) : null,
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

    return NextResponse.json({ answer: cleanText, verses, hadiths });
  } catch (e) {
    return failure(e);
  }
}