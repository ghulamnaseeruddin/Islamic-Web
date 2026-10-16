import { notFound } from "next/navigation";
import { QuranReader } from "@/components/QuranReader";

export default async function SurahPage({ params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const n = Number(surah);
  if (!Number.isInteger(n) || n < 1 || n > 114) notFound();
  return <QuranReader surah={n} />;
}
