"use client";

import { SettingsProvider } from "@/lib/settings";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { PrayerNotifier } from "@/components/PrayerNotifier";
import { PwaRegister } from "@/components/PwaRegister";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
};

export function AppShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  return (
    <SettingsProvider userId={user.id}>
      <Header user={user} />
      <main className="page">{children}</main>
      <BottomNav />
      <PrayerNotifier />
      <PwaRegister />
    </SettingsProvider>
  );
}
