export type LibSection = {
  id: string;
  slug: string;
  parent_id: string | null;
  title: string;
  title_ur: string | null;
  sort_order: number;
  app_path: string | null;
  note: string | null;
  is_hidden: boolean;
};

export type LibFile = { label: string; url: string };

export type LibBook = {
  id: string;
  section_id: string;
  title: string;
  title_ur: string | null;
  author: string | null;
  files: LibFile[];
  app_path: string | null;
  sort_order: number;
  is_hidden: boolean;
};

export const sectionTitle = (s: Pick<LibSection, "title" | "title_ur">, lang: "en" | "ur") =>
  lang === "ur" && s.title_ur ? s.title_ur : s.title;

/** Only allow normal web links. */
export const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : "#");
