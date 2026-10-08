// Offline support: keeps the last-visited pages and app files so the app opens without internet.
const CACHE = "abanoupai-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/network"]).catch(() => {}))); });
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api")) return;
  e.respondWith(
    fetch(req)
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
      .catch(async () => (await caches.match(req)) || (req.mode === "navigate" ? (await caches.match("/network")) || (await caches.match("/")) : Response.error())),
  );
});
