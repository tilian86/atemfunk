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
  const hier = (location.pathname.split("/").pop() || "index.html");
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

async function frageKI(system, user, model) {
  const basis = kiBasis();
  if (!basis) return { fehler: "Noch nicht verbunden." };
  const abbruch = new AbortController();
  const zeitlimit = setTimeout(() => abbruch.abort(), 120000);
  try {
    /* Rolle bewusst im Nutzertext statt im system-Feld: die CLI behandelt
       eingebettete <system>-Blöcke misstrauisch und verweigert sie mitunter. */
    const r = await fetch(basis + "ki", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ system: "", user: system + "\n\n---\n\n" + user, model: model || "sonnet" }),
      signal: abbruch.signal,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error || !d.text)
      return { fehler: d.error || "Unerwartete Antwort (" + r.status + ").", nochmal: true };
    return { text: (d.text || "").trim() };
  } catch (e) {
    return { fehler: e.name === "AbortError" ? "Zu lange gewartet – nochmal?" : "Keine Verbindung.", nochmal: true };
  } finally {
    clearTimeout(zeitlimit);
  }
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

/* Aufnehmen und von Gemini transkribieren – deutlich genauer als die Browser-Erkennung.
   Ohne Verbindung übernimmt die eingebaute Erkennung. */
async function diktatAufnahme(feld, knopf, welle) {
  const basis = kiBasis();
  if (!basis) return false;
  let strom;
  try { strom = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch { return false; }
  const mr = new MediaRecorder(strom);
  const teile = [];
  mr.ondataavailable = e => { if (e.data.size) teile.push(e.data); };
  const fertig = new Promise(res => { mr.onstop = res; });
  mr.start();
  welle.an();
  knopf.classList.add("on"); knopf.textContent = "⏹ Fertig";
  await new Promise(res => {
    const stopp = () => { knopf.removeEventListener("click", stopp); res(); };
    knopf.addEventListener("click", stopp);
  });
  mr.stop(); await fertig;
  strom.getTracks().forEach(t => t.stop());
  welle.aus();
  knopf.classList.remove("on"); knopf.textContent = "Wird geschrieben …"; knopf.disabled = true;
  const blob = new Blob(teile, { type: mr.mimeType || "audio/webm" });
  try {
    const fd = new FormData();
    fd.append("audio", blob, "notiz." + ((mr.mimeType || "").includes("mp4") ? "m4a" : "webm"));
    const r = await fetch(basis + "stt", { method: "POST", body: fd });
    const d = await r.json();
    if (d.text) {
      feld.value = (feld.value ? feld.value.trimEnd() + " " : "") + d.text.trim();
      feld.scrollTop = feld.scrollHeight;
    } else {
      knopf.textContent = "🎙 Diktieren"; knopf.disabled = false;
      return false;
    }
  } catch {
    knopf.textContent = "🎙 Diktieren"; knopf.disabled = false;
    return false;
  }
  knopf.textContent = "🎙 Diktieren"; knopf.disabled = false;
  return true;
}

function diktat(feld, knopf) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const welle0 = wellen(feld);
  let beschaeftigt = false;
  knopf.addEventListener("click", async e => {
    if (beschaeftigt || !kiBasis()) return;     /* ohne Verbindung: Browser-Erkennung unten */
    e.stopImmediatePropagation();
    beschaeftigt = true;
    const ok = await diktatAufnahme(feld, knopf, welle0);
    beschaeftigt = false;
    if (!ok && !SR) knopf.textContent = "🎙 Diktieren";
  }, true);
  if (!SR) { if (!kiBasis()) knopf.style.display = "none"; return; }
  const welle = welle0;
  let erk = null, laeuft = false;
  knopf.addEventListener("click", () => {
    if (laeuft) { erk && erk.stop(); return; }
    erk = new SR();
    erk.lang = "de-DE"; erk.continuous = true; erk.interimResults = true;
    const start = feld.value ? feld.value.trimEnd() + " " : "";
    /* Fertig erkannte Abschnitte getrennt sammeln: die Ereignisse liefern ab
       resultIndex nur das Neue – wer alles daraus baut, löscht das Vorherige. */
    let fest = "";
    erk.onresult = e => {
      let vorlaeufig = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fest += r[0].transcript.trim() + " ";
        else vorlaeufig += r[0].transcript;
      }
      feld.value = start + fest + vorlaeufig;
      feld.scrollTop = feld.scrollHeight;
      welle.schlag();
    };
    erk.onspeechstart = () => welle.schlag();
    erk.onend = () => {
      laeuft = false; welle.aus();
      knopf.classList.remove("on"); knopf.textContent = "🎙 Diktieren";
    };
    erk.onerror = erk.onend;
    erk.start();
    laeuft = true; welle.an();
    knopf.classList.add("on"); knopf.textContent = "⏹ Fertig";
  });
}

/* ---------- Vorlesen: echte Stimme über den Sprachdienst, sonst Systemstimme ---------- */
let stimmeAktiv = false;
const leseAudio = new Audio();

async function vorlesen(text, knopf) {
  if (!text) return;
  if (stimmeAktiv) {
    try { speechSynthesis.cancel(); } catch {}
    leseAudio.pause();
    stimmeAktiv = false;
    if (knopf) knopf.textContent = "🔊 Vorlesen";
    return;
  }
  const sauber = text.replace(/[#*_>`]/g, "").replace(/\n{2,}/g, ". ").trim();
  const basis = kiBasis();
  if (basis && sauber.length <= 5800) {
    if (knopf) knopf.textContent = "…";
    try {
      const r = await fetch(basis + "tts", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: sauber }),
      });
      if (r.ok && (r.headers.get("content-type") || "").includes("audio")) {
        leseAudio.src = URL.createObjectURL(await r.blob());
        leseAudio.onended = () => { stimmeAktiv = false; if (knopf) knopf.textContent = "🔊 Vorlesen"; };
        await leseAudio.play();
        stimmeAktiv = true;
        if (knopf) knopf.textContent = "⏹ Stopp";
        return;
      }
    } catch {}
    if (knopf) knopf.textContent = "🔊 Vorlesen";
  }
  vorlesenSystem(sauber, knopf);
}

function vorlesenSystem(sauber, knopf) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(sauber);
  u.lang = "de-DE"; u.rate = 0.92; u.pitch = 1.0;
  const de = speechSynthesis.getVoices().filter(v => v.lang.startsWith("de"));
  const gut = de.find(v => /premium|enhanced|siri/i.test(v.name)) || de[0];
  if (gut) u.voice = gut;
  u.onend = () => { stimmeAktiv = false; if (knopf) knopf.textContent = "🔊 Vorlesen"; };
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  stimmeAktiv = true;
  if (knopf) knopf.textContent = "⏹ Stopp";
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
