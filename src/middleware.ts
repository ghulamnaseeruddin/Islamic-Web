import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Pages anyone can open without logging in. Everything else needs a login.
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/auth/callback", "/privacy", "/terms"];
// If you are already logged in, these pages send you to the home page.
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"];

function isMatch(path: string, list: string[]) {
  return list.some((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new NextResponse(
      "Supabase keys are missing. Copy .env.example to .env.local and fill it in (see docs/SETUP.md).",
      { status: 500 },
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not put code between createServerClient and getUser().
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const path = request.nextUrl.pathname;

  function redirectTo(pathname: string, next?: string) {
    const target = request.nextUrl.clone();
    target.pathname = pathname;
    target.search = "";
    if (next && next !== "/") target.searchParams.set("next", next);
    const res = NextResponse.redirect(target);
    // keep refreshed login cookies on the redirect
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  if (!user && !isMatch(path, PUBLIC_PATHS)) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return redirectTo("/login", path);
  }

  // Two-step login: if the user turned on 2FA, the session must be verified with a code first.
  if (user && !isMatch(path, PUBLIC_PATHS) && path !== "/verify-2fa") {
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        if (path.startsWith("/api/")) {
          return NextResponse.json({ error: "mfa_required" }, { status: 401 });
        }
        return redirectTo("/verify-2fa");
      }
    } catch {
      /* if the check fails, let the page decide */
    }
  }

  if (user && isMatch(path, GUEST_ONLY)) {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|woff2?|webmanifest|js)$).*)",
  ],
};
