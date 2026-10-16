import { LibrarySection } from "@/components/LibrarySection";

export default async function LibrarySectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LibrarySection slug={decodeURIComponent(slug)} />;
}
