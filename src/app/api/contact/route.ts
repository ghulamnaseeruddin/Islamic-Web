import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Saves a contact message, then (best effort) sends emails with Resend.
// The message is saved first, so it is never lost even if the email fails.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function sendEmail(opts: { from: string; to: string; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: opts.from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "name" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return NextResponse.json({ error: "email" }, { status: 400 });
  if (phone && !/^[+\d][\d\s-]{6,19}$/.test(phone)) return NextResponse.json({ error: "phone" }, { status: 400 });
  if (message.length < 10 || message.length > 2000) return NextResponse.json({ error: "message" }, { status: 400 });

  // Simple spam guard: at most 5 messages per hour per user.
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: "limit" }, { status: 429 });

  const { error } = await supabase
    .from("contact_messages")
    .insert({ user_id: user.id, name, email, phone: phone || null, message });
  if (error) return NextResponse.json({ error: "save" }, { status: 500 });

  // ---- emails (optional) ----
  const admin = process.env.ADMIN_NOTIFY_EMAIL;
  const customFrom = process.env.RESEND_FROM_EMAIL; // needs a domain verified in Resend
  const from = customFrom || "Noor ul Ilm <onboarding@resend.dev>";
  let emailed = false;

  if (admin) {
    emailed = await sendEmail({
      from,
      to: admin,
      replyTo: email,
      subject: `New message from ${name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px">
        <h2 style="color:#0f5c46">New contact message</h2>
        <p><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Phone:</b> ${esc(phone || "-")}</p>
        <div style="border-left:4px solid #0f5c46;padding:8px 12px;background:#f3f7f5;white-space:pre-wrap" dir="auto">${esc(message)}</div>
        <p style="color:#666;font-size:12px">Open the Admin page, Messages tab, to mark it done.</p></div>`,
    });
  }

  // Confirmation to the user: only when a verified sending domain is set,
  // because Resend's test sender can only email your own account address.
  if (customFrom) {
    await sendEmail({
      from: customFrom,
      to: email,
      subject: "We received your message | آپ کا پیغام موصول ہوگیا",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px">
        <h2 style="color:#0f5c46">Noor ul Ilm</h2>
        <p>Assalamu alaikum ${esc(name)},</p>
        <p>Thank you for writing to us. We received your message and will read it soon, in sha Allah.</p>
        <p dir="rtl" style="font-size:16px">السلام علیکم ${esc(name)}، آپ کا پیغام ہمیں مل گیا ہے۔ ان شاء اللہ ہم جلد اسے پڑھیں گے۔</p>
        <hr><p style="color:#666;font-size:12px">Your message:</p>
        <div style="white-space:pre-wrap;color:#444" dir="auto">${esc(message)}</div></div>`,
    });
  }

  return NextResponse.json({ ok: true, emailed });
}