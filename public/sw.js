// Service worker: installable app + prayer notifications + light offline support.
// Only static assets (and fonts) are cached. Pages and data are always fetched fresh;
// if the network is down, a page request shows the cached /offline page
// (which reads your saved surahs from this device).
const STATIC = "noor-static-v2";
const PAGES = "noor-pages-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => fetch("/offline").then((r) => (r.ok && !r.redirected ? c.put("/offline", r) : null)).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  const isStatic =
    (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) ||
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "fonts.googleapis.com";
  if (isStatic) {
    event.respondWith(
      caches.open(STATIC).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (url.pathname === "/offline" && res.ok && !res.redirected) caches.open(PAGES).then((c) => c.put("/offline", res.clone()));
          return res;
        })
        .catch(async () => (await caches.match("/offline")) || Response.error()),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("/prayer");
    }),
  );
});
