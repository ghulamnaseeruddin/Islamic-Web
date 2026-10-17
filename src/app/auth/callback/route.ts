import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

// Supabase sends the user here after Google login, email confirmation and password reset.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

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