/* Lantern English service worker: fresh files whenever online, cached copy when offline.
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
      .then((cache) => Promise.all(SHELL.map((u) => cache.add(new Request(u, { cache: "reload" })).catch(() => {}))))
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

function networkFirst(req) {
  return caches.open(CACHE).then((cache) => {
    const live = (req.mode === "navigate" ? fetch(req) : fetch(req, { cache: "no-cache" })).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    const quiet = live.catch(() => null);
    const slow = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
    return Promise.race([quiet, slow]).then((res) => {
      if (res) return res;
      return cache.match(req, { ignoreSearch: true }).then((hit) => hit || quiet.then((r) => r || cache.match("index.html")));
    });
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return;
  if (isFont) {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    }))));
    return;
  }
  event.respondWith(networkFirst(req));
});
