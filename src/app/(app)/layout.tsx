import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const name =
    profile?.full_name || meta.full_name || meta.name || (user.email ?? "").split("@")[0];
  const avatar = profile?.avatar_url || meta.avatar_url || meta.picture || null;

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email ?? "",
        name,
        avatar,
        role: profile?.role ?? "user",
      }}
    >
      {children}
    </AppShell>
  );
}
