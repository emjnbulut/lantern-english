/* Lantern English service worker: fresh files whenever online, cached copy when offline.
   VERSION is stamped by tools/make-site.mjs; "dev" means an unstamped checkout. */
const VERSION = "9d5321d38e";
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

// Videos the reader downloaded (app.js stores them in VIDEO_CACHE). The name has no "lantern-" prefix,
// so version updates never delete it. Served with byte ranges because players seek with Range requests.
const VIDEO_CACHE = "offline-videos-v1";
let offlineVideos = null; // Set of cached video URLs; null while loading
function loadOfflineVideos() {
  return caches.open(VIDEO_CACHE).then((c) => c.keys())
    .then((keys) => { offlineVideos = new Set(keys.map((r) => r.url)); })
    .catch(() => { offlineVideos = new Set(); });
}
loadOfflineVideos();
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "offline-videos-changed") event.waitUntil(loadOfflineVideos());
});

function offlineVideo(req, key) {
  return caches.open(VIDEO_CACHE).then((cache) => cache.match(key)).then((hit) => {
    if (!hit) return fetch(req);
    const range = req.headers.get("range");
    if (!range) return hit;
    return hit.blob().then((blob) => {
      const size = blob.size;
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m && m[1] ? Number(m[1]) : 0;
      let end = m && m[2] ? Number(m[2]) : size - 1;
      if (m && !m[1] && m[2]) { start = Math.max(0, size - Number(m[2])); end = size - 1; }
      end = Math.min(end, size - 1);
      if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
      return new Response(blob.slice(start, end + 1), { status: 206, headers: {
        "Content-Type": hit.headers.get("Content-Type") || "video/mp4",
        "Content-Range": "bytes " + start + "-" + end + "/" + size,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
      } });
    });
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && /\.(mp4|m4v|webm)$/i.test(url.pathname)) {
    const key = url.origin + url.pathname + url.search;
    if (offlineVideos && !offlineVideos.has(key)) return; // not downloaded: the browser streams it as before
    event.respondWith(offlineVideo(req, key));
    return;
  }
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
