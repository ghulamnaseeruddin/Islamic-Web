import Link from "next/link";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink">← Noor ul Ilm · نور العلم</Link>
      <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-7 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:ps-6">
        {children}
      </div>
      <p className="mt-10 text-xs text-muted">
        <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link>
      </p>
    </div>
  );
}

export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
