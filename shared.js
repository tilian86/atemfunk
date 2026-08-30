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
async function frageKI(system, user, model) {
  const basis = kiBasis();
  if (!basis) return { fehler: "nicht-verbunden" };
  try {
    const r = await fetch(basis + "ki", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ system, user, model: model || "sonnet" }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.error) return { fehler: d.offline ? "mac-aus" : (d.error || "fehler") };
    return { text: (d.text || "").trim() };
  } catch {
    return { fehler: "mac-aus" };
  }
}

/* ---------- Diktat (kostenlos, im Browser) ---------- */
function diktat(feld, knopf) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { knopf.style.display = "none"; return; }
  let erk = null, laeuft = false;
  knopf.addEventListener("click", () => {
    if (laeuft) { erk && erk.stop(); return; }
    erk = new SR();
    erk.lang = "de-DE"; erk.continuous = true; erk.interimResults = true;
    const start = feld.value ? feld.value + " " : "";
    erk.onresult = e => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      feld.value = start + txt;
    };
    erk.onend = () => { laeuft = false; knopf.classList.remove("on"); knopf.textContent = "🎙 Diktieren"; };
    erk.onerror = erk.onend;
    erk.start();
    laeuft = true; knopf.classList.add("on"); knopf.textContent = "⏹ Fertig";
  });
}

/* ---------- Vorlesen ---------- */
let stimmeAktiv = false;
function vorlesen(text, knopf) {
  if (!("speechSynthesis" in window)) return;
  if (stimmeAktiv) { speechSynthesis.cancel(); stimmeAktiv = false; if (knopf) knopf.textContent = "🔊 Vorlesen"; return; }
  const sauber = text.replace(/[#*_>`]/g, "").replace(/\n{2,}/g, ". ");
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
