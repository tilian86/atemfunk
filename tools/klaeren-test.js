/* Prüft die Bausteine von „Klären“ ohne Browser: node tools/klaeren-test.js
   Nur erfundene Beispiele, nichts Persönliches. */
"use strict";
const assert = require("assert");
const K = require("../klaeren-kern.js");
let n = 0;
const ok = (name, fn) => { try { fn(); n++; } catch (e) { console.error("FEHLER in:", name, "\n", e.message); process.exitCode = 1; } };

/* ---------- Krisen-Treffer ---------- */
ok("Krise: klare Treffer", () => {
  for (const t of [
    "Ich will nicht mehr leben.", "Ich habe Suizidgedanken.", "ich denke an Selbstmord", "Ich möchte mich umbringen",
    "Ich will einfach nicht mehr da sein", "Ich ritze mich wieder", "Manchmal will ich nur noch sterben",
    "Ich habe keine Lust mehr zu leben", "Ich will mir etwas antun", "Ich bin so lebensmüde", "Am liebsten wäre ich tot"])
    assert(K.kriseTreffer(t), t);
});
ok("Krise: kein Fehlalarm im Alltag", () => {
  for (const t of [
    "Ich bin wütend auf Anna, sie hat mich versetzt.", "Der Streit hat mich total geschafft.", "Ich bin müde und erschöpft.",
    "Ich habe keinen Bock mehr auf den Job.", "Mein Chef nervt, ich könnte platzen.", "Ich bringe das Projekt um jeden Preis zu Ende.",
    "Die Aufgabe bringt mich um den Schlaf.", "Wir wollen nicht mehr streiten."])
    assert(!K.kriseTreffer(t), t);
});

/* ---------- Vorlage ---------- */
const basis = { situation: "Ich habe mich mit Anna gestritten.", beteiligte: ["Anna (Freundin)"], tiefe: "ruhe", art: "konflikt", heute: "2026-10-12" };
ok("Vorlage: Pflichtteile, Abschnitte ohne Inhalt fallen weg", () => {
  const p = K.baueVorlage(basis);
  assert(p.startsWith("Ich möchte mit dir ein Gespräch führen"));
  assert(p.includes("Worum es geht:\nIch habe mich mit Anna gestritten.\nBeteiligte: Anna (Freundin)\n"));
  assert(p.includes("Zeitrahmen: etwa 20–30 Minuten in Ruhe"));
  assert(!p.includes("Was ich mir wünsche"), "Ziel leer");
  assert(!p.includes("Was du über mich wissen solltest"), "Profil leer");
  assert(p.includes("Telefonseelsorge 0800 111 0 111 oder 0800 111 0 222"));
  assert(p.includes("Zum Schluss – wenn ich „Abschluss“ sage"));
  assert(p.trim().endsWith("und mir eine erste Frage stellst."));
  assert(!/\{[a-zA-Z]+\}/.test(p), "keine offenen Platzhalter");
});
ok("Vorlage: Ziel, Zeitrahmen, Profil, ADHS, Anknüpfen", () => {
  const p = K.baueVorlage({ ...basis, tiefe: "tief", ziel: { art: "versoehnen", satz: "wieder in Ruhe mit Anna reden können." },
    profil: "Ich grübele abends viel.", adhs: true,
    anknuepfen: { datum: "2026-10-09", thema: "Streit", erkannt: "Ich brauche erst Abstand", offen: "Wie sage ich es ihr?" } });
  assert(p.includes("Was ich mir wünsche: wieder in Ruhe mit Anna reden können\n"));
  assert(p.includes("Zeitrahmen: offen, wir dürfen tief gehen"));
  assert(p.includes("Was du über mich wissen solltest:\nIch grübele abends viel.\nVor ein paar Tagen habe ich schon über etwas Ähnliches nachgedacht („Streit“). Damals habe ich erkannt: Ich brauche erst Abstand. Offen geblieben ist: Wie sage ich es ihr?"));
  assert(p.includes("Ich habe ADHS – wenn ich springe, hilf mir freundlich zurück zum Faden."));
  const k = K.baueVorlage({ ...basis, tiefe: "kurz" });
  assert(k.includes("etwa 10 Minuten, kurz sortieren"));
  assert(!k.includes("ADHS"));
});
ok("Vorlage: ohne Ziel-Satz greift der Standardsatz der Zielart", () => {
  const p = K.baueVorlage({ ...basis, ziel: { art: "entscheiden", satz: "" } });
  assert(p.includes("Was ich mir wünsche: zu einer Entscheidung kommen"));
});
ok("Methoden: passend zur Art, höchstens zwei", () => {
  const has = (p, s) => p.includes(s);
  const GFK = "Gewaltfreie Kommunikation", KOG = "Gedanken, Gefühle und Verhalten zu trennen",
        ENT = "wie sich jede Option in einem Jahr anfühlen würde", SCH = "Modusmodell der Schematherapie";
  const m = (art, zusatz) => K.baueVorlage({ ...basis, art, artZusatz: zusatz });
  for (const art of ["konflikt", "beziehung"]) { const p = m(art); assert(has(p, GFK) && has(p, SCH) && !has(p, KOG) && !has(p, ENT), art); }
  for (const art of ["gedankenkreisen", "gefuehl"]) { const p = m(art); assert(has(p, KOG) && has(p, SCH) && !has(p, GFK), art); }
  { const p = m("entscheidung"); assert(has(p, ENT) && has(p, SCH) && !has(p, GFK) && !has(p, KOG)); }
  { const p = m("selbstbild"); assert(has(p, SCH) && !has(p, GFK) && !has(p, KOG) && !has(p, ENT)); }
  { const p = m("sonstiges"); assert(has(p, KOG) && has(p, SCH) && !has(p, GFK)); }
  { const p = m("konflikt", "gedankenkreisen"); assert(has(p, GFK) && has(p, KOG) && !has(p, SCH), "zwei Bausteine, kein dritter"); }
  { const p = m("konflikt", "entscheidung"); assert(has(p, GFK) && has(p, ENT) && !has(p, SCH)); }
  assert.deepStrictEqual(K.methodenFuer("konflikt", "konflikt"), ["gfk", "schema"]);
});
ok("Person: Vorname, Rolle, mehrere", () => {
  assert.deepStrictEqual(K.personen(["Anna (Freundin)"]), { dat: "Anna", akk: "Anna" });
  assert.deepStrictEqual(K.personen(["Anna", "Ben"]), { dat: "Anna und Ben", akk: "Anna und Ben" });
  assert.deepStrictEqual(K.personen(["meine Chefin"]), { dat: "der anderen Person", akk: "die andere Person" });
  assert.deepStrictEqual(K.personen([]), { dat: "der anderen Person", akk: "die andere Person" });
  const p = K.baueVorlage({ ...basis, beteiligte: [] });
  assert(p.includes("bei mir und bei der anderen Person.") && p.includes("in die andere Person hineinzuversetzen") && p.includes("Wenn ich mit der anderen Person reden"));
});
ok("Die fertige Vorlage löst keinen Krisen-Alarm aus", () => {
  assert(!K.kriseTreffer(K.baueVorlage({ ...basis, art: "selbstbild" })));
  assert(!K.kriseTreffer(K.ABSCHLUSS));
});

/* ---------- Antwort der Zusammenfassung ---------- */
const GUT = { app: "atemfunk-klaerung", v: 1, plattform: "Gemini", thema: "Streit mit Anna", kern: "Es ging um Verlässlichkeit.",
  erkenntnisse: ["Ich habe verstanden, dass ich Verlässlichkeit brauche.", "Ich war enttäuscht, nicht wütend."],
  gefuehleBeduerfnisse: ["enttäuscht – Bedürfnis nach Verlässlichkeit"], andereSicht: "Anna war vermutlich überfordert.",
  naechsterSchritt: "Ich schreibe Anna eine kurze Nachricht.", offeneFrage: "Wie viel Nähe will ich?", satzFuerMich: "Ich darf Verlässlichkeit wollen." };
const json = JSON.stringify(GUT, null, 1);
ok("Parser: sauberes JSON", () => {
  const g = K.parseKlaerung(json);
  assert.strictEqual(g.thema, "Streit mit Anna"); assert.strictEqual(g.plattform, "Gemini");
  assert.strictEqual(g.erkenntnisse.length, 2); assert.strictEqual(g.satzFuerMich, "Ich darf Verlässlichkeit wollen.");
});
ok("Parser: Codezaun, Gerede drumherum", () => {
  const g = K.parseKlaerung("Klar, hier ist deine Zusammenfassung:\n```json\n" + json + "\n```\nSag Bescheid, wenn du mehr brauchst!");
  assert.strictEqual(g.kern, "Es ging um Verlässlichkeit.");
});
ok("Parser: typografische Anführungszeichen", () => {
  const g = K.parseKlaerung(json.replace(/"/g, (c, i) => (i % 2 ? "”" : "“")).replace(/“(\w)/g, '“$1'));
  assert(g && g.thema, "smart quotes");
  const g2 = K.parseKlaerung(`{“app”:“atemfunk-klaerung”,“thema”:“Test”,“kern”:“Kurz.”,“erkenntnisse”:[“Eins”]}`);
  assert.strictEqual(g2.thema, "Test"); assert.deepStrictEqual(g2.erkenntnisse, ["Eins"]);
});
ok("Parser: Zeilenumbruch mitten im String, Komma am Ende", () => {
  const g = K.parseKlaerung('{"app":"atemfunk-klaerung","thema":"Test","kern":"Erste Zeile\nzweite Zeile","erkenntnisse":["A","B",],}');
  assert(g && g.kern.includes("zweite Zeile") && g.erkenntnisse.length === 2);
});
ok("Parser: Felder als Text statt Liste, andere Schreibweise der Namen", () => {
  const g = K.parseKlaerung('{"app":"atemfunk-klaerung","Thema":"T","Kern":"K","Erkenntnisse":"- Eins\\n- Zwei","gefuehle_beduerfnisse":"Ruhe; Nähe","satz_fuer_mich":"Satz."}');
  assert.deepStrictEqual(g.erkenntnisse, ["Eins", "Zwei"]); assert.deepStrictEqual(g.gefuehleBeduerfnisse, ["Ruhe", "Nähe"]); assert.strictEqual(g.satzFuerMich, "Satz.");
});
ok("Parser: kaputtes JSON, Felder werden trotzdem erkannt", () => {
  const kaputt = 'Hier: {"app":"atemfunk-klaerung", "thema":"Mit "Anna" gesprochen", "kern":"Es ging um Nähe.", "erkenntnisse":["Ich brauche Zeit", "Ich war traurig"], "naechsterSchritt":"Anrufen", "satzFuerMich":"Ich darf warten."';
  const g = K.parseKlaerung(kaputt);
  assert(g, "Auszug"); assert.strictEqual(g.kern, "Es ging um Nähe."); assert.strictEqual(g.erkenntnisse.length, 2); assert.strictEqual(g.satzFuerMich, "Ich darf warten.");
});
ok("Parser: Platzhalter, freier Text und fremdes JSON sind keine Klärung", () => {
  const p = K.parseKlaerung(K.ABSCHLUSS);
  assert(p && p.platzhalter, "Abschluss-Prompt selbst erkannt");
  assert.strictEqual(K.parseKlaerung("Wir haben lange über Anna gesprochen. Du hast erkannt, dass dir Verlässlichkeit wichtig ist."), null);
  assert.strictEqual(K.parseKlaerung('{"thema":"Wetter"}'), null);
  assert.strictEqual(K.parseKlaerung(""), null);
  assert.strictEqual(K.parseKlaerung("{ nur geschweifte Klammern }"), null);
});
ok("Parser: Plattform wird zu Gemini/ChatGPT/leer", () => {
  assert.strictEqual(K.parseKlaerung(json.replace("Gemini", "ChatGPT (GPT-5)")).plattform, "ChatGPT");
  assert.strictEqual(K.parseKlaerung(json.replace("Gemini", "Gemini 3 Pro")).plattform, "Gemini");
  assert.strictEqual(K.parseKlaerung(json.replace("Gemini", "ein Assistent")).plattform, "");
});

/* ---------- Antwort der Analyse ---------- */
const ANA = { art: "konflikt", artZusatz: null, situation: "Ich hatte Streit mit Anna.", beteiligte: ["Anna (Freundin)"],
  ziel: { art: "versoehnen", satz: "wieder in Ruhe reden können" }, tiefeVorschlag: "ruhe", rueckfragen: ["Was genau ist passiert?"],
  krise: false, kriseGrund: "", anknuepfen: "klaerung-123", profilKurz: "Ich grübele abends." };
ok("Analyse: sauber, mit Codezaun, Enum-Toleranz", () => {
  const a = K.parseAnalyse("```json\n" + JSON.stringify(ANA) + "\n```", ["klaerung-123"]);
  assert.strictEqual(a.art, "konflikt"); assert.strictEqual(a.tiefe, "ruhe"); assert.strictEqual(a.anknuepfen, "klaerung-123");
  assert.strictEqual(a.ziel.art, "versoehnen"); assert.deepStrictEqual(a.rueckfragen, ["Was genau ist passiert?"]);
  const b = K.parseAnalyse(JSON.stringify({ ...ANA, art: "Gefühl", tiefeVorschlag: "🌊 tief", ziel: "Entscheiden", krise: "true", rueckfragen: ["a", "b", "c", "d"] }), []);
  assert.strictEqual(b.art, "gefuehl"); assert.strictEqual(b.tiefe, "tief"); assert.strictEqual(b.ziel.art, "entscheiden");
  assert.strictEqual(b.krise, true); assert.strictEqual(b.rueckfragen.length, 3); assert.strictEqual(b.anknuepfen, null, "unbekannte id wird verworfen");
});
ok("Analyse: ohne Situation oder mit unbrauchbarem Text → null", () => {
  assert.strictEqual(K.parseAnalyse("Das tut mir leid zu hören.", []), null);
  assert.strictEqual(K.parseAnalyse(JSON.stringify({ art: "konflikt" }), []), null);
});

/* ---------- Journal-Text ---------- */
ok("Journal-Eintrag: Aufbau", () => {
  const t = K.eintragText({ datum: "2026-10-12", thema: "Streit mit Anna", plattform: "Gemini", tiefe: "ruhe", schilderung: "Ich hatte Streit.",
    kern: "Es ging um Verlässlichkeit.", erkenntnisse: ["Eins", "Zwei"], gefuehleBeduerfnisse: [], andereSicht: "", naechsterSchritt: "Nachricht schreiben", offeneFrage: "", satzFuerMich: "Ich darf das wollen." });
  assert(t.startsWith("🫂 Klärung · Streit mit Anna · "));
  assert(t.includes("Gespräch: Gemini · 🧭 in Ruhe"));
  assert(t.includes("Worum es ging (meine Schilderung): Ich hatte Streit."));
  assert(t.includes("Kurz gesagt: Es ging um Verlässlichkeit."));
  assert(t.includes("Erkannt:\n- Eins\n- Zwei"));
  assert(t.includes("Nächster Schritt: Nachricht schreiben") && t.includes("Satz für mich: Ich darf das wollen."));
  assert(!t.includes("Gefühle und Bedürfnisse") && !t.includes("Die andere Sicht") && !t.includes("Offene Frage"), "leere Abschnitte fehlen");
});
ok("kuerze: Satzende bevorzugt", () => {
  assert.strictEqual(K.kuerze("Ein ziemlich langer erster Satz. Noch ein längerer zweiter Satz hier.", 40), "Ein ziemlich langer erster Satz.");
  assert(K.kuerze("x".repeat(500), 100).length <= 102);
});

console.log(n + " Prüfungen bestanden" + (process.exitCode ? ", aber mit Fehlern" : ""));
