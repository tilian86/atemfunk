/* Klären – die Bausteine ohne Seite: feste Vorlage, Methoden, Krisen-Treffer, Parser.
   Läuft im Browser (window.Klaeren) und in Node (module.exports), damit sich alles ohne Browser prüfen lässt.
   Dieses Repo ist ÖFFENTLICH: hier stehen nur Vorlagen und Logik, nie persönliche Inhalte. */
(function (root) {
  "use strict";

  /* ---------- Feste Begriffe ---------- */
  const TIEFEN = {
    kurz: { icon: "⚡", name: "kurz sortieren", dauer: "~10 Min", zeit: "etwa 10 Minuten, kurz sortieren" },
    ruhe: { icon: "🧭", name: "in Ruhe", dauer: "~20–30 Min", zeit: "etwa 20–30 Minuten in Ruhe" },
    tief: { icon: "🌊", name: "tief", dauer: "offen", zeit: "offen, wir dürfen tief gehen" },
  };
  const ARTEN = ["konflikt", "gedankenkreisen", "entscheidung", "gefuehl", "selbstbild", "beziehung", "sonstiges"];
  const ZIELARTEN = ["verstehen", "klaeren", "versoehnen", "entscheiden", "loswerden", "sonstiges"];
  const ZIEL_STANDARD = {
    verstehen: "besser verstehen, was da bei mir und bei den anderen los ist",
    klaeren: "die Sache klären und wissen, wie ich damit umgehe",
    versoehnen: "mich versöhnen und wieder in guten Kontakt kommen",
    entscheiden: "zu einer Entscheidung kommen, hinter der ich stehen kann",
    loswerden: "das loslassen und innerlich zur Ruhe kommen",
    sonstiges: "",
  };

  const GEMINI_URL = "https://gemini.google.com/app";
  const CHATGPT_URL = "https://chatgpt.com";

  /* ---------- Kleine Helfer ---------- */
  const schl = k => String(k).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/ß/g, "ss").replace(/[^a-z0-9]/g, "");

  /* Feld eines Objekts finden – Groß-/Kleinschreibung, Umlaute und Unterstriche sind egal */
  function feld(o, namen) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return undefined;
    const m = {};
    for (const k of Object.keys(o)) m[schl(k)] = o[k];
    for (const n of namen) { const v = m[schl(n)]; if (v !== undefined && v !== null) return v; }
    return undefined;
  }
  /* Einen Wert in einen einzeiligen Text bringen */
  function txt(x, max = 400) {
    if (x == null) return "";
    if (Array.isArray(x)) x = x.map(i => txt(i, max)).join(" ");
    else if (typeof x === "object") x = x.text || x.name || "";
    return String(x).replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  }
  /* Wie txt, behält aber Absätze */
  function absatz(x, max = 3000) {
    if (x == null) return "";
    if (Array.isArray(x)) x = x.join("\n");
    else if (typeof x === "object") x = x.text || "";
    return String(x).replace(/\*\*|__|`/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
  }
  function liste(x, n, max) {
    let arr = Array.isArray(x) ? x : typeof x === "string" ? x.split(/\n+|;\s+|\s•\s/) : [];
    arr = arr.map(i => txt(i, max).replace(/^[-*•–\d.)\s]+/, "").trim()).filter(Boolean);
    return arr.filter((a, i) => arr.findIndex(b => b.toLowerCase() === a.toLowerCase()) === i).slice(0, n);
  }
  /* Kürzt sauber: lieber am Satzende, sonst am Wort */
  function kuerze(t, n) {
    t = String(t || "").replace(/\s+/g, " ").trim();
    if (t.length <= n) return t;
    const kopf = t.slice(0, n);
    const satz = Math.max(kopf.lastIndexOf(". "), kopf.lastIndexOf("! "), kopf.lastIndexOf("? "));
    if (satz > n * 0.5) return kopf.slice(0, satz + 1);
    return kopf.replace(/\s+\S*$/, "").replace(/[,;:–-]+$/, "") + " …";
  }
  const satzEnde = t => { t = String(t || "").trim(); return t && !/[.!?…"“”)]$/.test(t) ? t + "." : t; };
  /* Zeilen eines Textfelds → Liste */
  function zeilen(t) {
    return String(t || "").split(/\n+/).map(z => z.replace(/^[-*•–\s]+/, "").trim()).filter(Boolean);
  }

  /* ---------- Krisen-Schutz: nur klare Treffer ---------- */
  const KRISE = [
    /\b(suizid\w*|selbstmord\w*|selbstt[oö]tung\w*|freitod|lebensm[uü]de)\b/i,
    /\bmich\b[^.!?\n]{0,30}\b(umbringen|t[oö]ten|aufh[aä]ngen|erh[aä]ngen|erschie(ß|ss)en|vergiften)\b/i,
    /\b(bring|bringe)\s+mich\s+um\b/i,
    /\b(nehme?|nehm|nimm)\s+mir\s+das\s+leben\b|\bleben\s+(zu\s+)?(beenden|nehmen)\b/i,
    /\b(will|m[oö]chte|wollte|mag|kann)\b[^.!?\n]{0,25}\bnicht\s+mehr\b[^.!?\n]{0,12}\b(leben|weiterleben|da\s+sein)\b/i,
    /\bnicht\s+mehr\s+(leben|weiterleben|da\s+sein)\s+(will|m[oö]chte|mag|kann)\b/i,
    /\bkeine\s+(lust|kraft)\s+mehr\s+(zu\s+leben|weiterzuleben)\b/i,
    /\b(will|m[oö]chte|w[uü]nsche?\s+mir|w[uü]nschte)\b[^.!?\n]{0,20}\b(sterben|tot\s+sein|nicht\s+mehr\s+aufzuwachen|nicht\s+mehr\s+aufwachen)\b/i,
    /\b(lieber|am\s+liebsten)\b[^.!?\n]{0,10}\btot\b/i,
    /\bselbstverletz\w*|\bmich\s+(selbst\s+)?(zu\s+)?ritzen\b|\b(ritze|ritzte|geritzt)\s+mich\b|\bmich\s+selbst\s+(zu\s+)?(verletzen|schneiden|verbrennen)\b/i,
    /\bmir\b[^.!?\n]{0,15}\b(etwas|was)\s+(an|an\s+)?tun\b|\bmir\b[^.!?\n]{0,15}\b(etwas|was)\s+antun\b/i,
    /\b(keinen|kein)\s+sinn\s+mehr\b[^.!?\n]{0,20}\bleben\b|\bleben\b[^.!?\n]{0,15}\b(hat|ergibt)\s+(keinen|kein)\s+sinn\b/i,
  ];
  function kriseTreffer(text) {
    const t = String(text || "");
    return KRISE.some(r => r.test(t));
  }

  /* ---------- Methoden-Bausteine ---------- */
  /* Namen für die Bausteine: Vorname(n), sonst „die andere Person“ */
  function personen(beteiligte) {
    const alle = (beteiligte || []).map(b => String(b).replace(/\(.*?\)/g, "").trim()).filter(Boolean);
    const namen = alle.filter(n => !/^(mein|meine|meinen|meinem|meiner|meines|dein|deine|unser|unsere|der|die|das|ein|eine|frau|herr|dr\.?)\s/i.test(n))
      .map(n => n.split(/\s+/)[0]).slice(0, 3);
    if (namen.length) {
      const s = namen.length > 1 ? namen.slice(0, -1).join(", ") + " und " + namen[namen.length - 1] : namen[0];
      return { dat: s, akk: s };
    }
    if (alle.length > 1) return { dat: "den anderen Beteiligten", akk: "die anderen Beteiligten" };
    return { dat: "der anderen Person", akk: "die andere Person" };
  }

  const BAUSTEINE = {
    gfk: p => [
      `Hilf mir, Beobachtung, Gefühl, Bedürfnis und Bitte auseinanderzuhalten (Gewaltfreie Kommunikation), bei mir und bei ${p.dat}.`,
      `Lade mich ein, mich in ${p.akk} hineinzuversetzen.`,
      `Wenn ich mit ${p.dat} reden oder schreiben will, üb das Gespräch mit mir oder formuliere mit mir eine Nachricht, ehrlich und ohne Vorwürfe.`,
    ],
    kognitiv: () => [
      "Hilf mir, Gedanken, Gefühle und Verhalten zu trennen.",
      "Prüf belastende Gedanken behutsam: Was spricht dafür, was dagegen, was würde ich einem Freund sagen?",
    ],
    entscheidung: () => [
      "Arbeite mit dem, was mir wirklich wichtig ist, und damit, wie sich jede Option in einem Jahr anfühlen würde, nicht nur mit Pro-und-Contra-Listen.",
    ],
    schema: () => [
      "Ich kenne das Modusmodell der Schematherapie: Kind-Modi, Bewältigungsmodi, kritische innere Stimmen und den gesunden Erwachsenen.",
      "Wenn es hilft, lass uns schauen, welcher Anteil gerade spricht und was der gesunde Erwachsene dazu sagen würde.",
    ],
  };
  const PRIMAER = { konflikt: "gfk", beziehung: "gfk", gedankenkreisen: "kognitiv", gefuehl: "kognitiv",
                    entscheidung: "entscheidung", selbstbild: "schema" };

  /* Höchstens zwei Bausteine: die zur Art passenden, sonst (oder ergänzend) das Modusmodell.
     Ohne erkennbare Art bleibt es allgemein: Gedanken/Gefühle trennen plus Modusmodell. */
  function methodenFuer(art, zusatz) {
    const ids = [];
    for (const a of [art, zusatz]) { const m = PRIMAER[a]; if (m && !ids.includes(m)) ids.push(m); }
    if (!ids.length) ids.push("kognitiv");
    if (ids.length < 2 && !ids.includes("schema")) ids.push("schema");
    return ids.slice(0, 2);
  }

  /* ---------- Die feste Vorlage ---------- */
  const KOPF = "Ich möchte mit dir ein Gespräch führen, das mir hilft, etwas zu sortieren – so wie mit einer erfahrenen, warmherzigen Therapeutin oder einem Therapeuten. Du ersetzt keine Therapie, das weiß ich. Ich möchte reflektieren, verstehen und gut weitergehen.";
  const REGELN = [
    "Hör erst zu und spiegle, was du verstehst – auch Gefühle und Bedürfnisse, die zwischen den Zeilen stehen. Frag nach, statt zu vermuten.",
    "Stell pro Antwort höchstens eine Frage. Halte deine Antworten kurz (2–5 Sätze), ich spreche meist im Sprachmodus.",
    "Kein Ratschlag-Feuerwerk: erst verstehen, dann gemeinsam Möglichkeiten suchen. Wenn ich nach deiner Meinung frage, sag sie ehrlich.",
    "Gib mir nicht automatisch recht. Hilf mir, auch die Sicht der anderen Person zu sehen, und sprich es freundlich, aber klar an, wenn ich mir selbst im Weg stehe.",
    "Achte auch darauf, was ich gerade fühle und im Körper merke, nicht nur auf die Geschichte. Wenn ich sehr aufgewühlt bin, werde langsamer und hilf mir erst, ruhiger zu werden.",
  ];
  const KRISE_REGEL = "Falls du Hinweise auf eine Krise bemerkst, etwa Gedanken, mir etwas anzutun: Sprich es offen an und nenne mir Hilfe – Telefonseelsorge 0800 111 0 111 oder 0800 111 0 222 (rund um die Uhr, kostenlos), im Notfall 112.";
  const SCHLUSS = "Zum Schluss – wenn ich „Abschluss“ sage oder die Zeit um ist – fass kurz zusammen, was ich erkannt habe, und wir suchen einen kleinen, konkreten nächsten Schritt.";
  const ANFANG = "Fang an, indem du in zwei, drei Sätzen sagst, wie du meine Lage verstanden hast, und mir eine erste Frage stellst.";
  const ADHS_ZEILE = "Ich habe ADHS – wenn ich springe, hilf mir freundlich zurück zum Faden.";

  /* Der Abschluss-Prompt: die KI liefert die Zusammenfassung als JSON-Block zurück */
  const ABSCHLUSS = `Danke. Bitte schreib mir jetzt eine Zusammenfassung für mein Journal – als Text, nicht vorgelesen. Antworte NUR mit diesem JSON-Block:
{"app":"atemfunk-klaerung","v":1,
 "plattform":"ChatGPT oder Gemini (wer du bist)",
 "thema":"kurzer Titel",
 "kern":"2–4 Sätze: worum es eigentlich ging",
 "erkenntnisse":["was ich verstanden habe, in meinen Worten"],
 "gefuehleBeduerfnisse":["z. B. enttäuscht – Bedürfnis nach Verlässlichkeit"],
 "andereSicht":"wie die andere Person es vermutlich erlebt (leer lassen, wenn es um niemanden ging)",
 "naechsterSchritt":"ein kleiner, konkreter Schritt",
 "offeneFrage":"was noch offen ist und sich lohnt, weiter anzuschauen",
 "satzFuerMich":"ein Satz, den ich mir merken will"}`;

  function tageZwischen(vonIso, bisIso) {
    const [y, m, d] = String(vonIso).split("-").map(Number);
    const [y2, m2, d2] = String(bisIso).split("-").map(Number);
    if (![y, m, d, y2, m2, d2].every(Number.isFinite)) return 99999;
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y, m - 1, d)) / 864e5);
  }
  function wannAnfang(datum, heute) {
    const t = tageZwischen(datum, heute);
    if (t <= 0) return "Heute habe ich schon einmal";
    if (t === 1) return "Gestern habe ich schon";
    if (t <= 10) return "Vor ein paar Tagen habe ich schon";
    if (t <= 45) return "Vor ein paar Wochen habe ich schon";
    return "Vor einiger Zeit habe ich schon";
  }
  /* k: { datum, thema, erkannt, offen } */
  function anknuepfenText(k, heute) {
    let s = wannAnfang(k.datum, heute) + " über etwas Ähnliches nachgedacht"
      + (k.thema ? ` („${k.thema}“)` : "") + ".";
    if (k.erkannt) s += " Damals habe ich erkannt: " + satzEnde(k.erkannt);
    if (k.offen) s += " Offen geblieben ist: " + satzEnde(k.offen);
    return s;
  }

  function zielText(ziel) {
    if (!ziel) return "";
    const satz = txt(ziel.satz, 240).replace(/[.!]+$/, "");
    return satz || ZIEL_STANDARD[ziel.art] || "";
  }

  /* p: { situation, beteiligte[], ziel:{art,satz}, tiefe, art, artZusatz, profil, anknuepfen:{datum,thema,erkannt,offen}|null,
          adhs:boolean, heute:"JJJJ-MM-TT" } */
  function baueVorlage(p) {
    const tiefe = TIEFEN[p.tiefe] ? p.tiefe : "ruhe";
    const L = [KOPF, "", "Worum es geht:", absatz(p.situation, 3000)];
    const bet = (p.beteiligte || []).map(b => txt(b, 80)).filter(Boolean);
    if (bet.length) L.push("Beteiligte: " + bet.join(", "));
    const ziel = zielText(p.ziel);
    if (ziel) L.push("Was ich mir wünsche: " + ziel);
    L.push("Zeitrahmen: " + TIEFEN[tiefe].zeit, "");

    const ueber = [];
    if (p.profil && txt(p.profil)) ueber.push(txt(p.profil, 800));
    if (p.anknuepfen) ueber.push(anknuepfenText(p.anknuepfen, p.heute || ""));
    if (p.adhs) ueber.push(ADHS_ZEILE);
    if (ueber.length) L.push("Was du über mich wissen solltest:", ...ueber, "");

    const pers = personen(bet);
    const methode = [];
    for (const id of methodenFuer(p.art, p.artZusatz)) methode.push(...BAUSTEINE[id](pers));
    L.push("So hilfst du mir am meisten:");
    for (const r of [...REGELN, ...methode, KRISE_REGEL]) L.push("- " + r);
    L.push("", SCHLUSS, "", ANFANG);
    return L.join("\n");
  }

  /* ---------- Antwort der KI auf die Analyse ---------- */
  function enumWert(v, liste, standard) {
    const s = schl(txt(v, 80));
    let best = null, pos = 1e9;
    for (const m of liste) { const i = s.indexOf(m); if (i >= 0 && i < pos) { best = m; pos = i; } }
    return best || standard;
  }
  function tiefeWert(v) {
    const s = schl(txt(v, 60));
    if (/kurz|10/.test(s)) return "kurz";
    if (/tief|offen/.test(s)) return "tief";
    return "ruhe";
  }
  function bool(v) { return v === true || /^(true|ja|yes|wahr)$/i.test(String(v || "").trim()); }

  /* kandidatenIds: die ids früherer Klärungen, die die KI sehen durfte */
  function normalisiereAnalyse(o, kandidatenIds) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const situation = absatz(feld(o, ["situation", "schilderung", "lage"]), 2500);
    if (!situation) return null;
    let ziel = feld(o, ["ziel", "wunsch"]);
    let zart, zsatz;
    if (ziel && typeof ziel === "object" && !Array.isArray(ziel)) {
      zart = enumWert(feld(ziel, ["art", "typ", "kategorie"]), ZIELARTEN, "sonstiges");
      zsatz = txt(feld(ziel, ["satz", "text", "beschreibung", "wunsch"]), 240);
    } else { zart = enumWert(ziel, ZIELARTEN, "sonstiges"); zsatz = typeof ziel === "string" && !ZIELARTEN.includes(schl(ziel)) ? txt(ziel, 240) : ""; }
    zsatz = zsatz.replace(/^ich\s+(m[oö]chte|will|w[uü]nsche\s+mir)\s+/i, "").replace(/^dass\s+/i, "dass ");
    const zusatzRoh = feld(o, ["artZusatz", "zweiteArt", "art2"]);
    const art = enumWert(feld(o, ["art", "kategorie", "type"]), ARTEN, "sonstiges");
    const zusatz = zusatzRoh == null || /^null$/i.test(String(zusatzRoh)) ? null : enumWert(zusatzRoh, ARTEN, null);
    let ank = feld(o, ["anknuepfen", "anknuepfenAn", "frueher"]);
    ank = ank == null ? null : txt(ank, 120);
    if (!ank || !Array.isArray(kandidatenIds) || !kandidatenIds.includes(ank)) ank = null;
    return {
      art, artZusatz: zusatz === art ? null : zusatz,
      situation,
      beteiligte: liste(feld(o, ["beteiligte", "personen"]), 6, 70),
      ziel: { art: zart, satz: zsatz },
      tiefe: tiefeWert(feld(o, ["tiefeVorschlag", "tiefe", "zeitrahmen"])),
      rueckfragen: liste(feld(o, ["rueckfragen", "fragen", "nachfragen"]), 3, 240),
      krise: bool(feld(o, ["krise", "notfall"])),
      kriseGrund: txt(feld(o, ["kriseGrund", "krisenGrund", "grund"]), 200),
      anknuepfen: ank,
      profilKurz: kuerze(txt(feld(o, ["profilKurz", "profil", "ueberMich"]), 1200), 600),
    };
  }

  /* ---------- Antwort der Gesprächs-KI (Abschluss-Prompt) ---------- */
  const KLAERUNG_FELDER = {
    thema: ["thema", "titel", "title", "topic"],
    kern: ["kern", "kurz", "zusammenfassung", "summary", "worumesging"],
    erkenntnisse: ["erkenntnisse", "erkannt", "insights", "learnings"],
    gefuehleBeduerfnisse: ["gefuehleBeduerfnisse", "gefuehle", "beduerfnisse", "feelingsNeeds", "feelings", "needs"],
    andereSicht: ["andereSicht", "sichtDerAnderen", "perspektiveDerAnderen", "otherView"],
    naechsterSchritt: ["naechsterSchritt", "schritt", "nextStep"],
    offeneFrage: ["offeneFrage", "offeneFragen", "openQuestion"],
    satzFuerMich: ["satzFuerMich", "satz", "merksatz", "takeaway"],
    plattform: ["plattform", "platform", "assistant", "ki"],
  };
  const KLAERUNG_BEKANNT = new Set(Object.values(KLAERUNG_FELDER).flat().map(schl).concat(["app", "v"]));

  function plattformName(p) {
    const s = String(p || "");
    if (/gemini|bard/i.test(s)) return "Gemini";
    if (/gpt|openai/i.test(s)) return "ChatGPT";
    return "";
  }
  /* Ein geparstes Objekt in die feste Form bringen; null, wenn nichts Brauchbares drin ist */
  function normalisiereKlaerung(o) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const f = k => feld(o, KLAERUNG_FELDER[k]);
    const erste = x => Array.isArray(x) ? x.filter(Boolean).join(" ") : x;
    const g = {
      thema: txt(f("thema"), 160),
      kern: absatz(f("kern"), 1200),
      erkenntnisse: liste(f("erkenntnisse"), 8, 320),
      gefuehleBeduerfnisse: liste(f("gefuehleBeduerfnisse"), 8, 200),
      andereSicht: absatz(erste(f("andereSicht")), 700),
      naechsterSchritt: absatz(erste(f("naechsterSchritt")), 500),
      offeneFrage: absatz(erste(f("offeneFrage")), 400),
      satzFuerMich: txt(erste(f("satzFuerMich")), 300),
      plattform: plattformName(txt(f("plattform"), 80)),
    };
    const erkannt = Object.keys(KLAERUNG_FELDER).filter(k => f(k) !== undefined).length;
    const markiert = schl(txt(feld(o, ["app"]), 40)) === "atemfunkklaerung";
    if (!g.thema && !g.kern && !g.erkenntnisse.length) return null;
    if (erkannt < 3 && !markiert) return null;      /* ein zufälliges JSON mit „thema“ ist keine Klärung */
    /* Der Abschluss-Prompt selbst (mit seinen Platzhaltern) ist keine Antwort */
    if (g.thema === "kurzer Titel" || /^2[–-]4 Sätze/.test(g.kern)) return { platzhalter: true };
    return g;
  }

  /* Balancierten {…}-Block ab Position s herausschneiden (stringfest; Zeilenumbrüche in Strings werden zu Leerzeichen) */
  function blockAb(t, s) {
    let aus = "", inStr = false, esc = false;
    const stapel = [];
    for (let i = s; i < t.length; i++) {
      let c = t[i];
      if (inStr) {
        if (c === "\n" || c === "\r" || c === "\t") c = " ";
        aus += c;
        if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{" || c === "[") stapel.push(c === "{" ? "}" : "]");
      else if (c === "}" || c === "]") {
        if (stapel[stapel.length - 1] !== c) continue;
        stapel.pop();
        if (!stapel.length) return aus + c;
      }
      aus += c;
    }
    return null;
  }
  /* Alle JSON-Objekte, die in einem Text stecken (Codezäune, Gerede drumherum und typografische Anführungszeichen egal) */
  function jsonObjekte(text) {
    const roh = String(text || "").replace(/[​-‍﻿]/g, "").replace(/```[a-zA-Z]*/g, " ");
    const varianten = [roh, roh.replace(/[“”„‟″]/g, '"')];
    const gefunden = [];
    for (const t of varianten) {
      let versuche = 0;
      for (let s = t.indexOf("{"); s >= 0 && versuche < 40; s = t.indexOf("{", s + 1)) {
        versuche++;
        const block = blockAb(t, s);
        if (!block) continue;
        for (const b of [block, block.replace(/,\s*([}\]])/g, "$1")]) {
          try { const o = JSON.parse(b); if (o && typeof o === "object") { gefunden.push(o); break; } } catch { /* nächster Versuch */ }
        }
      }
    }
    return gefunden;
  }
  /* Letzter Ausweg bei kaputtem JSON (verirrte Anführungszeichen, abgeschnitten …): Felder an ihren Namen erkennen */
  function schluesselAuszug(text) {
    const t = String(text || "").replace(/```[a-zA-Z]*/g, " ");
    const re = /(?:^|[\s{,])["„“”'‚‘’«»]?\s*([A-Za-zÄÖÜäöüß_]{2,30})\s*["„“”'‚‘’«»]?\s*:/g;
    const treffer = [];
    let m;
    while ((m = re.exec(t))) {
      if (KLAERUNG_BEKANNT.has(schl(m[1]))) treffer.push({ k: m[1], von: m.index, nach: re.lastIndex });
    }
    if (treffer.length < 3) return null;
    const o = {};
    const quote = "\"„“”'‚‘’«»";
    treffer.forEach((h, i) => {
      let v = t.slice(h.nach, i + 1 < treffer.length ? treffer[i + 1].von : t.length).replace(/\s+/g, " ").trim();
      if (v.startsWith("[")) {
        const ende = v.lastIndexOf("]");
        v = v.slice(1, ende > 0 ? ende : undefined).trim();
        const teile = v.split(new RegExp("[" + quote + "]\\s*,\\s*[" + quote + "]"));
        o[h.k] = teile.map(x => x.replace(new RegExp("^[\\s" + quote + "]+|[\\s" + quote + "]+$", "g"), "")).filter(Boolean);
      } else {
        v = v.replace(/[\s,}\]]+$/, "");
        o[h.k] = v.replace(new RegExp("^[" + quote + "]+|[" + quote + "]+$", "g"), "").trim();
      }
    });
    return o;
  }
  function parseKlaerung(text) {
    let platzhalter = false;
    for (const o of jsonObjekte(text)) {
      const g = normalisiereKlaerung(o);
      if (g && g.platzhalter) { platzhalter = true; continue; }
      if (g) return g;
    }
    const o = schluesselAuszug(text);
    const g = o && normalisiereKlaerung(o);
    if (g && g.platzhalter) platzhalter = true;
    else if (g) return g;
    return platzhalter ? { platzhalter: true } : null;
  }
  function parseAnalyse(text, kandidatenIds) {
    for (const o of jsonObjekte(text)) { const a = normalisiereAnalyse(o, kandidatenIds); if (a) return a; }
    return null;
  }

  /* ---------- Journal-Eintrag ---------- */
  /* d: { datum, thema, plattform, tiefe, schilderung, kern, erkenntnisse[], gefuehleBeduerfnisse[], andereSicht,
          naechsterSchritt, offeneFrage, satzFuerMich } */
  function eintragText(d) {
    const tag = new Date(d.datum + "T12:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
    const t = TIEFEN[d.tiefe];
    const L = [`🫂 Klärung · ${txt(d.thema, 120) || "ohne Titel"} · ${tag}`];
    const meta = [d.plattform, t ? `${t.icon} ${t.name}` : ""].filter(Boolean).join(" · ");
    if (meta) L.push("Gespräch: " + meta);
    const bl = (kopf, arr) => { if (arr && arr.length) L.push("", kopf + "\n" + arr.map(x => "- " + x).join("\n")); };
    const ab = (kopf, s) => { if (s && String(s).trim()) L.push("", kopf + " " + String(s).trim()); };
    if (d.schilderung) L.push("", "Worum es ging (meine Schilderung): " + kuerze(d.schilderung, 420));
    ab("Kurz gesagt:", d.kern);
    bl("Erkannt:", d.erkenntnisse);
    bl("Gefühle und Bedürfnisse:", d.gefuehleBeduerfnisse);
    ab("Die andere Sicht:", d.andereSicht);
    ab("Nächster Schritt:", d.naechsterSchritt);
    ab("Offene Frage:", d.offeneFrage);
    ab("Satz für mich:", d.satzFuerMich);
    return L.join("\n");
  }

  /* ---------- Aufträge an die KI (Rolle steht im Nutzertext, siehe frageKI) ---------- */
  const SYSTEM_ANALYSE = `Du bereitest für Florian ein Reflexionsgespräch vor. Das Gespräch führt er danach selbst mit Gemini oder ChatGPT, meist im Sprachmodus – du führst es NICHT. Deine Aufgabe: seine Schilderung ordnen, entscheiden, ob für ein gutes Gespräch etwas Wichtiges fehlt, und die Bausteine für den Gesprächs-Prompt liefern.

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt – kein Text davor oder danach, keine Erklärung, kein Codezaun. Genau diese Felder:

{"art":"konflikt | gedankenkreisen | entscheidung | gefuehl | selbstbild | beziehung | sonstiges",
 "artZusatz":"eine zweite passende Art aus derselben Liste oder null",
 "situation":"…",
 "beteiligte":["…"],
 "ziel":{"art":"verstehen | klaeren | versoehnen | entscheiden | loswerden | sonstiges","satz":"…"},
 "tiefeVorschlag":"kurz | ruhe | tief",
 "rueckfragen":[],
 "krise":false,
 "kriseGrund":"",
 "anknuepfen":null,
 "profilKurz":""}

Regeln für die Felder:
- situation: In der Ich-Form aus Florians Sicht, in seinen Worten und seinem Ton, 3 bis 8 Sätze. Nur, was er gesagt hat – nichts dazuerfinden, nichts deuten, nichts beschönigen, keine Schuld verteilen. Wer beteiligt ist, was passiert ist, was ihn beschäftigt.
- beteiligte: die Personen außer ihm – als Vorname, wenn er einen nennt, sonst als Rolle („meine Chefin“); bei Bedarf mit kurzer Beziehung in Klammern („Anna (Freundin)“). Keine Nachnamen, keine Adressen, keine Firmennamen. Leeres Array, wenn es um niemanden außer ihn geht.
- ziel.art und ziel.satz: was er sich von dem Gespräch wünscht, so wie er es sagt oder deutlich andeutet. satz ist eine kurze Wendung, die hinter „Was ich mir wünsche:“ passt, ohne „Ich möchte“ (z. B. „wieder in Ruhe mit Anna reden können“). Hat er dazu nichts gesagt: art „sonstiges“ und satz leer.
- tiefeVorschlag: kurz = überschaubare, klar umrissene Sache; ruhe = die meisten Fälle, ein Thema mit Gefühl; tief = wiederkehrendes Muster, alte Verletzung, viele Beteiligte, sehr großes Gefühl. Im Zweifel ruhe.
- rueckfragen: 0 bis 3 kurze Fragen, per Du, warm. NUR wenn das Gespräch ohne die Antwort spürbar schlechter würde – zum Beispiel: Wer genau ist beteiligt? Was genau ist passiert? Was wünschst du dir? Was hast du schon versucht? Frag nie nach etwas, das er schon gesagt hat, nie nach Nebensachen und nie, um etwas „abzufragen“. Ist alles Wesentliche da: leeres Array.
- krise: true bei Hinweisen auf Suizid- oder Selbstverletzungsgedanken, auf Selbstgefährdung oder akute Gefahr (auch durch andere Menschen, etwa Gewalt gegen ihn). Alltägliche Wut, Erschöpfung oder Traurigkeit sind keine Krise. kriseGrund: ein kurzer, ruhiger Satz, woran du es festmachst; sonst leer.
- anknuepfen: die id einer früheren Klärung aus der Liste unten, wenn es um dieselbe Person, dasselbe Thema oder dasselbe Muster geht und das Anknüpfen dem Gespräch hilft. Sonst null. Erfinde keine ids.
- profilKurz: nur wenn unten „Was du über Florian schon weißt“ steht: ein kurzes Profil in der Ich-Form (höchstens 600 Zeichen), das einer Gesprächspartnerin hilft, ihn in DIESER Situation zu verstehen – wiederkehrende Muster, was ihm hilft, was ihn bremst. Nur Belegtes aus dem Kontext, nichts erfinden, nichts, das zur Situation nicht passt. Eine ADHS-Diagnose nicht erwähnen (das ergänzt die App selbst). Sonst leerer String.`;

  const SYSTEM_UEBERSETZEN = `Florian hat ein Reflexionsgespräch mit einer KI (Gemini oder ChatGPT) geführt. Unten steht, was er zurückbringt: die Zusammenfassung in nicht ganz passender Form, freier Text oder ein ganzes Gesprächsprotokoll. Übersetze es in genau dieses JSON-Objekt und antworte AUSSCHLIESSLICH damit – kein Text davor oder danach, kein Codezaun:

{"app":"atemfunk-klaerung","v":1,"plattform":"ChatGPT, Gemini oder leer","thema":"kurzer Titel","kern":"2–4 Sätze: worum es eigentlich ging","erkenntnisse":["…"],"gefuehleBeduerfnisse":["…"],"andereSicht":"…","naechsterSchritt":"…","offeneFrage":"…","satzFuerMich":"…"}

Regeln: Stütze dich nur auf den Text und erfinde nichts. Was nicht darin steht, bleibt leer ("" oder []). Schreib erkenntnisse, kern, naechsterSchritt und satzFuerMich aus Florians Sicht in der Ich-Form („Ich habe verstanden, dass …“). Bei einem Protokoll zählt, was Florian erkannt hat, nicht was die KI geraten hat. Höchstens 6 Erkenntnisse und 6 Gefühle/Bedürfnisse. satzFuerMich ist ein einziger Satz in Florians Worten; kommt keiner vor, leite ihn aus der wichtigsten Erkenntnis ab – kurz, ohne Pathos.`;

  const api = {
    TIEFEN, ARTEN, ZIELARTEN, ABSCHLUSS, GEMINI_URL, CHATGPT_URL, SYSTEM_ANALYSE, SYSTEM_UEBERSETZEN,
    kriseTreffer, personen, methodenFuer, baueVorlage, anknuepfenText, tageZwischen,
    normalisiereAnalyse, parseAnalyse, normalisiereKlaerung, parseKlaerung, jsonObjekte,
    eintragText, kuerze, zeilen, plattformName, txt, absatz, liste, satzEnde,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Klaeren = api;
})(typeof window !== "undefined" ? window : globalThis);
