/* Pushfunk: Push-Empfang mit dem Atemfunk-Symbol (zentral gepflegt in ~/Projects/apps/pushfunk/public/).
   Ändert sich pushfunk-push.js, hier ?v= UND CACHE hochzählen. */
importScripts("pushfunk-push.js?v=1");

const CACHE = "atemfunk-v46";   /* Nummer steht auch unten auf der Startseite (index.html #appVersion) – mitziehen */
/* Grundausstattung sofort. Alles Weitere (männliche Stimme, Programme,
   andere Klangkulissen) landet automatisch im Cache, sobald es einmal lief. */
const ASSETS = [
  ".",
  "index.html",
  "manifest.json",
  "app.css",
  "fragen.json",
  "shared.js",
  "sync.js",
  "schema.html",
  "journal.html",
  "ziele.html",
  "statistik.html",
  "icon-180.png",
  "icon-512.png",
  "audio/cues/Einatmen.mp3",
  "audio/cues/Halten.mp3",
  "audio/cues/Ausatmen.mp3",
  "audio/cues/Nachatmen.mp3",
  "audio/abschluss/ende.mp3",
  "audio/atem-1.mp3",
  "audio/atem-3.mp3",
  "audio/atem-5.mp3",
  "audio/atem-7.mp3",
  "audio/atem-10.mp3",
  "audio/atmo/wald.mp3",
  "flex.json"
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
const holtGerade = new Set();
async function rangeResponse(request, e) {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (!hit) {
    /* iOS lädt Ton ausschließlich in Häppchen – Teilantworten kann man nicht ablegen.
       Deshalb nebenbei einmal die ganze Datei holen, damit sie beim nächsten Mal
       offline da ist (sonst wäre auf dem iPhone nur die Grundausstattung offline). */
    const url = request.url;
    if (!holtGerade.has(url)) {
      holtGerade.add(url);
      e.waitUntil(caches.open(CACHE).then(c => c.add(url)).catch(() => {}).finally(() => holtGerade.delete(url)));
    }
    return fetch(request);
  }
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

/* Netz zuerst — aber nicht ewig. Ein hängendes Mobilfunknetz (Bank im Wald,
   halbe Empfangsbalken) meldet keinen Fehler, sondern wartet: die App blieb
   dann bis zu einer Minute weiß. Nach NETZ_FRIST kommt die gespeicherte
   Fassung; die Netzantwort läuft trotzdem zu Ende und frischt den Cache auf. */
const NETZ_FRIST = 4000;
async function netzZuerst(e) {
  const req = e.request;
  let gemerkt = Promise.resolve();
  const ausNetz = fetch(req).then(resp => {
    if (resp.ok) {
      const copy = resp.clone();
      gemerkt = caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
    }
    return resp;
  });
  e.waitUntil(ausNetz.then(() => gemerkt).catch(() => {}));
  let uhr;
  const frist = new Promise(ok => { uhr = setTimeout(() => ok("spaet"), NETZ_FRIST); });
  const erster = await Promise.race([ausNetz.catch(() => "weg"), frist]);
  clearTimeout(uhr);
  if (erster !== "spaet" && erster !== "weg") return erster;
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  if (erster === "spaet") {
    try { return await ausNetz; } catch (err) {}
  }
  /* index.html als Ersatz nur für Seiten — nicht als Antwort auf ein Skript */
  if (req.mode === "navigate") {
    const start = await caches.match("index.html");
    if (start) return start;
  }
  return Response.error();
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== location.origin) return;

  if (e.request.headers.has("range")) {
    e.respondWith(rangeResponse(e.request, e));
    return;
  }

  /* Seiten UND Code (JS, CSS, JSON) netz-zuerst, damit Updates ohne
     SW-Versionssprung ankommen. Nur HTML reichte nicht: der Cache unten
     vergleicht mit ignoreSearch, dadurch waren die ?v=-Marken wirkungslos,
     und ein geändertes shared.js blieb hängen, bis CACHE hochgezählt wurde.
     Audio und Bilder bleiben cache-zuerst — die sind groß und ändern sich nie. */
  const pfad = new URL(e.request.url).pathname;
  if (e.request.mode === "navigate" || e.request.destination === "document"
      || /\.(js|css|json)$/.test(pfad)) {
    e.respondWith(netzZuerst(e));
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
