import { notFound } from "next/navigation";
import { JuzReader } from "@/components/JuzReader";

export default async function JuzPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const juz = Number(n);
  if (!Number.isInteger(juz) || juz < 1 || juz > 30) notFound();
  return <JuzReader juz={juz} />;
}