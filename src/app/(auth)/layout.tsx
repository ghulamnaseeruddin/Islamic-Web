import { AuthHeader } from "@/components/auth";
import { LogoMark } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthHeader />
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">
          <div className="mb-5 hidden sm:block"><LogoMark size={104} /></div>
          {children}
        </div>
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-muted">
        Noor ul Ilm · نور العلم ·{" "}
        <a href="/privacy" className="underline">Privacy</a> ·{" "}
        <a href="/terms" className="underline">Terms</a>
      </footer>
    </div>
  );
}
