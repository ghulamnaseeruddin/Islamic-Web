import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

// Supabase sends the user here after Google login, email confirmation and password reset.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

  // Login started inside the desktop app: this browser cannot finish it (the app holds the
  // secret for this login). Hand the one-time code back to the app via noorulilm://.
  if (nextRaw === "/desktop-auth") {
    if (!code) return NextResponse.redirect(`${origin}/login?error=auth`);
    const link = `noorulilm://auth?code=${encodeURIComponent(code)}`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Noor ul Ilm</title>
<style>body{font-family:system-ui,Arial,sans-serif;background:#f6f4ee;color:#1d2b25;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0;padding:24px}
a{display:inline-block;margin-top:16px;background:#0f5c46;color:#fff;padding:10px 24px;border-radius:999px;text-decoration:none}</style></head>
<body><div><h2>Noor ul Ilm</h2><p>Returning to the app… You can close this tab afterwards.</p><p dir="rtl">ایپ پر واپس جا رہے ہیں… اس کے بعد یہ ٹیب بند کر دیں۔</p>
<a href="${link}">Open Noor ul Ilm app</a></div>
<script>setTimeout(function(){location.href=${JSON.stringify(link)}},300)</script></body></html>`;
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Tell the admin about a brand new account (only once per user).
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: first } = await supabase
            .from("profiles")
            .update({ signup_notified: true })
            .eq("id", user.id)
            .eq("signup_notified", false)
            .select("full_name");
          if (first && first.length > 0) {
            await notifyAdmin("New account created", {
              Name: first[0].full_name ?? "-",
              Email: user.email ?? "-",
              "Signed up with": String(user.app_metadata?.provider ?? "email"),
              Time: new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" }) + " (Pakistan time)",
            });
          }
        }
      } catch {
        /* never block the login because of an alert */
      }
      const forwardedHost = request.headers.get("x-forwarded-host");
      if (process.env.NODE_ENV === "development" || !forwardedHost) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}