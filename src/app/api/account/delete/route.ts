import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

// Deletes the signed-in user's account and all of their data (rows are removed by "on delete cascade").
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server." }, { status: 500 });
  }

  const admin = createAdmin(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // Remove profile pictures first (best effort).
  try {
    const { data: files } = await admin.storage.from("avatars").list(user.id);
    if (files?.length) {
      await admin.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch {
    /* ignore */
  }

  const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await notifyAdmin("An account was deleted", {
    Name: prof?.full_name ?? "-",
    Email: user.email ?? "-",
    Time: new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" }) + " (Pakistan time)",
  });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}