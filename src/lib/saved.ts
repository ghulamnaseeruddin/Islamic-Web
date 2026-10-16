"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export type BookmarkKind = "quran" | "hadith" | "book";

/** Loads the user's bookmarks of one kind and lets you toggle them. */
export function useBookmarks(kind: BookmarkKind, refPrefix?: string) {
  const [refs, setRefs] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabaseBrowser().from("bookmarks").select("ref").eq("kind", kind);
      if (refPrefix) q = q.like("ref", `${refPrefix}%`);
      const { data } = await q;
      if (!cancelled && data) setRefs(new Set(data.map((r: { ref: string }) => r.ref)));
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, refPrefix]);

  const toggle = useCallback(
    async (ref: string, title: string) => {
      const sb = supabaseBrowser();
      if (refs.has(ref)) {
        setRefs((prev) => {
          const n = new Set(prev);
          n.delete(ref);
          return n;
        });
        await sb.from("bookmarks").delete().eq("kind", kind).eq("ref", ref);
      } else {
        setRefs((prev) => new Set(prev).add(ref));
        await sb.from("bookmarks").insert({ kind, ref, title });
      }
    },
    [refs, kind],
  );

  return { refs, toggle };
}
