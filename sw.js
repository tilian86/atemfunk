const CACHE = "atemfunk-v18";
const ASSETS = [
  ".",
  "index.html",
  "manifest.json",
  "icon-180.png",
  "icon-512.png",
  "audio/cues/Einatmen.mp3",
  "audio/cues/Halten.mp3",
  "audio/cues/Ausatmen.mp3",
  "audio/m/cues/Einatmen.mp3",
  "audio/m/cues/Halten.mp3",
  "audio/m/cues/Ausatmen.mp3",
  "audio/m/atem-1.mp3",
  "audio/m/atem-3.mp3",
  "audio/m/atem-5.mp3",
  "audio/m/atem-10.mp3",
  "audio/atmo/wald.mp3",
  "audio/atmo/voegel.mp3",
  "audio/atmo/fluss.mp3",
  "audio/atmo/meer.mp3",
  "audio/atmo/klavier.mp3",
  "audio/atem-1.mp3",
  "audio/atem-3.mp3",
  "audio/atem-5.mp3",
  "audio/atem-10.mp3"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(a => c.add(a)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* iOS-Media-Loader fordert Audio mit Range-Headern an und braucht eine echte
   206-Antwort – eine volle 200 aus dem Cache lässt <audio> auf iOS scheitern. */
async function rangeResponse(request) {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (!hit) return fetch(request);
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(request.headers.get("range") || "");
  if (!m) return hit;
  const start = Number(m[1]);
  const end = m[2] ? Math.min(Number(m[2]), buf.byteLength - 1) : buf.byteLength - 1;
  if (start >= buf.byteLength) {
    return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + buf.byteLength } });
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": hit.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": "bytes " + start + "-" + end + "/" + buf.byteLength,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== location.origin) return;

  if (e.request.headers.has("range")) {
    e.respondWith(rangeResponse(e.request));
    return;
  }

  /* HTML netz-zuerst, damit Updates ohne SW-Versionssprung ankommen */
  if (e.request.mode === "navigate" || e.request.destination === "document") {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() =>
        caches.match(e.request, { ignoreSearch: true })
          .then(hit => hit || caches.match("index.html"))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit || fetch(e.request).then(resp => {
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      })
    )
  );
});
