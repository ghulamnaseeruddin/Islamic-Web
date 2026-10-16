import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HadithReader } from "@/components/HadithReader";
import { getHadithBook } from "@/lib/hadith/books";

export default async function HadithBookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params;
  if (!getHadithBook(book)) notFound();
  return (
    <Suspense fallback={null}>
      <HadithReader slug={book} />
    </Suspense>
  );
}
