"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

/** "Copy page": copies the text of the article so it can be pasted anywhere. */
export function CopyPage() {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      const el = document.getElementById("doc-article");
      await navigator.clipboard.writeText(el?.innerText ?? "");
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm hover:bg-soft"
    >
      <Icon name={done ? "check" : "copy"} className="h-4 w-4" />
      {done ? "Copied" : "Copy page"}
    </button>
  );
}
