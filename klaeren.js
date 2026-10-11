/* Klären – Oberfläche und Ablauf. Die Bausteine ohne Seite (Vorlage, Parser, Krisen-Treffer) stehen in klaeren-kern.js.
   Ablauf: erzählen → (Rückfragen) → Prompt für Gemini/ChatGPT → Zusammenfassung zurück → Vorschau → Journal.
   Alles Persönliche bleibt auf dem Gerät: Entwurf im localStorage (nicht gesynct), fertige Klärung als Journal-Eintrag. */
(function () {
  "use strict";
  const K = window.Klaeren;
  const ENTWURF = "atemfunk_klaeren", OFFEN = "atemfunk_klaeren_offen";
  const ARTNAME = { konflikt: "Konflikt", gedankenkreisen: "Gedankenkreisen", entscheidung: "Entscheidung",
                    gefuehl: "Gefühl", selbstbild: "Selbstbild", beziehung: "Beziehung", sonstiges: "Sonstiges" };
  const ESC = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
  const esc = s => String(s ?? "").replace(/[<>&"]/g, c => ESC[c]);
  const buehne = $("buehne");

  /* ---------- Zustand (= Entwurf) ---------- */
  function neu() {
    return { v: 1, start: Date.now(), schritt: "start", warten: "", text: "", tiefe: "ruhe", tiefeGewaehlt: false,
             kontext: true, analyse: null, ohneKI: "", antworten: [], skip: [], situation: null,
             kandidaten: [], anknKandidat: null, ankn: true, krise: false, plattform: "",
             einfuegen: "", vorschau: null, ergebnis: null };
  }
  let S = (() => {
    const d = store.getJSON(ENTWURF, null);
    return d && d.v === 1 && d.schritt && d.schritt !== "fertig" ? { ...neu(), ...d } : neu();
  })();
  let timer = null, speicherUhr = null;

  const hatInhalt = () => S.schritt !== "start" || S.text.trim().length > 0;
  function sichern() {
    if (S.schritt === "fertig") return;
    if (hatInhalt()) store.setJSON(ENTWURF, S);
  }
  function spaeterSichern() { clearTimeout(speicherUhr); speicherUhr = setTimeout(() => { uebernimmFelder(); sichern(); }, 400); }
  /* Liest, was gerade in den Feldern steht (das Diktat im Browser-Modus meldet kein input-Ereignis) */
  function uebernimmFelder() {
    const f = id => $(id) && $(id).value;
    if (S.schritt === "start" && f("text") != null) S.text = f("text");
    if (S.schritt === "rueckfragen") (S.analyse ? S.analyse.rueckfragen : []).forEach((_, i) => { if (f("rf" + i) != null) S.antworten[i] = f("rf" + i); });
    if (S.schritt === "ergebnis" && f("sit") != null) S.situation = f("sit");
    if (S.schritt === "einfuegen" && f("einf") != null) S.einfuegen = f("einf");
    if (S.schritt === "vorschau" && $("v_thema")) S.vorschau = { ...S.vorschau, ...leseVorschau() };
  }
  function flush() { clearTimeout(speicherUhr); uebernimmFelder(); sichern(); }
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });

  function melde(t) { $("hinweis").textContent = t || ""; }
  function flash(knopf, text) {
    const alt = knopf.dataset.label || (knopf.dataset.label = knopf.textContent);
    knopf.textContent = text;
    setTimeout(() => { knopf.textContent = alt; }, 1800);
  }

  /* ---------- Zwischenablage: muss im Tipp synchron laufen (iOS Safari, WKWebView) ---------- */
  function kopierenAlt(text) {
    const t = document.createElement("textarea");
    t.value = text; t.setAttribute("readonly", "");
    t.style.cssText = "position:fixed;opacity:0;top:0;left:0;font-size:16px";
    document.body.appendChild(t);
    let ok = false;
    try { t.focus({ preventScroll: true }); t.select(); t.setSelectionRange(0, text.length); ok = document.execCommand("copy"); } catch { /* dann nicht */ }
    t.remove();
    return ok;
  }
  function kopierenSync(text) {
    let p = null;
    try { if (navigator.clipboard && navigator.clipboard.writeText) p = navigator.clipboard.writeText(text); } catch { p = null; }
    const alt = kopierenAlt(text);     /* zusätzlich, ebenfalls synchron */
    return p ? p.then(() => true, () => alt) : Promise.resolve(alt);
  }
  function kopiere(text, knopf, was) {
    kopierenSync(text).then(ok => {
      const box = $("notfallBox");
      if (ok) {
        flash(knopf, "✓ kopiert");
        melde(was + " kopiert. Jetzt in Gemini oder ChatGPT einfügen.");
        if (box) box.hidden = true;
        return;
      }
      melde("Kopieren ging nicht. Markiere den Text unten und kopiere ihn selbst.");
      if (box) {
        box.hidden = false;
        const f = $("notfall"); f.value = text; f.focus(); f.select();
      }
    });
  }

  /* ---------- Krisen-Schutz ---------- */
  function pruefeKrise(...texte) {
    if (texte.some(t => K.kriseTreffer(t))) { S.krise = true; rendereKrise(); }
  }
  function rendereKrise() {
    const el = $("krise");
    if (!S.krise) { el.innerHTML = ""; return; }
    el.innerHTML = `<section class="krise" role="region" aria-label="Hilfe in schweren Momenten">
      <h2>Du musst das nicht allein tragen.</h2>
      <p>Wenn es dir gerade sehr schlecht geht, ist jemand für dich da. Rund um die Uhr, kostenlos und anonym.</p>
      <div class="row">
        <a class="btn" href="tel:08001110111">☎ 0800 111 0 111</a>
        <a class="btn" href="tel:08001110222">☎ 0800 111 0 222</a>
        <a class="btn" href="tel:116123">☎ 116 123</a>
      </div>
      <p>Telefonseelsorge, auch per Chat und Mail: <a href="https://telefonseelsorge.de" target="_blank" rel="noopener noreferrer">telefonseelsorge.de</a></p>
      <p>Bei akuter Gefahr: <a href="tel:112"><b>112</b></a> anrufen.</p>
      <p class="leise">Du kannst danach trotzdem hier weitermachen.</p>
    </section>`;
  }

  /* ---------- Rahmen ---------- */
  function rendereEtappen() {
    const nr = { start: 1, warten: 1, rueckfragen: 1, ergebnis: 2, einfuegen: 3, vorschau: 3, fertig: 3 }[S.schritt] || 1;
    const namen = ["Erzählen", "Gespräch führen", "Ins Journal"];
    $("etappen").innerHTML = namen.map((n, i) =>
      `<li class="${i + 1 === nr ? "jetzt" : i + 1 < nr ? "fertig" : ""}"${i + 1 === nr ? ' aria-current="step"' : ""}>${i + 1} · ${n}</li>`).join("");
  }
  function zeige(schritt) {
    S.schritt = schritt;
    clearInterval(timer);
    melde("");
    sichern();
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    clearInterval(timer);
    rendereEtappen(); rendereKrise();
    ({ start: rStart, warten: rWarten, rueckfragen: rRueck, ergebnis: rErgebnis, einfuegen: rEinfuegen,
       vorschau: rVorschau, fertig: rFertig }[S.schritt] || rStart)();
    $("verwerfen").hidden = S.schritt === "fertig" || !hatInhalt();
  }

  function chipsTiefe(host, onWahl) {
    host.innerHTML = "";
    host.setAttribute("role", "group"); host.setAttribute("aria-label", "Wie tief soll das Gespräch gehen?");
    for (const k of ["kurz", "ruhe", "tief"]) {
      const t = K.TIEFEN[k];
      const b = document.createElement("button");
      b.type = "button"; b.dataset.k = k;
      b.innerHTML = `<span class="ci">${t.icon}</span><span><b>${esc(t.name)}</b><small>${esc(t.dauer)}</small></span>`;
      b.addEventListener("click", () => { onWahl(k); mark(); });
      host.appendChild(b);
    }
    function mark() {
      for (const b of host.children) {
        const an = b.dataset.k === S.tiefe;
        b.className = "chip" + (an ? " an" : ""); b.setAttribute("aria-pressed", String(an));
      }
    }
    mark();
  }

  /* ---------- Schritt 1: erzählen ---------- */
  function rStart() {
    const hatWissen = !!(profil() || store.getJSON("atemfunk_lernen", []).length);
    buehne.innerHTML = `
      <div class="card">
        <label class="lab" for="text">Was beschäftigt dich?</label>
        <textarea id="text" rows="7" autocomplete="off" placeholder="Erzähl einfach, wie es kommt: zum Beispiel ein Streit mit einer Freundin, ein Gedanke, der nicht loslässt, oder eine Entscheidung, die ansteht."></textarea>
        <div class="row"><button class="btn rec" id="diktatBtn" type="button">🎙 Diktieren</button></div>
      </div>
      <div class="card">
        <div class="lab">Wie tief soll das Gespräch gehen?</div>
        <div class="chips" id="tiefen"></div>
        <label class="check"><input type="checkbox" id="kontext"><span>Was Atemfunk über mich weiß mitgeben
          <small>${hatWissen ? "Ein kurzes Profil, das, was du dir gemerkt hast, und frühere Klärungen können mit in den Prompt. Du liest ihn vor dem Kopieren."
                             : "Noch ist nichts gemerkt. Das füllt sich mit der Zeit."}</small></span></label>
      </div>
      <button class="btn primary breit" id="weiter" type="button">Weiter</button>`;
    const feld = $("text");
    feld.value = S.text;
    feld.addEventListener("input", () => { S.text = feld.value; spaeterSichern(); });
    diktat(feld, $("diktatBtn"));
    chipsTiefe($("tiefen"), k => { S.tiefe = k; S.tiefeGewaehlt = true; sichern(); });
    const kx = $("kontext");
    kx.checked = !!S.kontext;
    kx.addEventListener("change", () => { S.kontext = kx.checked; sichern(); });
    $("weiter").addEventListener("click", () => {
      S.text = feld.value.trim();
      if (S.text.length < 12) { melde("Erzähl ein bisschen mehr: ein, zwei Sätze reichen."); return; }
      pruefeKrise(S.text);
      starteAnalyse();
    });
  }

  /* ---------- Warten (Analyse oder Übersetzung) ---------- */
  function rWarten() {
    const analyse = S.warten === "analyse";
    buehne.innerHTML = `
      <div class="card warte" role="status" aria-live="polite">
        <span class="atem" aria-hidden="true"></span>
        <div><div id="warteText">${analyse ? "Ich ordne, was du erzählt hast …" : "Ich übersetze die Antwort in deine Zusammenfassung …"}</div>
        <div class="hint" id="warteZeit">Das dauert meist 15 bis 30 Sekunden.</div></div>
      </div>
      <button class="btn breit" id="ohne" type="button">${analyse ? "Ohne KI-Vorarbeit weiter" : "‹ Zurück"}</button>`;
    const t0 = Date.now();
    timer = setInterval(() => { $("warteZeit").textContent = "Schon " + Math.round((Date.now() - t0) / 1000) + " s. Das dauert meist 15 bis 30 Sekunden."; }, 1000);
    $("ohne").addEventListener("click", () => {
      localStorage.removeItem(OFFEN);       /* die späte Antwort wird dann verworfen */
      if (analyse) ohneKIWeiter("Du wolltest nicht länger warten.");
      else zeige("einfuegen");
    });
  }

  /* ---------- Analyse ---------- */
  async function alleKlaerungen() {
    try {
      const alle = await dbTx("journal", "readonly", s => s.getAll());
      return alle.filter(e => e && e.art === "klaerung" && e.klaerung).sort((a, b) => b.zeit - a.zeit).slice(0, 8)
        .map(e => {
          const k = e.klaerung || {};
          return { id: e.id, datum: e.datum, thema: K.txt(k.thema, 100),
                   kern: K.kuerze(K.txt(k.kern, 400), 200),
                   erkannt: K.kuerze(K.txt((k.erkenntnisse || [])[0] || k.satzFuerMich || k.kern, 300), 220),
                   offen: K.kuerze(K.txt(k.offeneFrage, 300), 200) };
        });
    } catch { return []; }
  }
  function analyseText(kand) {
    const teile = [];
    if (S.kontext) {
      const k = kontextBlock(store.getJSON("atemfunk_lernen", []).slice(0, 5)).trim();
      if (k) teile.push(k);
    }
    if (kand.length) teile.push("Frühere Klärungen (nur für das Feld \"anknuepfen\"):\n"
      + kand.map(c => `- id: ${c.id} | ${c.datum} | ${c.thema || "ohne Titel"} | ${c.kern}`).join("\n"));
    teile.push("Heute ist der " + heute() + ".");
    teile.push("Florians Schilderung (gesprochen oder getippt, ungeordnet):\n\"\"\"\n" + S.text.slice(0, 6000) + "\n\"\"\"");
    teile.push("Antworte jetzt nur mit dem JSON-Objekt.");
    return teile.join("\n\n");
  }
  async function starteAnalyse() {
    S.analyse = null; S.ohneKI = ""; S.antworten = []; S.skip = []; S.situation = null; S.anknKandidat = null;
    if (!kiBasis()) { ohneKIWeiter("Atemfunk ist noch nicht mit der KI verbunden."); return; }
    S.warten = "analyse";
    S.kandidaten = S.kontext ? await alleKlaerungen() : [];      /* ohne „Was Atemfunk über mich weiß“ auch keine früheren Klärungen */
    zeige("warten");
    const r = await frageKIgemerkt(OFFEN, { art: "analyse", klaerung: S.start }, K.SYSTEM_ANALYSE, analyseText(S.kandidaten), "opus");
    nimmAntwort(r, { art: "analyse", klaerung: S.start });
  }
  function ohneKIWeiter(grund) {
    S.analyse = null; S.ohneKI = grund; S.antworten = []; S.skip = []; S.situation = S.text; S.anknKandidat = null;
    zeige("ergebnis");
  }
  function fehlerText(f) {
    return /^(offline|timeout)$/i.test(String(f)) || /Keine Verbindung|Zu lange/.test(String(f))
      ? "Die KI-Verbindung ist gerade nicht erreichbar." : "Die KI hat gerade nicht geantwortet.";
  }
  function nimmAntwort(r, info) {
    if (!r || r.ueberholt || !info || info.klaerung !== S.start) return;
    if (info.art === "uebersetzen") return nimmUebersetzung(r);
    if (S.schritt !== "warten" || S.warten !== "analyse") return;
    if (r.fehler) { ohneKIWeiter(fehlerText(r.fehler)); return; }
    const a = K.parseAnalyse(r.text, S.kandidaten.map(c => c.id));
    if (!a) { ohneKIWeiter("Die Antwort der KI war nicht lesbar."); return; }
    S.analyse = a;
    if (a.krise) S.krise = true;
    if (!S.tiefeGewaehlt) S.tiefe = a.tiefe;
    S.anknKandidat = a.anknuepfen ? S.kandidaten.find(c => c.id === a.anknuepfen) || null : null;
    S.ankn = true;
    if (a.rueckfragen.length) { S.antworten = a.rueckfragen.map(() => ""); S.skip = a.rueckfragen.map(() => false); zeige("rueckfragen"); }
    else ergebnisVorbereiten();
  }
  /* Rückfragen-Antworten und KI-Fassung werden zu einem bearbeitbaren Situationstext */
  function ergebnisVorbereiten() {
    const a = S.analyse;
    let sit = a ? a.situation : S.text;
    const zus = a ? a.rueckfragen.map((q, i) => ({ q, a: (S.skip[i] ? "" : (S.antworten[i] || "")).trim() })).filter(x => x.a) : [];
    if (zus.length) sit += "\n\nErgänzend habe ich auf Nachfrage gesagt:\n" + zus.map(x => `- ${x.q} ${x.a}`).join("\n");
    S.situation = sit;
    zeige("ergebnis");
  }

  /* ---------- Schritt 1b: Rückfragen (höchstens eine Runde) ---------- */
  function rRueck() {
    const fragen = S.analyse.rueckfragen;
    buehne.innerHTML = `
      <div class="card">
        <div class="lab">Kurz nachgefragt, damit das Gespräch gut startet</div>
        <p class="hint" style="margin-top:0">Antworte nur, was du magst. Überspringen ist völlig in Ordnung.</p>
      </div>
      ${fragen.map((q, i) => `
        <div class="card rf" id="rfk${i}">
          <label class="frage" for="rf${i}">${esc(q)}</label>
          <textarea id="rf${i}" rows="3" autocomplete="off"></textarea>
          <div class="row"><button class="btn rec" id="rfD${i}" type="button">🎙 Diktieren</button>
            <button class="btn" id="rfS${i}" type="button">Überspringen</button></div>
        </div>`).join("")}
      <button class="btn primary breit" id="rfWeiter" type="button">Weiter zum Prompt</button>`;
    fragen.forEach((_, i) => {
      const f = $("rf" + i), karte = $("rfk" + i), sk = $("rfS" + i);
      f.value = S.antworten[i] || "";
      const setze = an => {
        S.skip[i] = an; karte.classList.toggle("uebersprungen", an); f.disabled = an;
        $("rfD" + i).disabled = an; sk.textContent = an ? "Doch antworten" : "Überspringen";
      };
      f.addEventListener("input", () => { S.antworten[i] = f.value; spaeterSichern(); });
      diktat(f, $("rfD" + i));
      sk.addEventListener("click", () => { setze(!S.skip[i]); sichern(); });
      setze(!!S.skip[i]);
    });
    $("rfWeiter").addEventListener("click", () => {
      uebernimmFelder();
      pruefeKrise(...S.antworten.filter((_, i) => !S.skip[i]));
      ergebnisVorbereiten();
    });
  }

  /* ---------- Schritt 2: der Prompt ---------- */
  function vorlageParams() {
    const a = S.analyse;
    return {
      situation: S.situation != null ? S.situation : S.text,
      beteiligte: a ? a.beteiligte : [],
      ziel: a ? a.ziel : null,
      tiefe: S.tiefe,
      art: a ? a.art : "sonstiges", artZusatz: a ? a.artZusatz : null,
      profil: S.kontext && a ? a.profilKurz : "",
      anknuepfen: S.ankn && S.anknKandidat ? S.anknKandidat : null,
      adhs: !!S.kontext && /ADHS/i.test(profil() || ""),
      heute: heute(),
    };
  }
  const promptJetzt = () => K.baueVorlage(vorlageParams());
  const kurzDatum = d => new Date(d + "T12:00").toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });

  function rErgebnis() {
    const a = S.analyse, kand = S.anknKandidat;
    const meta = a ? [ARTNAME[a.art] ? "Art: " + ARTNAME[a.art] : "", a.beteiligte.length ? "Beteiligt: " + a.beteiligte.join(", ") : ""].filter(Boolean).join(" · ") : "";
    buehne.innerHTML = `
      ${S.ohneKI ? `<div class="card info"><b>Ohne KI-Vorarbeit.</b> ${esc(S.ohneKI)} Ich habe deine Worte unverändert übernommen und die Methode bleibt allgemein. Das Gespräch klappt trotzdem.
        ${kiBasis() ? `<div class="row"><button class="btn" id="nochmalKI" type="button">🔁 Nochmal mit KI versuchen</button></div>` : ""}</div>` : ""}
      <div class="card">
        <label class="lab" for="sit">${a ? "So habe ich dich verstanden. Ändere, was nicht stimmt." : "Das geht als Schilderung in den Prompt. Ändere, was du magst."}</label>
        <textarea id="sit" rows="7" autocomplete="off"></textarea>
        ${meta ? `<div class="hint">${esc(meta)}</div>` : ""}
        <div class="lab" style="margin-top:16px">Wie tief soll das Gespräch gehen?</div>
        <div class="chips" id="tiefen"></div>
        <div class="hint" id="tiefeHinweis"></div>
        ${kand ? `<label class="check"><input type="checkbox" id="ankn"><span>An die frühere Klärung ${kand.thema ? "„" + esc(kand.thema) + "“ " : ""}(${esc(kurzDatum(kand.datum))}) anknüpfen
          <small>Was du damals erkannt hast und was offen blieb, geht mit in den Prompt.</small></span></label>` : ""}
      </div>
      <div class="card">
        <h2>Dein Gesprächs-Prompt</h2>
        <details id="promptBox"><summary>Prompt ansehen und gegenlesen</summary><pre class="prompt" id="promptText"></pre></details>
        <div class="row">
          <button class="btn primary" id="kopPrompt" type="button">📋 Prompt kopieren</button>
          <a class="btn" id="gem" href="${K.GEMINI_URL}" target="_blank" rel="noopener noreferrer">Gemini öffnen</a>
          <a class="btn" id="gpt" href="${K.CHATGPT_URL}" target="_blank" rel="noopener noreferrer">ChatGPT öffnen</a>
        </div>
        <div id="notfallBox" hidden><div class="hint">Kopieren ging nicht automatisch. Der Text ist markiert: halte ihn gedrückt und wähle „Kopieren“.</div>
          <textarea id="notfall" rows="5" readonly></textarea></div>
        <div class="hint">Tipp: Im Sprachmodus von Gemini oder ChatGPT einfügen und lossprechen. Sehr Privates? In ChatGPT „Temporärer Chat“, in Gemini „Vorübergehender Chat“ wählen. Für andere Personen reicht der Vorname.</div>
      </div>
      <div class="card">
        <h2>Wenn das Gespräch fertig ist</h2>
        <ol class="nummern">
          <li>Abschluss-Prompt kopieren und im selben Chat einfügen.</li>
          <li>Die Antwort der KI kopieren.</li>
          <li>Hier einfügen. Du siehst alles vorher, gespeichert wird erst auf deinen Tipp.</li>
        </ol>
        <div class="row">
          <button class="btn" id="kopAbschluss" type="button">📋 Abschluss-Prompt kopieren</button>
          <button class="btn primary" id="einfuegen" type="button">📥 Zusammenfassung einfügen</button>
        </div>
      </div>
      <button class="btn breit" id="zurueckStart" type="button">‹ Text ändern</button>`;
    const sit = $("sit");
    sit.value = S.situation != null ? S.situation : S.text;
    const wachse = () => { sit.style.height = "auto"; sit.style.height = Math.min(sit.scrollHeight + 2, 460) + "px"; };
    wachse();
    const aktualisiere = () => { $("promptText").textContent = promptJetzt(); };
    sit.addEventListener("input", () => { S.situation = sit.value; wachse(); aktualisiere(); spaeterSichern(); });
    const tiefeHinweis = () => {
      $("tiefeHinweis").textContent = a && a.tiefe !== S.tiefe
        ? `Atemfunk würde ${K.TIEFEN[a.tiefe].icon} ${K.TIEFEN[a.tiefe].name} vorschlagen. Du entscheidest.` : "";
    };
    chipsTiefe($("tiefen"), k => { S.tiefe = k; S.tiefeGewaehlt = true; aktualisiere(); tiefeHinweis(); sichern(); });
    tiefeHinweis();
    if (kand) {
      const c = $("ankn"); c.checked = !!S.ankn;
      c.addEventListener("change", () => { S.ankn = c.checked; aktualisiere(); sichern(); });
    }
    aktualisiere();
    /* Kopieren: Text ist schon fertig, im Tipp wird nur noch kopiert */
    $("kopPrompt").addEventListener("click", ev => kopiere(promptJetzt(), ev.currentTarget, "Prompt"));
    $("kopAbschluss").addEventListener("click", ev => kopiere(K.ABSCHLUSS, ev.currentTarget, "Abschluss-Prompt"));
    $("gem").addEventListener("click", () => { S.plattform = "Gemini"; flush(); });
    $("gpt").addEventListener("click", () => { S.plattform = "ChatGPT"; flush(); });
    $("einfuegen").addEventListener("click", () => { uebernimmFelder(); zeige("einfuegen"); });
    $("zurueckStart").addEventListener("click", () => { uebernimmFelder(); S.analyse = null; S.situation = null; zeige("start"); });
    if ($("nochmalKI")) $("nochmalKI").addEventListener("click", () => starteAnalyse());
  }

  /* ---------- Schritt 3: Zusammenfassung zurückholen ---------- */
  function rEinfuegen() {
    buehne.innerHTML = `
      <div class="card">
        <label class="lab" for="einf">Antwort der KI einfügen</label>
        <textarea id="einf" rows="9" autocomplete="off" placeholder="Hier einfügen: der JSON-Block der KI. Hat sie nur erzählt, genügt auch der ganze Text oder das Gespräch, dann übersetze ich ihn."></textarea>
        <div class="row">
          <button class="btn" id="ablage" type="button">📋 Aus der Zwischenablage</button>
          <button class="btn primary" id="pruefen" type="button">Prüfen</button>
        </div>
        <div class="hint">Noch wird nichts gespeichert. Du siehst zuerst eine Vorschau.</div>
      </div>
      <button class="btn breit" id="zurueckErg" type="button">‹ Zurück zum Prompt</button>`;
    const f = $("einf");
    f.value = S.einfuegen || "";
    f.addEventListener("input", () => { S.einfuegen = f.value; spaeterSichern(); });
    $("ablage").addEventListener("click", async () => {
      try {
        const t = await navigator.clipboard.readText();
        if (t) { f.value = t; S.einfuegen = t; sichern(); melde(""); } else melde("Die Zwischenablage ist leer.");
      } catch { melde("Das Einfügen aus der Zwischenablage ist hier nicht erlaubt. Halte das Feld gedrückt und wähle „Einfügen“."); }
    });
    $("pruefen").addEventListener("click", pruefen);
    $("zurueckErg").addEventListener("click", () => { uebernimmFelder(); zeige("ergebnis"); });
  }

  async function pruefen() {
    const t = $("einf").value.trim();
    S.einfuegen = t;
    if (!t) { melde("Füge zuerst die Antwort der KI ein."); return; }
    const g = K.parseKlaerung(t);
    if (g && g.platzhalter) {
      melde("Das ist noch der Abschluss-Prompt selbst. Schick ihn erst an Gemini oder ChatGPT und kopiere dann deren Antwort.");
      return;
    }
    if (g) { S.vorschau = { ...g, ueber: false }; if (!S.vorschau.plattform) S.vorschau.plattform = S.plattform; pruefeKrise(t); zeige("vorschau"); return; }
    if (!kiBasis()) {
      melde("Das habe ich nicht als Zusammenfassung erkannt, und ohne KI-Verbindung kann ich es nicht übersetzen. Kopiere den Abschluss-Prompt noch einmal und füge die neue Antwort ein.");
      return;
    }
    S.warten = "uebersetzen";
    zeige("warten");
    const info = { art: "uebersetzen", klaerung: S.start };
    const r = await frageKIgemerkt(OFFEN, info, K.SYSTEM_UEBERSETZEN, "Das hat Florian zurückgebracht:\n\n\"\"\"\n" + t.slice(-24000) + "\n\"\"\"", "sonnet");
    nimmAntwort(r, info);
  }
  function nimmUebersetzung(r) {
    if (S.schritt !== "warten" || S.warten !== "uebersetzen") return;
    const zurueck = text => { zeige("einfuegen"); melde(text); };
    if (r.fehler) { zurueck(fehlerText(r.fehler) + " Probier es später noch einmal oder bitte die KI, nur den JSON-Block zu schicken."); return; }
    const g = K.parseKlaerung(r.text);
    if (!g || g.platzhalter) { zurueck("Daraus konnte ich keine Zusammenfassung machen. Bitte die KI noch einmal um den JSON-Block (📋 Abschluss-Prompt) und füge ihn ein."); return; }
    S.vorschau = { ...g, ueber: true };
    if (!S.vorschau.plattform) S.vorschau.plattform = S.plattform;
    zeige("vorschau");
  }

  /* ---------- Vorschau (schreibt nichts) ---------- */
  function rVorschau() {
    const v = S.vorschau || {};
    const feld = (id, label, wert, zeilen) => `<div class="fe"><label class="lab" for="${id}">${label}</label>
      <textarea id="${id}" rows="${zeilen}" autocomplete="off">${esc(wert)}</textarea></div>`;
    buehne.innerHTML = `
      <div class="card info">
        <b>Vorschau.</b> Bisher ist nichts gespeichert. Ändere, was du willst.
        ${v.ueber ? "<br>Atemfunk hat die Antwort aus freiem Text übersetzt. Bitte kurz gegenlesen." : ""}
      </div>
      <div class="card">
        <div class="fe"><label class="lab" for="v_thema">Titel</label><input type="text" id="v_thema" autocomplete="off"></div>
        <div class="fe"><label class="lab" for="v_plattform">Gespräch mit</label><input type="text" id="v_plattform" autocomplete="off" placeholder="Gemini oder ChatGPT"></div>
        ${feld("v_kern", "Worum es eigentlich ging", v.kern || "", 4)}
        ${feld("v_erk", "Was ich erkannt habe (eine pro Zeile)", (v.erkenntnisse || []).join("\n"), 5)}
        ${feld("v_gef", "Gefühle und Bedürfnisse (eine pro Zeile)", (v.gefuehleBeduerfnisse || []).join("\n"), 4)}
        ${feld("v_andere", "Wie die andere Seite es vermutlich erlebt", v.andereSicht || "", 3)}
        ${feld("v_schritt", "Mein nächster kleiner Schritt", v.naechsterSchritt || "", 3)}
        ${feld("v_offen", "Was noch offen ist", v.offeneFrage || "", 3)}
        <div class="fe"><label class="lab" for="v_satz">Ein Satz für mich</label><input type="text" id="v_satz" autocomplete="off"></div>
      </div>
      <div class="card">
        <div class="hint" style="margin-top:0">Beim Übernehmen passiert Folgendes: Ein Journal-Eintrag 🫂 wird angelegt. Der Satz für dich und bis zu zwei Erkenntnisse kommen unter „Was ich gelernt habe“. Die offene Frage wird ein offener Faden, den Abendrunde und Journal später aufgreifen.</div>
        <div class="row"><button class="btn primary" id="uebernehmen" type="button">🫂 Ins Journal</button>
          <button class="btn" id="zurueckEinf" type="button">‹ Zurück</button></div>
      </div>`;
    $("v_thema").value = v.thema || "";
    $("v_plattform").value = v.plattform || "";
    $("v_satz").value = v.satzFuerMich || "";
    for (const el of buehne.querySelectorAll("textarea, input")) el.addEventListener("input", spaeterSichern);
    $("uebernehmen").addEventListener("click", ev => uebernehmen(ev.currentTarget));
    $("zurueckEinf").addEventListener("click", () => { uebernimmFelder(); zeige("einfuegen"); });
  }
  function leseVorschau() {
    const v = id => ($(id) ? $(id).value : "").trim();
    return {
      thema: K.txt(v("v_thema"), 160), plattform: K.txt(v("v_plattform"), 40),
      kern: K.absatz(v("v_kern"), 1200),
      erkenntnisse: K.zeilen(v("v_erk")).map(x => K.txt(x, 320)).slice(0, 10),
      gefuehleBeduerfnisse: K.zeilen(v("v_gef")).map(x => K.txt(x, 200)).slice(0, 10),
      andereSicht: K.absatz(v("v_andere"), 700), naechsterSchritt: K.absatz(v("v_schritt"), 500),
      offeneFrage: K.absatz(v("v_offen"), 400), satzFuerMich: K.txt(v("v_satz"), 300),
    };
  }

  /* ---------- Übernehmen: Journal, Erkenntnisse, Fäden ---------- */
  function merkeErkenntnisse(texte) {
    const l = store.getJSON("atemfunk_lernen", []);
    let n = 0;
    for (const t of texte.slice().reverse()) {      /* rückwärts einsetzen: der erste Eintrag steht danach ganz oben */
      const text = K.kuerze(K.txt(t, 400), 300);
      if (text.length < 8 || l.some(x => x && x.text === text)) continue;
      l.unshift({ datum: heute(), text }); n++;
    }
    if (n) store.setJSON("atemfunk_lernen", l.slice(0, 60));
    return n;
  }
  async function uebernehmen(knopf) {
    const v = leseVorschau();
    if (!v.thema && !v.kern && !v.erkenntnisse.length) { melde("Mindestens Titel, Kern oder eine Erkenntnis sollte drinstehen."); return; }
    if (!v.thema) v.thema = K.kuerze(v.kern, 60).replace(/ …$/, "");
    knopf.disabled = true;
    const id = "klaerung-" + S.start;
    const eintrag = {
      id, datum: heute(), zeit: Date.now(), art: "klaerung",
      text: K.eintragText({ ...v, datum: heute(), tiefe: S.tiefe, schilderung: S.text }),
      klaerung: { thema: v.thema, plattform: v.plattform, tiefe: S.tiefe, kern: v.kern, erkenntnisse: v.erkenntnisse,
                  offeneFrage: v.offeneFrage, satzFuerMich: v.satzFuerMich },
    };
    try {
      await dbTx("journal", "readwrite", s => s.put(eintrag));         /* gleiche id = nie doppelt */
      const da = await dbTx("journal", "readonly", s => s.get(id));
      if (!da) throw new Error("nicht gefunden");
    } catch {
      knopf.disabled = false;
      melde("Konnte nicht ins Journal schreiben. Deine Angaben bleiben hier stehen. Versuch es gleich noch einmal.");
      return;
    }
    const gelernt = merkeErkenntnisse([v.satzFuerMich, ...v.erkenntnisse.slice(0, 2)].filter(Boolean));
    let faden = false;
    if (v.offeneFrage) {
      const ft = `Klärung „${v.thema}“, offen: ${K.kuerze(v.offeneFrage, 220)}`;
      merkeFaden(ft);
      faden = faeden().some(f => f.text === ft.trim());
    }
    S.ergebnis = { gelernt, faden, titel: v.thema };
    S.schritt = "fertig";
    localStorage.removeItem(ENTWURF); localStorage.removeItem(OFFEN);
    zeige("fertig");
  }

  /* ---------- Fertig ---------- */
  function rFertig() {
    const e = S.ergebnis || {};
    buehne.innerHTML = `
      <div class="card fertig">
        <h2>✓ Im Journal gespeichert</h2>
        <p>„${esc(e.titel || "Klärung")}“ steht jetzt im Journal, mit 🫂 gekennzeichnet.</p>
        <ul>
          <li>${e.gelernt ? e.gelernt + (e.gelernt === 1 ? " Erkenntnis" : " Erkenntnisse") + " unter „Was ich gelernt habe“ gemerkt" : "Keine neue Erkenntnis gemerkt (war schon da)"}</li>
          <li>${e.faden ? "Die offene Frage ist ein Faden für die nächsten Gespräche" : "Kein offener Faden"}</li>
        </ul>
        <div class="row"><a class="btn primary" href="journal.html">Zum Journal</a>
          <button class="btn" id="nochmal" type="button">Noch etwas klären</button></div>
      </div>`;
    $("nochmal").addEventListener("click", () => { S = neu(); zeige("start"); });
  }

  $("verwerfen").addEventListener("click", () => {
    if (!confirm("Diese Klärung wirklich verwerfen? Der Entwurf geht verloren.")) return;
    localStorage.removeItem(ENTWURF); localStorage.removeItem(OFFEN);
    S = neu(); render(); window.scrollTo(0, 0);
  });

  /* ---------- Start: ggf. noch offene Antwort abholen ---------- */
  render();
  (async function aufnehmen() {
    const o = store.getJSON(OFFEN, null);
    if (!o) {
      if (S.schritt === "warten") {          /* Anfrage ist weg, bevor die Antwort kam */
        if (S.warten === "analyse") ohneKIWeiter("Die Antwort der KI ging unterwegs verloren.");
        else { zeige("einfuegen"); melde("Die Antwort ging unterwegs verloren. Bitte nochmal auf „Prüfen“ tippen."); }
      }
      return;
    }
    if (o.klaerung !== S.start || S.schritt !== "warten") { localStorage.removeItem(OFFEN); return; }
    const r = await offeneAnfrage(OFFEN);
    if (r) nimmAntwort(r, r.info);
  })();
})();
