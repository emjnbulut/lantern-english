/* Lantern English service worker: offline reading for installed / revisited devices.
   VERSION is stamped by tools/make-site.mjs; "dev" means an unstamped checkout. */
const VERSION = "dev";
const CACHE = "lantern-" + VERSION;
const SHELL = [
  "./", "index.html", "manifest.webmanifest",
  "assets/css/style.css", "assets/js/lemmatize.js", "assets/js/app.js",
  "data/library.js", "data/dict.js", "data/videos.js",
  "assets/icons/icon.svg", "assets/icons/icon-192.png", "assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("lantern-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  // External movies are streamed from the credited source, never downloaded into the offline cache.
  if (!sameOrigin && !isFont) return;

  // stale-while-revalidate: instant from cache, refreshed in the background for the next visit
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((hit) => {
        const fresh = fetch(req).then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }).catch(() => hit || (req.mode === "navigate" ? cache.match("index.html") : undefined));
        return hit || fresh;
      })
    )
  );
});
