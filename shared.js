/* Gemeinsame Bausteine: Navigation, Speicher, Diktat, Vorlesen, KI-Zugang */
"use strict";
const $ = id => document.getElementById(id);

/* ---------- Navigation ---------- */
(function nav() {
  const seiten = [
    ["index.html", "🌙", "Atmen"],
    ["schema.html", "🧭", "Modus"],
    ["journal.html", "📓", "Journal"],
    ["ziele.html", "🎯", "Ziele"],
  ];
  let hier = (location.pathname.split("/").pop() || "index.html");
  if (hier === "statistik.html") hier = "index.html";   /* Statistik gehört zu „Atmen“ */
  const el = document.createElement("nav");
  el.className = "nav";
  el.innerHTML = seiten.map(([href, ico, txt]) =>
    `<a href="${href}" class="${href === hier ? "sel" : ""}"><span class="ico">${ico}</span>${txt}</a>`).join("");
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(el));
})();

/* ---------- Speicher ---------- */
const store = {
  get(k, f) { try { const v = localStorage.getItem(k); return v === null ? f : v; } catch { return f; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  getJSON(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } },
  setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("atemfunk", 2);
    r.onupgradeneeded = e => {
      const d = r.result;
      if (!d.objectStoreNames.contains("tracks")) d.createObjectStore("tracks", { keyPath: "id" });
      if (!d.objectStoreNames.contains("journal")) d.createObjectStore("journal", { keyPath: "id" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function dbTx(laden, modus, fn) {
  return db().then(d => new Promise((res, rej) => {
    const tx = d.transaction(laden, modus);
    const rq = fn(tx.objectStore(laden));
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  }));
}

/* ---------- KI über die Mac-Bridge (Max-Abo, kein API-Schlüssel) ---------- */
function kiBasis() { return store.get("atemfunk_lib_url", ""); }

/* Zeigt während der Wartezeit die Sekunden – die Antwort braucht typisch 15–30 s */
function warteAnzeige(knopf, beschriftung) {
  const start = Date.now();
  const t = setInterval(() => {
    knopf.textContent = beschriftung + " " + Math.round((Date.now() - start) / 1000) + " s";
  }, 1000);
  knopf.disabled = true;
  knopf.textContent = beschriftung;
  return endtext => { clearInterval(t); knopf.disabled = false; knopf.textContent = endtext; };
}

async function frageKI(system, user, model, rid) {
  const basis = kiBasis();
  if (!basis) return { fehler: "Noch nicht verbunden." };
  const abbruch = new AbortController();
  const zeitlimit = setTimeout(() => abbruch.abort(), 120000);
  try {
    /* Rolle bewusst im Nutzertext statt im system-Feld: die CLI behandelt
       eingebettete <system>-Blöcke misstrauisch und verweigert sie mitunter. */
    const r = await fetch(basis + "ki", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ system: "", user: system + "\n\n---\n\n" + user, model: model || "opus", rid }),
      signal: abbruch.signal,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error || !d.text)
      return { fehler: d.error || "Unerwartete Antwort (" + r.status + ").", nochmal: true };
    return { text: (d.text || "").trim() };
  } catch (e) {
    return { fehler: e.name === "AbortError" ? "Zu lange gewartet – nochmal?" : "Keine Verbindung.",
             nochmal: true, abgerissen: true };
  } finally {
    clearTimeout(zeitlimit);
  }
}

/* ---------- Antworten überleben einen Seitenwechsel ----------
   Jede Anfrage bekommt eine Kennung, der Worker legt die fertige Antwort darunter ab.
   Wechselt Florian beim Warten die Seite oder sperrt das iPhone, holt die Seite die
   Antwort beim nächsten Öffnen ab, statt sie zu verlieren. */
function neueKennung() {
  return crypto.randomUUID ? crypto.randomUUID()
    : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}

/* Fragt alle 3 s nach der hinterlegten Antwort, höchstens bis `bis` */
async function holeKI(rid, bis) {
  const basis = kiBasis();
  while (basis) {
    try {
      const r = await fetch(basis + "ki/" + encodeURIComponent(rid), { cache: "no-store" });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        return d.text ? { text: d.text.trim() } : { fehler: d.error || "Die Antwort kam leer an.", nochmal: true };
      }
    } catch {}
    if (Date.now() > bis) break;
    await new Promise(w => setTimeout(w, 3000));
  }
  return { fehler: "Die Antwort ist unterwegs verloren gegangen – bitte nochmal senden.", nochmal: true };
}

/* Wie frageKI, merkt sich die Anfrage aber unter `schluessel`, bis die Antwort da ist.
   { ueberholt: true } = eine andere Stelle hat die Antwort schon übernommen. */
async function frageKIgemerkt(schluessel, info, system, user, model) {
  const rid = neueKennung(), start = Date.now();
  store.setJSON(schluessel, { ...info, rid, start });
  let r = await frageKI(system, user, model, rid);
  if (r.abgerissen) r = await holeKI(rid, start + 150000);
  if ((store.getJSON(schluessel, null) || {}).rid !== rid) return { ueberholt: true };
  localStorage.removeItem(schluessel);
  return r;
}

/* Beim Öffnen der Seite: noch eine Anfrage von vorhin offen? Dann deren Antwort abholen */
async function offeneAnfrage(schluessel) {
  const o = store.getJSON(schluessel, null);
  if (!o || !o.rid) return null;
  const r = await holeKI(o.rid, o.start + 150000);
  if ((store.getJSON(schluessel, null) || {}).rid !== o.rid) return null;
  localStorage.removeItem(schluessel);
  return { ...r, info: o };
}

/* Zeigt den echten Grund statt pauschal „Mac nicht erreichbar“ */
function zeigeFehler(r, feldId) {
  const el = $(feldId || "hinweis");
  if (!el) return;
  if (!kiBasis()) {
    el.innerHTML = "Noch nicht verbunden – öffne <a href='index.html' style='color:var(--accent)'>Atmen</a> "
      + "und tippe unten auf „Bibliothek verbinden“.";
    return;
  }
  el.textContent = r.fehler + (r.nochmal ? " Der Prompt unten funktioniert immer, auch in ChatGPT." : "");
}

/* ---------- Gedächtnis: was über Florian bekannt ist ----------
   Ein wachsendes Kurzprofil plus offene Fäden, an denen weitergefragt wird. */
function profil() { return store.get("atemfunk_profil", ""); }
function setzeProfil(t) { if (t && t.length > 20) store.set("atemfunk_profil", t.slice(0, 2200)); }

function faeden() { return store.getJSON("atemfunk_faeden", []); }
function merkeFaden(text) {
  if (!text || text.length < 10) return;
  const l = faeden();
  if (l.some(f => f.text.slice(0, 40) === text.slice(0, 40))) return;   /* keine Dubletten */
  l.unshift({ id: Date.now(), datum: heute(), text: text.trim() });
  store.setJSON("atemfunk_faeden", l.slice(0, 12));
}
function schliesseFaden(id) {
  store.setJSON("atemfunk_faeden", faeden().filter(f => f.id !== id));
}

/* Der gemeinsame Kontextblock für alle Bereiche */
function kontextBlock(lernen) {
  const teile = [];
  const p = profil();
  if (p) teile.push("Was du über Florian schon weißt:\n" + p);
  if (lernen && lernen.length)
    teile.push("Was er sich selbst gemerkt hat:\n" + lernen.map(e => "- " + e.text).join("\n"));
  const f = faeden();
  if (f.length) {
    const alt = f.filter(x => x.datum !== heute());
    if (alt.length) teile.push(
      "Offene Fäden aus früheren Gesprächen (frag nach, wenn heute etwas dazu passt – aber nur dann):\n"
      + alt.slice(0, 5).map(x => `- (${x.datum}) ${x.text}`).join("\n"));
  }
  return teile.length ? teile.join("\n\n") + "\n\n" : "";
}

/* Der Auftrag, das Gedächtnis mitzupflegen – wird an Prompts angehängt */
const META_AUFTRAG = `

Zum Schluss, nach deiner eigentlichen Antwort, zwei technische Zeilen (sie werden ausgeblendet):
THEMEN: <150–400 Zeichen. Das aktualisierte Kurzprofil über Florian: wiederkehrende Themen,
was ihm hilft, was ihn bremst, was ihm wichtig ist. Übernimm Bestehendes und ergänze nur,
was heute wirklich dazugekommen ist. Keine Aufzählung von Tagesereignissen.>
FADEN: <ein einziger offener Punkt, an dem du beim nächsten Mal anknüpfen willst – als Frage
formuliert. Wenn heute nichts offen blieb: das Wort keiner>`;

/* Trennt Form-, Themen- und Faden-Zeilen vom sichtbaren Text und pflegt das Gedächtnis */
function verarbeiteAntwort(text) {
  const form = (text.match(/^\s*FORM:\s*(.+)$/im) || [])[1] || "";
  const themen = (text.match(/^\s*THEMEN:\s*([\s\S]*?)(?=^\s*(?:FADEN|FORM):|\s*$)/im) || [])[1] || "";
  const faden = (text.match(/^\s*FADEN:\s*(.+)$/im) || [])[1] || "";
  setzeProfil(themen.trim());
  if (faden && !/^keiner\b/i.test(faden.trim())) merkeFaden(faden.trim());
  const rest = text
    .replace(/^\s*FORM:.*$/im, "")
    .replace(/^\s*THEMEN:[\s\S]*?(?=^\s*FADEN:|$)/im, "")
    .replace(/^\s*FADEN:.*$/im, "")
    .trim();
  return { form: form.trim(), text: rest };
}

/* ---------- Diktat mit sichtbaren Wellen ---------- */
/* Zeigt beim Sprechen einen Pegelausschlag, damit klar ist: es hört zu.
   Bevorzugt echte Mikrofonpegel; wo das nicht geht (iOS gibt das Mikrofon
   der Spracherkennung exklusiv), pulsiert die Welle beim Erkennen von Wörtern. */
function wellen(feld) {
  const c = document.createElement("canvas");
  c.className = "wellen";
  c.height = 40; c.width = 600;
  feld.parentNode.insertBefore(c, feld.nextSibling);
  const ctx = c.getContext("2d");
  let werte = new Array(48).fill(0), lauf = null, strom = null, analyse = null, puls = 0;

  function zeichne() {
    const b = c.width, h = c.height;
    ctx.clearRect(0, 0, b, h);
    const stil = getComputedStyle(document.documentElement);
    ctx.fillStyle = (stil.getPropertyValue("--accent") || "#7fb8d8").trim();
    const breite = b / werte.length;
    for (let i = 0; i < werte.length; i++) {
      const hoehe = Math.max(2, werte[i] * h * 0.9);
      ctx.globalAlpha = 0.35 + werte[i] * 0.65;
      ctx.fillRect(i * breite + 1, (h - hoehe) / 2, breite - 2, hoehe);
    }
    ctx.globalAlpha = 1;
  }
  function schritt() {
    let pegel;
    if (analyse) {
      const daten = new Uint8Array(analyse.frequencyBinCount);
      analyse.getByteTimeDomainData(daten);
      let summe = 0;
      for (const v of daten) summe += (v - 128) * (v - 128);
      pegel = Math.min(1, Math.sqrt(summe / daten.length) / 40);
    } else {
      puls *= 0.90;
      pegel = Math.min(1, puls + 0.05 + Math.random() * 0.04);
    }
    werte.push(pegel); werte.shift();
    zeichne();
    lauf = requestAnimationFrame(schritt);
  }
  return {
    async an() {
      c.classList.add("aktiv");
      try {
        strom = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctxA = new (window.AudioContext || window.webkitAudioContext)();
        analyse = ctxA.createAnalyser(); analyse.fftSize = 512;
        ctxA.createMediaStreamSource(strom).connect(analyse);
        analyse._ctx = ctxA;
      } catch { analyse = null; }
      schritt();
    },
    aus() {
      c.classList.remove("aktiv");
      cancelAnimationFrame(lauf); lauf = null;
      werte = new Array(48).fill(0); zeichne();
      if (strom) { strom.getTracks().forEach(t => t.stop()); strom = null; }
      if (analyse && analyse._ctx) { try { analyse._ctx.close(); } catch {} }
      analyse = null;
    },
    schlag() { puls = Math.min(1, puls + 0.5); },
  };
}

/* ---------- Diktat: ein Zustandsautomat, ein Klick-Handler ----------
   Mit Verbindung: aufnehmen → Gemini schreibt (genau, auch bei langen Texten).
   Ohne Verbindung: eingebaute Browser-Erkennung. Nie beides gleichzeitig. */
function diktat(feld, knopf) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const welle = wellen(feld);
  let zustand = "frei";          // frei | aufnahme | schreibt | browser
  let rec = null, strom = null, teile = [], erk = null, startZeit = 0, uhr = null;

  const anfuegen = t => {
    feld.value = (feld.value ? feld.value.trimEnd() + " " : "") + t.trim();
    feld.scrollTop = feld.scrollHeight;
    feld.dispatchEvent(new Event("input"));
  };
  const zeigeFrei = () => {
    zustand = "frei"; clearInterval(uhr);
    knopf.disabled = false; knopf.classList.remove("on"); knopf.textContent = "🎙 Diktieren";
    welle.aus();
  };

  async function aufnahmeStart() {
    try { strom = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { zustand = "frei"; return browserStart(); }
    rec = new MediaRecorder(strom); teile = [];
    rec.ondataavailable = e => { if (e.data.size) teile.push(e.data); };
    rec.onstop = uebertragen;
    rec.start();
    zustand = "aufnahme"; startZeit = Date.now();
    knopf.classList.add("on");
    uhr = setInterval(() => {
      const s = Math.round((Date.now() - startZeit) / 1000);
      knopf.textContent = "⏹ Fertig · " + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }, 500);
    knopf.textContent = "⏹ Fertig";
    welle.an();
  }
  async function uebertragen() {
    strom.getTracks().forEach(t => t.stop());
    zustand = "schreibt"; clearInterval(uhr);
    knopf.classList.remove("on"); knopf.disabled = true; knopf.textContent = "Schreibt …";
    welle.aus();
    const blob = new Blob(teile, { type: rec.mimeType || "audio/webm" });
    if (blob.size < 1500) { zeigeFrei(); return; }
    try {
      const fd = new FormData();
      fd.append("audio", blob, "notiz." + ((rec.mimeType || "").includes("mp4") ? "m4a" : "webm"));
      const r = await fetch(kiBasis() + "stt", { method: "POST", body: fd });
      const d = await r.json();
      if (d.text) anfuegen(d.text);
      else if ($("hinweis")) $("hinweis").textContent = "Nichts verstanden – nochmal?";
    } catch {
      if ($("hinweis")) $("hinweis").textContent = "Übertragung fehlgeschlagen – nochmal?";
    }
    zeigeFrei();
  }

  function browserStart() {
    if (!SR) { zeigeFrei(); return; }
    erk = new SR();
    erk.lang = "de-DE"; erk.continuous = true; erk.interimResults = true;
    const start = feld.value ? feld.value.trimEnd() + " " : "";
    /* Fertige Abschnitte getrennt sammeln: Ereignisse liefern ab resultIndex nur das Neue */
    let fest = "";
    erk.onresult = e => {
      let vorlaeufig = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fest += r[0].transcript.trim() + " "; else vorlaeufig += r[0].transcript;
      }
      feld.value = start + fest + vorlaeufig;
      feld.scrollTop = feld.scrollHeight;
      welle.schlag();
    };
    erk.onspeechstart = () => welle.schlag();
    erk.onend = zeigeFrei; erk.onerror = zeigeFrei;
    erk.start();
    zustand = "browser";
    knopf.classList.add("on"); knopf.textContent = "⏹ Fertig";
    welle.an();
  }

  if (!SR && !navigator.mediaDevices) { knopf.style.display = "none"; return; }
  knopf.addEventListener("click", () => {
    if (zustand === "aufnahme") { rec.stop(); return; }
    if (zustand === "browser") { erk && erk.stop(); return; }
    if (zustand === "schreibt") return;
    if (kiBasis() && navigator.mediaDevices && window.MediaRecorder) aufnahmeStart();
    else browserStart();
  });
}

/* ---------- Vorlesen: echte Stimme über den Sprachdienst, sonst Systemstimme ----------
   iOS spielt Ton nur, wenn play() direkt im Fingertipp startet – die Stimme braucht aber
   Sekunden (lange Antworten über 15 s). Deshalb schaltet schon der Tipp ein festes
   Audio-Element mit einem stillen Schnipsel frei, und der Text kommt in Häppchen:
   das erste ist kurz und klingt nach 1–2 s, das nächste lädt, während das vorige läuft. */
const STILLE = "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACA"
  + "gICA".repeat(133);
const leseAudio = new Audio();
let leseLauf = 0, leseKnopf = null, leseWeiter = null;

/* Im Fingertipp aufrufen – auch bei Knöpfen, deren Antwort erst später vorgelesen wird */
function vorleseFreigabe() {
  if (leseAudio.paused) { leseAudio.src = STILLE; leseAudio.play().catch(() => {}); }
  try {
    if ("speechSynthesis" in window && !speechSynthesis.speaking) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  } catch {}
}

function vorleseStopp() {
  leseLauf++;
  leseAudio.pause();
  if (leseWeiter) { leseWeiter(false); leseWeiter = null; }
  try { if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); } catch {}
  if (leseKnopf) leseKnopf.textContent = leseKnopf.dataset.label || "🔊 Vorlesen";
  leseKnopf = null;
}

/* Zerlegt an Satzenden: erstes Häppchen kurz (schneller Start), danach größere */
function haeppchen(text, erst = 220, dann = 700) {
  const fliess = text.split(/\n+/).map(z => z.trim()).filter(Boolean)
    .map(z => /[.!?…:;,]["“”»)]*$/.test(z) ? z : z + ".").join(" ");
  const teile = [];
  let akt = "";
  const grenze = () => (teile.length ? dann : erst);
  for (let s of fliess.match(/[^.!?…]+(?:[.!?…]+["“”»)]*)?\s*/g) || []) {
    while (s.length > grenze()) {          /* Überlanger Satz: an Komma oder Leerzeichen teilen */
      if (akt.trim()) { teile.push(akt.trim()); akt = ""; continue; }
      const g = grenze();
      let schnitt = Math.max(s.lastIndexOf(", ", g), s.lastIndexOf("; ", g), s.lastIndexOf(" – ", g));
      if (schnitt < g * 0.4) schnitt = s.lastIndexOf(" ", g);
      if (schnitt <= 0) schnitt = g;
      teile.push(s.slice(0, schnitt + 1).trim());
      s = s.slice(schnitt + 1);
    }
    if (akt && (akt + s).length > grenze()) { teile.push(akt.trim()); akt = ""; }
    akt += s;
  }
  if (akt.trim()) teile.push(akt.trim());
  return teile;
}

/* Ein Häppchen abspielen; true = zu Ende gelaufen, false = Fehler oder gestoppt */
function spiele(url) {
  return new Promise(fertig => {
    leseWeiter = fertig;
    leseAudio.onended = () => fertig(true);
    leseAudio.onerror = () => fertig(false);
    leseAudio.src = url;
    leseAudio.play().catch(e => { if (e.name !== "AbortError") fertig(false); });
  });
}

/* Tippen startet, nochmal tippen hört auf – auch während es noch lädt */
function vorlesen(text, knopf) {
  if (knopf && leseKnopf === knopf) { vorleseStopp(); return; }
  return vorlesenStarten(text, knopf);
}

async function vorlesenStarten(text, knopf) {
  vorleseStopp();
  const teile = haeppchen((text || "").replace(/[#*_>`]/g, ""));
  if (!teile.length) return;
  vorleseFreigabe();
  const lauf = leseLauf;
  leseKnopf = knopf || null;
  if (knopf) { knopf.dataset.label ||= knopf.textContent; knopf.textContent = "⏳ Lädt …"; }
  const basis = kiBasis();
  if (!basis) return vorlesenSystem(teile, lauf);
  const stimme = t => fetch(basis + "tts", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: t }),
  }).then(async r => r.ok && (r.headers.get("content-type") || "").includes("audio")
    ? URL.createObjectURL(await r.blob()) : null).catch(() => null);
  let naechstes = stimme(teile[0]);
  for (let i = 0; i < teile.length; i++) {
    const url = await naechstes;
    naechstes = null;
    if (lauf !== leseLauf) { if (url) URL.revokeObjectURL(url); return; }
    /* Sprachdienst weg: den Rest übernimmt die Systemstimme */
    if (!url) return vorlesenSystem(teile.slice(i), lauf);
    if (i + 1 < teile.length) naechstes = stimme(teile[i + 1]);   /* lädt, während dieses läuft */
    if (knopf) knopf.textContent = "⏹ Stopp";
    const ok = await spiele(url);
    URL.revokeObjectURL(url);
    if (lauf !== leseLauf || !ok) {
      if (naechstes) naechstes.then(u => u && URL.revokeObjectURL(u));
      /* Abspielen verweigert (iOS ohne Tipp): die Systemstimme versuchen */
      if (lauf === leseLauf) vorlesenSystem(teile.slice(i), lauf);
      return;
    }
  }
  vorleseStopp();
}

function vorlesenSystem(teile, lauf) {
  if (!("speechSynthesis" in window) || lauf !== leseLauf) { if (lauf === leseLauf) vorleseStopp(); return; }
  const de = speechSynthesis.getVoices().filter(v => v.lang.startsWith("de"));
  const gut = de.find(v => /premium|enhanced|siri/i.test(v.name)) || de[0];
  try { if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); } catch {}
  teile.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "de-DE"; u.rate = 0.92; u.pitch = 1.0;
    if (gut) u.voice = gut;
    if (i === teile.length - 1) u.onend = u.onerror = () => { if (lauf === leseLauf) vorleseStopp(); };
    speechSynthesis.speak(u);
  });
  if (leseKnopf) leseKnopf.textContent = "⏹ Stopp";
}

/* ---------- Text mit einfacher Auszeichnung darstellen ---------- */
function alsHtml(text) {
  const esc = s => s.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  const zeilen = esc(text).split("\n");
  let html = "", inListe = false;
  for (let z of zeilen) {
    z = z.trim();
    if (!z) { if (inListe) { html += "</ul>"; inListe = false; } continue; }
    z = z.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (/^#{1,3}\s/.test(z)) {
      if (inListe) { html += "</ul>"; inListe = false; }
      html += "<h3>" + z.replace(/^#{1,3}\s*/, "") + "</h3>";
    } else if (/^[-•*]\s/.test(z)) {
      if (!inListe) { html += "<ul>"; inListe = true; }
      html += "<li>" + z.replace(/^[-•*]\s*/, "") + "</li>";
    } else {
      if (inListe) { html += "</ul>"; inListe = false; }
      html += "<p>" + z + "</p>";
    }
  }
  if (inListe) html += "</ul>";
  return html;
}

/* ---------- In die Zwischenablage ---------- */
async function kopieren(text, knopf, label) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement("textarea");
    t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch {}
    t.remove();
  }
  if (knopf) {
    const alt = knopf.textContent;
    knopf.textContent = "✓ kopiert";
    setTimeout(() => { knopf.textContent = label || alt; }, 1800);
  }
}

function heute() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function uhrzeit(ts) {
  const d = new Date(ts);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

if ("serviceWorker" in navigator && location.protocol === "https:")
  navigator.serviceWorker.register("sw.js").catch(() => {});
