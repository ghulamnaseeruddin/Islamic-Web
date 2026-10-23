"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Item = { id: string; text: string; level: number };

/** "On this page": lists the headings of the article and highlights the one you are reading. */
export function Toc() {
  const path = usePathname();
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const heads = Array.from(document.querySelectorAll<HTMLElement>("#doc-article h2[id], #doc-article h3[id]"));
    setItems(heads.map((h) => ({ id: h.id, text: h.innerText, level: h.tagName === "H3" ? 3 : 2 })));
    setActive(heads[0]?.id ?? "");
    if (heads.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(seen[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [path]);

  if (items.length === 0) return null;
  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
      <ul className="border-s border-line">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={`-ms-px block border-s py-1.5 ${i.level === 3 ? "ps-6" : "ps-4"} ${
                active === i.id ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
