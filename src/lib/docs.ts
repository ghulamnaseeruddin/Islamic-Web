// The Docs section (English only). To add a page: add it here, then add its text in docs-content.tsx.

export type DocMeta = { slug: string; title: string; description: string };
export type DocGroup = { title: string; pages: DocMeta[] };

export const DOC_GROUPS: DocGroup[] = [
  {
    title: "First steps",
    pages: [
      { slug: "welcome", title: "Welcome", description: "What Noor ul Ilm is and where to find things." },
      { slug: "account", title: "Create an account", description: "Sign up, sign in and reset your password." },
      { slug: "install", title: "Install the apps", description: "Put Noor ul Ilm on your phone or computer." },
    ],
  },
  {
    title: "Using Noor ul Ilm",
    pages: [
      { slug: "quran", title: "Reading the Qur'an", description: "Surahs, Paras, rukus, translations, tafsir and audio." },
      { slug: "hadith", title: "Hadith and Library", description: "The six hadith books and the book library." },
      { slug: "ask", title: "Ask Noor", description: "How questions are answered, and what to expect." },
      { slug: "prayer", title: "Prayer times and Qibla", description: "How times are worked out and how to adjust them." },
      { slug: "offline", title: "Reading offline", description: "What works without internet, and what doesn't." },
      { slug: "more", title: "More tools", description: "Names of Allah, duas, zakat, hifz and the rest." },
    ],
  },
  {
    title: "Account and policies",
    pages: [
      { slug: "security", title: "Your data and security", description: "Download, delete and protect your account." },
      { slug: "privacy", title: "Privacy Policy", description: "What I keep, who else sees it, and how you can take it back." },
      { slug: "terms", title: "Terms of Use", description: "The simple rules for using the app." },
      { slug: "contact", title: "Contact me", description: "How to reach me with questions or corrections." },
    ],
  },
];

export const DOC_PAGES: DocMeta[] = DOC_GROUPS.flatMap((g) => g.pages);

export function findDoc(slug: string) {
  const i = DOC_PAGES.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  const group = DOC_GROUPS.find((g) => g.pages.some((p) => p.slug === slug))!;
  return { page: DOC_PAGES[i], group, prev: DOC_PAGES[i - 1] ?? null, next: DOC_PAGES[i + 1] ?? null };
}

export function docHref(slug: string) {
  return slug === "welcome" ? "/docs" : `/docs/${slug}`;
}
