// Sends a short alert email to the admin (you) with Resend.
// Needs RESEND_API_KEY and ADMIN_NOTIFY_EMAIL in the environment. If they are missing, it does nothing.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function notifyAdmin(subject: string, lines: Record<string, string>): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!key || !to) return false;
  const rawFrom = (process.env.RESEND_FROM_EMAIL ?? "").replace(/["']/g, "").trim();
  const from = rawFrom.includes("@") ? rawFrom : "Noor ul Ilm <onboarding@resend.dev>";
  const rows = Object.entries(lines)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
    .join("");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px">
          <h2 style="color:#0f5c46;margin:0 0 12px">${esc(subject)}</h2>
          <table style="font-size:14px">${rows}</table></div>`,
      }),
    });
    if (!res.ok) console.error("Resend error:", res.status, await res.text());
    return res.ok;
  } catch {
    return false;
  }
}