"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { Toc } from "@/components/docs/Toc";
import { DOC_GROUPS, docHref } from "@/lib/docs";

/** The left menu: search box and the grouped list of pages. Used on desktop and inside the phone drawer. */
function Menu({
  path,
  inputRef,
  onNavigate,
}: {
  path: string;
  inputRef?: { current: HTMLInputElement | null };
  onNavigate?: () => void;
}) {
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DOC_GROUPS;
    return DOC_GROUPS.map((g) => ({
      ...g,
      pages: g.pages.filter((p) => (p.title + " " + p.description).toLowerCase().includes(s)),
    })).filter((g) => g.pages.length > 0);
  }, [q]);

  return (
    <>
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          aria-label="Search the docs"
          className="input ps-9"
        />
        <kbd className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[11px] text-muted lg:block">
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
                      onClick={onNavigate}
                      aria-current={on ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-[15px] lg:py-1.5 ${
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
    </>
  );
}

/** Page frame for the Docs: top bar, left menu, content, and "On this page". English only. */
export function DocsShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const desktopInput = useRef<HTMLInputElement>(null);
  const drawerInput = useRef<HTMLInputElement>(null);

  // Ctrl+K (or Cmd+K): focus the search box (opens the drawer on a phone).
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 1024px)").matches) desktopInput.current?.focus();
        else {
          setOpen(true);
          setTimeout(() => drawerInput.current?.focus(), 60);
        }
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  // Close the drawer after going to another page, and stop the page behind it from scrolling.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div dir="ltr" lang="en" className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <Logo small />
          <span className="rounded-full bg-soft px-3 py-1 text-sm font-medium text-brand">Docs</span>
          <div className="ms-auto flex items-center gap-2">
            <Link href="/" className="rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink">
              Open the app
            </Link>
          </div>
        </div>
      </header>

      {/* Phone and tablet: the menu slides in over the page. */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 start-0 flex w-[85%] max-w-[320px] flex-col border-e border-line bg-bg shadow-xl transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Docs menu"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
            <span className="font-semibold">Menu</span>
            <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
              <Icon name="x" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Menu path={path} inputRef={drawerInput} onNavigate={() => setOpen(false)} />
          </div>
        </aside>
      </div>

      <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[272px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)_240px]">
        {/* Computer: the menu stays fixed on the left. */}
        <aside className="hidden lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:px-4 lg:py-6">
          <Menu path={path} inputRef={desktopInput} />
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-10">
          {/* Below the wide layout, "On this page" becomes a dropdown above the text. */}
          <details className="mb-6 rounded-xl border border-line bg-surface px-4 py-2 xl:hidden [&[open]>summary]:mb-2">
            <summary className="cursor-pointer select-none py-1.5 text-sm font-medium">On this page</summary>
            <Toc hideTitle />
          </details>
          {children}
        </main>

        <aside className="hidden px-2 py-10 xl:sticky xl:top-16 xl:block xl:h-[calc(100vh-4rem)] xl:overflow-y-auto">
          <Toc />
        </aside>
      </div>
    </div>
  );
}