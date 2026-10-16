import Link from "next/link";

/** The Noor ul Ilm medallion (public/logo-96.png) with the name next to it. */
export function Logo({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Noor ul Ilm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-96.png"
        alt=""
        width={small ? 32 : 40}
        height={small ? 32 : 40}
        className={small ? "h-8 w-8" : "h-10 w-10"}
      />
      <span className="flex flex-col leading-tight">
        <span className="font-arabic text-lg text-ink">نور العلم</span>
        <span className="text-[11px] tracking-wide text-muted" dir="ltr">
          Noor ul Ilm
        </span>
      </span>
    </Link>
  );
}

/** Large medallion for hero areas (home, sign in, 404). */
export function LogoMark({ size = 96 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Noor ul Ilm — Light of Islam"
      width={size}
      height={size}
      className="mx-auto rounded-full shadow-md"
      style={{ width: size, height: size }}
    />
  );
}
