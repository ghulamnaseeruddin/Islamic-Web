import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <LogoMark size={88} />
      <p className="font-arabic text-5xl">٤٠٤</p>
      <h1 className="text-xl font-semibold">Page not found · صفحہ نہیں ملا</h1>
      <Link href="/" className="btn btn-primary">
        Home · ہوم
      </Link>
    </div>
  );
}
