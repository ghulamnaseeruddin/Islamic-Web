import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyPage } from "@/components/docs/CopyPage";
import { DOC_PAGES, docHref, findDoc } from "@/lib/docs";
import { DOC_BODIES } from "@/lib/docs-content";

type Props = { params: Promise<{ slug?: string[] }> };

export function generateStaticParams() {
  return [{ slug: [] }, ...DOC_PAGES.filter((p) => p.slug !== "welcome").map((p) => ({ slug: [p.slug] }))];
}

function slugOf(slug?: string[]) {
  if (!slug || slug.length === 0) return "welcome";
  return slug.length === 1 ? slug[0] : "";
}

export async function generateMetadata({ params }: Props) {
  const found = findDoc(slugOf((await params).slug));
  return found ? { title: found.page.title, description: found.page.description } : {};
}

export default async function DocPage({ params }: Props) {
  const slug = slugOf((await params).slug);
  const found = findDoc(slug);
  const body = DOC_BODIES[slug];
  if (!found || !body) notFound();
  const { page, group, prev, next } = found;

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
        <Link href="/docs" className="hover:text-ink">Docs</Link>
        <span aria-hidden="true">›</span>
        <span>{group.title}</span>
      </nav>

      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl">{page.title}</h1>
        <CopyPage />
      </div>
      <p className="mt-3 text-lg text-muted">{page.description}</p>

      <article
        id="doc-article"
        className="mt-8 text-[16px] leading-8 [&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-8 [&_h3]:scroll-mt-24 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1.5 [&_ol]:my-4 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6"
      >
        {body}
      </article>

      <div className="mt-16 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={docHref(prev.slug)} className="rounded-xl border border-line bg-surface px-4 py-3 hover:bg-soft">
            <span className="block text-xs text-muted">← Previous</span>
            <span className="font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={docHref(next.slug)} className="rounded-xl border border-line bg-surface px-4 py-3 text-right hover:bg-soft sm:col-start-2">
            <span className="block text-xs text-muted">Next →</span>
            <span className="font-medium">{next.title}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
