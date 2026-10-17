import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// TEMPORARY test page. Delete this file after the test.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log in first, then open this page again" }, { status: 401 });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || "Noor ul Ilm <onboarding@resend.dev>";

  const report: Record<string, unknown> = {
    RESEND_API_KEY_found: !!key,
    ADMIN_NOTIFY_EMAIL_found: !!to,
    ADMIN_NOTIFY_EMAIL_value: to ?? null,
    RESEND_FROM_EMAIL_value: process.env.RESEND_FROM_EMAIL ?? "(not set, using onboarding@resend.dev)",
  };
  if (!key || !to) return NextResponse.json(report);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: "Noor ul Ilm test email", html: "<p>The test worked.</p>" }),
    });
    report.resend_status = res.status;
    report.resend_answer = await res.text();
  } catch (e) {
    report.fetch_error = String(e);
  }
  return NextResponse.json(report);
}