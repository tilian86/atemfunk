/* Atemfunk-Sync: Journal und Gedächtnis auf allen Geräten und Home-Symbolen gleich.

   Jedes Home-Symbol, Safari und die Funkzentrale haben einen eigenen Web-Speicher.
   Damit nichts in einem davon hängen bleibt, liegen Journal (inkl. Bilder und
   Sprachnotizen), Profil, Fäden, Erkenntnisse, Ziele, Modus-Verlauf und die
   Meditations-Statistik zusätzlich beim eigenen Worker (R2 in Florians Cloudflare).

   So funktioniert es:
   - Jeder Eintrag ist ein Datensatz mit Kennung. Die App merkt sich je Datensatz die
     Server-Zeit und eine Prüfsumme des zuletzt abgeglichenen Stands (atemfunk_sync).
     Weicht die Prüfsumme ab, ist der Eintrag hier geändert → er wartet aufs Hochladen.
     Diese Warteschlange ergibt sich also aus den Daten selbst und übersteht Abstürze,
     Funklöcher und Seitenwechsel.
   - Zuerst holen, dann hochladen. Neueres gewinnt. Gelöscht wird nur, was hier
     ausdrücklich gelöscht wurde (Grabstein) – fehlt etwas nur, wird nichts gelöscht.
   - Erster Start nach dem Update: der Abgleich kennt noch nichts, also gilt jeder
     lokale Eintrag als neu und geht hoch. Lokal wird dabei nichts überschrieben. */
"use strict";
(function () {
  if (window.atemSync) return;
  const WORKER = "https://atemfunk-media.florian-s-thiel.workers.dev/";
  const META = "atemfunk_sync", WEG = "atemfunk_sync_weg", LIB = "atemfunk_lib_url";
  const KENN = /^[\w.:-]{1,120}$/;

  const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
  const liesJSON = (k, f) => { try { return JSON.parse(lsGet(k)) ?? f; } catch { return f; } };
  const basis = () => lsGet(LIB) || "";

  /* ---------- Prüfsumme (cyrb53) über eine Darstellung mit sortierten Schlüsseln ---------- */
  function cyrb53(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function stabil(o) {
    if (o === null || typeof o !== "object") return JSON.stringify(o) ?? "null";
    if (Array.isArray(o)) return "[" + o.map(stabil).join(",") + "]";
    return "{" + Object.keys(o).filter(k => o[k] !== undefined && typeof o[k] !== "function").sort()
      .map(k => JSON.stringify(k) + ":" + stabil(o[k])).join(",") + "}";
  }
  const pruef = o => cyrb53(stabil(o));

  /* ---------- Was abgeglichen wird ---------- */
  const nachDatum = (a, b) => String(b.datum || "").localeCompare(String(a.datum || ""));
  const nachIdAb = (a, b) => (+b.id || 0) - (+a.id || 0);
  /* Listen im localStorage: jeder Eintrag einzeln, damit zwei Geräte sich nicht
     gegenseitig ganze Listen überschreiben. ordnung = Reihenfolge, die die Seite erwartet. */
  const LISTEN = {
    faeden: { key: "atemfunk_faeden", max: 12, id: x => x && x.id != null ? String(x.id) : null, ordnung: nachIdAb },
    lernen: { key: "atemfunk_lernen", max: 60, id: x => x && x.text ? "l" + cyrb53((x.datum || "") + "|" + x.text) : null, ordnung: nachDatum },
    ziele: { key: "atemfunk_ziele", max: 20, ordnung: nachDatum,
      id: x => x && (x.ziel || x.plan) ? "z" + cyrb53((x.datum || "") + "|" + (x.ziel || "") + "|" + ((x.plan && x.plan.titel) || "")) : null },
    schema: { key: "atemfunk_schema", max: 30, id: x => x && x.id != null ? String(x.id) : null, ordnung: nachIdAb },
    log: { key: "atemfunk_log", max: 1000, auf: true, id: x => x && Number.isFinite(x.t) ? String(x.t) : null, ordnung: (a, b) => a.t - b.t },
  };
  /* Einzelwerte; bei Gleichzeitigkeit wird zusammengeführt statt blind überschrieben */
  const WERTE = {
    profil: "atemfunk_profil", formen: "atemfunk_formen", rueckblick: "atemfunk_letzter_rueckblick",
    stats: "atemfunk_stats", streak: "atemfunk_streak",
  };
  const parse = s => { try { return JSON.parse(s) || {}; } catch { return {}; } };
  const VEREINEN = {
    profil: (l, s) => (l.length >= s.length ? l : s),          /* das reichere Profil bleibt */
    formen: l => l,
    rueckblick: (l, s) => (l > s ? l : s),
    stats: (l, s) => {
      const a = parse(l), b = parse(s);
      return JSON.stringify({ ...b, ...a, sessions: Math.max(+a.sessions || 0, +b.sessions || 0),
        minutes: Math.max(+a.minutes || 0, +b.minutes || 0) });
    },
    streak: (l, s) => {
      const a = parse(l), b = parse(s);
      const r = String(a.last || "") >= String(b.last || "") ? { ...a } : { ...b };
      if (a.last === b.last) r.count = Math.max(+a.count || 0, +b.count || 0);
      r.best = Math.max(+a.best || 0, +b.best || 0, +r.count || 0);
      return JSON.stringify(r);
    },
  };
  const VERFOLGT = new Set([...Object.values(LISTEN).map(q => q.key), ...Object.values(WERTE)]);

  /* ---------- Abgleich-Gedächtnis dieses Speichers ----------
     m: { "laden:id": [serverZeit, prüfsumme, blobOben] }, stand: letzter Server-Stand */
  function ladeMeta() {
    const m = liesJSON(META, null);
    return m && m.m ? m : { m: {}, stand: "", voll: 0 };
  }
  const sichereMeta = meta => lsSet(META, JSON.stringify(meta));
  /* Ausdrücklich gelöschte Einträge, die noch hoch müssen (eigener Schlüssel,
     damit ein laufender Abgleich sie nicht überschreibt) */
  const liesWeg = () => liesJSON(WEG, {});
  function entferneWeg(key, nurWenn) {
    const w = liesWeg();
    if (nurWenn === undefined || w[key] === nurWenn) { delete w[key]; lsSet(WEG, JSON.stringify(w)); }
  }

  /* ---------- IndexedDB (gleiche Version wie die Seiten!) ---------- */
  let dbVersprechen = null;
  function idb() {
    return dbVersprechen ||= new Promise((res, rej) => {
      const r = indexedDB.open("atemfunk", 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains("tracks")) d.createObjectStore("tracks", { keyPath: "id" });
        if (!d.objectStoreNames.contains("journal")) d.createObjectStore("journal", { keyPath: "id" });
      };
      r.onsuccess = () => { r.result.onversionchange = () => { r.result.close(); dbVersprechen = null; }; res(r.result); };
      r.onerror = () => { dbVersprechen = null; rej(r.error); };
    });
  }
  const jTx = (modus, fn) => idb().then(d => new Promise((res, rej) => {
    const rq = fn(d.transaction("journal", modus).objectStore("journal"));
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  }));
  const jAlle = () => jTx("readonly", s => s.getAll());

  /* Journal-Eintrag in Abgleich-Form: ohne Blob, stattdessen _blob = { typ, n } */
  function jForm(e) {
    const d = {};
    for (const k of Object.keys(e)) if (k !== "blob") d[k] = e[k];
    if (!d._blob && e.blob && typeof e.blob.size === "number") d._blob = { typ: e.blob.type || "", n: e.blob.size };
    return d;
  }

  async function lokalAlles() {
    const m = new Map();
    let journal = [];
    try { journal = await jAlle(); } catch {}
    for (const e of journal) {
      if (!e || !KENN.test(String(e.id))) continue;
      const d = jForm(e);
      m.set("j:" + e.id, { s: "j", id: String(e.id), d, h: pruef(d), roh: e });
    }
    for (const [s, q] of Object.entries(LISTEN)) {
      const l = liesJSON(q.key, []);
      if (!Array.isArray(l)) continue;
      for (const x of l) {
        const id = q.id(x);
        if (id && KENN.test(id)) m.set(s + ":" + id, { s, id, d: x, h: pruef(x) });
      }
    }
    for (const [id, key] of Object.entries(WERTE)) {
      const v = lsGet(key);
      if (v !== null && v !== "") m.set("ls:" + id, { s: "ls", id, d: v, h: pruef(v) });
    }
    return m;
  }
  const istNeu = (l, meta) => { const m = meta.m[l.s + ":" + l.id]; return !m || m[1] !== l.h; };

  /* Änderungen an den Listen sammeln und je Liste einmal schreiben */
  function schreibeListen(aend) {
    for (const [s, ae] of Object.entries(aend)) {
      const q = LISTEN[s];
      let l = liesJSON(q.key, []);
      if (!Array.isArray(l)) l = [];
      for (const [id, d] of ae) {
        l = l.filter(x => q.id(x) !== id);
        if (d !== null) l.push(d);
      }
      l.sort(q.ordnung);
      /* gleiche Obergrenzen wie die Seiten; der Server behält trotzdem alles */
      if (l.length > q.max) l = q.auf ? l.slice(-q.max) : l.slice(0, q.max);
      lsSet(q.key, JSON.stringify(l));
    }
  }

  /* ---------- Netz ---------- */
  async function api(pfad, opt) {
    const r = await fetch(basis() + pfad, { cache: "no-store", ...(opt || {}) });
    if (!r.ok) { const f = new Error("HTTP " + r.status); f.status = r.status; throw f; }
    return r;
  }
  const postJSON = (pfad, daten) => api(pfad, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(daten),
  }).then(r => r.json());

  /* ---------- Ein Abgleich ---------- */
  let laeuft = false, nochmal = false, wiederholt = 0, fehler = "", warten = 0, eintraege = null, erster = true;
  const fehlendeBlobs = new Set();

  async function lauf(opt) {
    opt = opt || {};
    if (!basis()) { zeige(); return; }
    if (laeuft) { nochmal = true; return; }
    laeuft = true; zeige();
    let geaendert = false;
    try {
      const meta = ladeMeta();
      let lokal = await lokalAlles();
      let weg = liesWeg();

      /* 1) Was hat der Server? Bleibt der Stand gleich, gibt es nichts zu holen. */
      const voll = opt.voll || !meta.stand || Date.now() - (meta.voll || 0) > 6 * 3600e3;
      const liste = await api("sync/liste" + (voll ? "" : "?wenn=" + encodeURIComponent(meta.stand))).then(r => r.json());
      if (!liste.gleich) {
        /* Die Liste ist immer vollständig (inkl. Grabsteinen). Fehlt dort, was hier als
           abgeglichen gilt, hat der Speicher es verloren → von hier aus neu hochladen. */
        const daOben = new Set((liste.recs || []).map(r => r[0] + ":" + r[1]));
        for (const key of Object.keys(meta.m)) if (!daOben.has(key)) delete meta.m[key];
        const holen = [], aend = {};
        const listeAend = (s, id, d) => { (aend[s] ||= new Map()).set(id, d); };
        for (const [s, id, t, del] of liste.recs || []) {
          if (!(s === "j" || s === "ls" || LISTEN[s])) continue;   /* unbekannt (neuere App): nicht anfassen */
          const key = s + ":" + id, m = meta.m[key], l = lokal.get(key);
          if (!m || t > m[0]) {
            if (!del) { holen.push([s, id]); continue; }
            /* Grabstein vom Server: nur löschen, was hier unverändert ist */
            if (l && istNeu(l, meta)) continue;
            if (l) {
              if (s === "j") await jTx("readwrite", st => st.delete(l.roh.id));
              else if (s !== "ls") listeAend(s, id, null);
              geaendert = true;
            }
            meta.m[key] = [t, null, 0];
            if (weg[key]) entferneWeg(key);
          } else if (!del && s === "j" && !l && !weg[key]) {
            holen.push([s, id]);       /* hier verschwunden (Speicher geleert?) → zurückholen */
          }
        }
        for (let i = 0; i < holen.length; i += 40) {
          const { recs } = await postJSON("sync/hole", { keys: holen.slice(i, i + 40) });
          for (const rec of recs || []) {
            const key = rec.s + ":" + rec.id, m = meta.m[key], l = lokal.get(key);
            if (weg[key]) {                       /* hier gelöscht – wer war später? */
              if (weg[key] > rec.t) continue;
              entferneWeg(key); delete weg[key];
            }
            if (rec.del) {
              if (l && !istNeu(l, meta)) {
                if (rec.s === "j") await jTx("readwrite", st => st.delete(l.roh.id));
                else if (rec.s !== "ls") listeAend(rec.s, rec.id, null);
                geaendert = true;
              }
              if (!l || !istNeu(l, meta)) meta.m[key] = [rec.t, null, 0];
              continue;
            }
            const hs = pruef(rec.d);
            const blobOben = rec.s === "j" && rec.d && rec.d._blob ? 1 : 0;
            if (l && l.h === hs) { meta.m[key] = [rec.t, hs, blobOben]; continue; }
            if (l && istNeu(l, meta)) {
              /* Hier und dort geändert (oder erster Abgleich mit Gleichem auf beiden Seiten) */
              if (rec.s === "ls") {
                const v = (VEREINEN[rec.id] || (a => a))(l.d, String(rec.d));
                if (v !== String(rec.d)) {
                  if (v !== l.d) { lsSet(WERTE[rec.id], v); geaendert = true; }
                  meta.m[key] = [rec.t, "konflikt", 0];
                  continue;                      /* zusammengeführt → geht gleich hoch */
                }
              } else if (!(rec.s === "j" && (+(rec.d && rec.d.zeit) || 0) > (+l.d.zeit || 0))) {
                meta.m[key] = [rec.t, "konflikt", 0];
                continue;                        /* hier gilt die eigene Fassung → geht hoch */
              }
            }
            /* Übernehmen */
            if (rec.s === "j") {
              const e = { ...rec.d };
              const alt = l && l.roh && l.roh.blob;
              if (alt && e._blob && alt.size === e._blob.n) e.blob = alt;
              await jTx("readwrite", st => st.put(e));
            } else if (rec.s === "ls") {
              /* noch nie abgeglichener eigener Wert: vorsichtshalber hier aufheben */
              if (l && istNeu(l, meta)) lsSet("atemfunk_sync_vorher_" + rec.id, l.d);
              if (WERTE[rec.id]) lsSet(WERTE[rec.id], String(rec.d));
            } else listeAend(rec.s, rec.id, rec.d);
            meta.m[key] = [rec.t, hs, blobOben];
            geaendert = true;
          }
          schreibeListen(aend);
          for (const k of Object.keys(aend)) delete aend[k];
          sichereMeta(meta);
        }
        schreibeListen(aend);
        meta.stand = liste.stand;
        if (voll) meta.voll = Date.now();
        sichereMeta(meta);
      }

      /* 2) Hochladen: alles, was hier neu oder geändert ist, plus Grabsteine */
      lokal = await lokalAlles();
      weg = liesWeg();
      const raus = [];
      for (const l of lokal.values()) if (istNeu(l, meta)) raus.push(l);
      for (const [key, t] of Object.entries(weg)) {
        if (lokal.has(key)) { entferneWeg(key, t); continue; }   /* doch wieder da */
        const i = key.indexOf(":");
        raus.push({ grab: true, s: key.slice(0, i), id: key.slice(i + 1), t });
      }
      warten = raus.length; zeige();
      for (let i = 0; i < raus.length; i += 30) {
        const pak = raus.slice(i, i + 30), recs = [];
        for (const x of pak) {
          const key = x.s + ":" + x.id, m = meta.m[key];
          const t = Math.max(x.grab ? x.t : Date.now(), (m ? m[0] : 0) + 1);
          if (x.grab) { recs.push({ s: x.s, id: x.id, t, del: 1 }); continue; }
          x.blobOben = m ? m[2] : 0;
          if (x.s === "j" && x.roh && x.roh.blob && !x.blobOben) {
            try {
              await api("sync/blob/j/" + encodeURIComponent(x.id), {
                method: "PUT", body: x.roh.blob,
                headers: { "content-type": x.roh.blob.type || "application/octet-stream" },
              });
              x.blobOben = 1;
            } catch (e) { if (e.status !== 413) throw e; }   /* zu groß: Text trotzdem sichern */
          } else if (x.s === "j" && x.d._blob && !x.roh.blob) x.blobOben = 1;
          recs.push({ s: x.s, id: x.id, t, d: x.d });
        }
        const a = await postJSON("sync/schreibe", { recs });
        let abgelehnt = false;
        for (const e of a.ergebnis || []) {
          const key = e.s + ":" + e.id, x = pak.find(p => p.s === e.s && p.id === e.id);
          if (!x) continue;
          if (e.ok) {
            meta.m[key] = x.grab ? [e.t, null, 0] : [e.t, x.h, x.blobOben || 0];
            if (x.grab) entferneWeg(key, x.t);
          } else if (e.t) {
            abgelehnt = true;                 /* dort ist Neueres – beim nächsten Holen übernehmen */
            if (x.grab) entferneWeg(key, x.t);
          }
        }
        meta.stand = !abgelehnt && a.vorher === meta.stand ? a.stand : "";
        sichereMeta(meta);
        warten = Math.max(0, raus.length - i - pak.length); zeige();
        if (abgelehnt) nochmal = true;
      }

      /* 3) Bilder und Sprachnotizen, die von anderswo kamen, nachladen */
      let journal = [];
      try { journal = await jAlle(); } catch {}
      for (const e of journal) {
        if (!e || !e._blob || e.blob || fehlendeBlobs.has(e.id)) continue;
        try {
          const r = await api("sync/blob/j/" + encodeURIComponent(e.id));
          const b = new Blob([await r.arrayBuffer()], { type: e._blob.typ || "" });
          const cur = await jTx("readonly", st => st.get(e.id));
          if (cur && !cur.blob) { cur.blob = b; await jTx("readwrite", st => st.put(cur)); geaendert = true; }
        } catch (f) { if (f.status === 404) fehlendeBlobs.add(e.id); else break; }
      }
      fehler = "";
      wiederholt = 0;
    } catch (e) {
      fehler = !navigator.onLine || e instanceof TypeError ? "offline"
        : e.status === 404 ? "Link ungültig" : "Fehler " + (e.status || "");
    } finally {
      laeuft = false; erster = false;
      await zaehle();
      zeige();
      if (geaendert) window.dispatchEvent(new Event("atemfunk-sync"));
      if (nochmal && wiederholt < 2) { nochmal = false; wiederholt++; setTimeout(lauf, 400); }
      else nochmal = false;
    }
  }

  async function zaehle() {
    if (!basis()) { warten = 0; return; }
    const meta = ladeMeta(), lokal = await lokalAlles();
    let w = Object.keys(liesWeg()).length, n = 0;
    for (const l of lokal.values()) { if (istNeu(l, meta)) w++; if (l.s === "j") n++; }
    warten = w; eintraege = n;
  }

  /* ---------- Anzeige „☁️ synchron · N Einträge“ ---------- */
  function stil() {
    if (document.getElementById("syncStil")) return;
    const st = document.createElement("style");
    st.id = "syncStil";
    st.textContent = `.sync-pill{display:inline-block;align-self:center;font-size:11.5px;line-height:1.3;color:var(--ink-dim,#9aa5c8);
      background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:99px;padding:4px 11px;
      margin:-12px 0 16px;cursor:pointer;-webkit-user-select:none;user-select:none;max-width:100%}
      .sync-pill.warn{color:var(--gold,#d8c48f);border-color:rgba(216,196,143,.3)}
      #home .sync-pill{margin:-18px 0 22px}`;
    document.head.appendChild(st);
  }
  function anzeige() {
    let el = document.getElementById("syncAnzeige");
    if (!el) {
      const nach = document.querySelector(".wrap .sub") || document.querySelector(".wrap h1");
      if (!nach) return null;
      el = document.createElement("div");
      el.id = "syncAnzeige";
      nach.after(el);
    }
    if (!el.dataset.bereit) {
      stil();
      el.dataset.bereit = "1";
      el.classList.add("sync-pill");
      el.setAttribute("role", "button");
      el.tabIndex = 0;
      el.setAttribute("aria-live", "polite");
      el.addEventListener("click", () => (basis() ? lauf({ voll: true }) : verbindenDialog()));
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
    }
    return el;
  }
  function zeige() {
    const el = anzeige();
    if (!el) return;
    let text, warn = false;
    if (!basis()) { text = "☁️ Sync aus · tippen zum Verbinden"; warn = true; }
    else if (warten > 0) {
      text = "⏳ " + warten + " warten" + (fehler ? " · " + fehler : laeuft ? " · lädt hoch …" : "");
      warn = !!fehler;
    }
    else if (fehler) { text = "⚠️ Sync: " + fehler + " · tippen"; warn = true; }
    else if (laeuft && erster) text = "☁️ gleicht ab …";
    else text = "☁️ synchron · " + (eintraege ?? "…") + (eintraege === 1 ? " Eintrag" : " Einträge");
    el.textContent = text;
    el.classList.toggle("warn", warn);
    el.title = basis() ? "Journal und Gedächtnis werden mit deinem eigenen Speicher abgeglichen. Tippen = jetzt abgleichen."
      : "PIN eingeben, dann ist alles auf diesem Gerät.";
  }

  /* ---------- Verbinden: PIN (oder der alte Bibliotheks-Link) ---------- */
  async function verbindenDialog() {
    const ein = (prompt("PIN eingeben – oder den Bibliotheks-Link einfügen:") || "").trim();
    if (!ein) return null;
    let b = "";
    if (/^\d{4,8}$/.test(ein)) {
      try {
        const r = await fetch(WORKER + "verbinden", {
          method: "POST", cache: "no-store", headers: { "content-type": "application/json" },
          body: JSON.stringify({ pin: ein }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.basis) { alert(d.error || "Verbinden hat nicht geklappt."); return null; }
        b = d.basis;
      } catch { alert("Keine Verbindung – bitte gleich nochmal."); return null; }
    } else if (/^https:\/\/\S+$/.test(ein)) b = ein.endsWith("/") ? ein : ein + "/";
    else { alert("Das ist weder eine PIN noch ein Link."); return null; }
    lsSet(LIB, b);
    window.dispatchEvent(new Event("atemfunk-verbunden"));
    lauf({ voll: true });
    return b;
  }

  /* ---------- Anstoßen ---------- */
  let zeitgeber = null;
  function anstossen(key) {
    if (key && !VERFOLGT.has(key)) return;
    if (!laeuft) zaehle().then(zeige).catch(() => {});      /* „⏳ N warten“ sofort zeigen */
    clearTimeout(zeitgeber);
    zeitgeber = setTimeout(() => lauf(), 1500);
  }
  /* Ausdrücklich gelöscht: als Grabstein vormerken */
  function weg(s, id) {
    id = String(id);
    if (!KENN.test(id)) return;
    const w = liesWeg();
    w[s + ":" + id] = Date.now();
    lsSet(WEG, JSON.stringify(w));
    anstossen();
  }
  function wegItem(s, item) { const q = LISTEN[s]; const id = q && q.id(item); if (id) weg(s, id); }

  window.atemSync = { lauf, anstossen, weg, wegItem, verbindenDialog, zustand: () => ({ warten, eintraege, fehler, laeuft }) };

  function start() {
    zeige();
    zaehle().then(zeige);
    setTimeout(() => lauf(), 300);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") lauf(); });
    window.addEventListener("online", () => lauf());
    setInterval(() => { if (document.visibilityState === "visible") lauf(); }, 60000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
