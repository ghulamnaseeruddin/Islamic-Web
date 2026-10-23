"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Toc } from "@/components/docs/Toc";
import { DOC_GROUPS, docHref } from "@/lib/docs";

/** Page frame for the Docs: top bar, left menu with search, content, and "On this page". English only. */
export function DocsShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Ctrl+K (or Cmd+K) jumps to the search box.
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => setOpen(false), [path]);

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DOC_GROUPS;
    return DOC_GROUPS.map((g) => ({
      ...g,
      pages: g.pages.filter((p) => (p.title + " " + p.description).toLowerCase().includes(s)),
    })).filter((g) => g.pages.length > 0);
  }, [q]);

  return (
    <div dir="ltr" lang="en" className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} />
          </button>
          <Logo small />
          <span className="hidden rounded-full bg-soft px-3 py-1 text-sm font-medium text-brand sm:inline">Docs</span>
          <div className="ms-auto flex items-center gap-2">
            <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink">
              Open the app
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[272px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)_240px]">
        <aside
          className={`${open ? "block" : "hidden"} border-b border-line px-4 py-4 sm:px-6 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-b-0 lg:px-4 lg:py-6`}
        >
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              aria-label="Search the docs"
              className="input ps-9"
            />
            <kbd className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] text-muted sm:block">
              Ctrl K
            </kbd>
          </div>
          <nav aria-label="Docs" className="mt-4">
            {groups.map((g) => (
              <div key={g.title} className="mb-5">
                <p className="px-3 pb-1 text-[15px] font-semibold">{g.title}</p>
                <ul>
                  {g.pages.map((p) => {
                    const href = docHref(p.slug);
                    const on = path === href;
                    return (
                      <li key={p.slug}>
                        <Link
                          href={href}
                          aria-current={on ? "page" : undefined}
                          className={`block rounded-lg px-3 py-1.5 text-[15px] ${
                            on ? "bg-soft font-medium text-ink" : "text-muted hover:text-ink"
                          }`}
                        >
                          {p.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {groups.length === 0 && <p className="px-3 text-sm text-muted">Nothing found.</p>}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-8 lg:py-10">{children}</main>

        <aside className="hidden px-2 py-10 xl:sticky xl:top-16 xl:block xl:h-[calc(100vh-4rem)] xl:overflow-y-auto">
          <Toc />
        </aside>
      </div>
    </div>
  );
}
