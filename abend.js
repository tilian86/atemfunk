/* Geführte Runde im Journal: führt mit Fragen durch den Tag – eine nach der anderen.
   Die nächste Frage geht auf die letzte Antwort ein (KI über die Bridge, Max-Abo). Ohne
   Verbindung kommen die Fragen aus der eigenen Sammlung (abendfragen.json).

   Tageszeit (seit 11.10.2026): morgens (4–12 Uhr) „☀️ Morgenrunde“ – ankommen, ausrichten, kleinster
   erster Schritt, mit Blick auf gestern Abend; mittags (12–17 Uhr) „🌤 Zwischenhalt“; abends (17–4 Uhr)
   „🌙 Abendrunde“ wie bisher. Morgens/mittags lässt sich die Abendrunde von gestern nachholen.
   Journal-Einträge: „morgen-<start>“, „mittag-<start>“, „abend-<start>“.

   Abwechslung: Die Einstiegsform wählt die App per Zufall (die letzten 10 sind gesperrt),
   manchmal kommt mitten in der Runde ein überraschendes Format, und die Fragen der letzten
   Abende gehen als „nicht wiederholen“ mit in den Auftrag.

   Hält durch: Zustand im localStorage (atemfunk_abend), Antwort-Entwurf (atemfunk_abend_entwurf),
   laufende KI-Anfrage per rid (atemfunk_abend_offen) – wie das Reflexions-Gespräch.
   Gespeichert wird als EIN Journal-Eintrag „abend-<start>“, der mit jeder Antwort mitwächst.
   Braucht aus journal.html: speichern, alleEintraege, zeigeHeute, zeigeFaeden, erkenntnisse. */
"use strict";
(function () {
  const ZUSTAND = "atemfunk_abend", OFFEN_A = "atemfunk_abend_offen", ENTWURF_A = "atemfunk_abend_entwurf";
  const GEDAECHTNIS = "atemfunk_abend_gedaechtnis", AUTO_A = "atemfunk_abend_vorlesen";
  const GUELTIG = 18 * 3600e3;          /* eine Runde gilt 18 Stunden – auch nach Mitternacht */
  const NICHT_WARTEN_AB = 20;           /* Sekunden, ab denen „Nicht warten“ erscheint */

  const WECHSEL = 90 * 60e3;            /* ruht eine Runde so lange und die Tageszeit ist eine andere: neu anfangen */

  let wartet = false, warteUhr = null, bankDaten = null;
  let autoLesen = store.get(AUTO_A, "off") === "on";

  /* ---------- Tageszeit ---------- */
  function tageszeit(ts) {
    const h = new Date(ts == null ? Date.now() : ts).getHours();
    return h >= 4 && h < 12 ? "morgen" : h >= 12 && h < 17 ? "mittag" : "abend";
  }
  const ZEITEN = {
    morgen: { name: "Morgenrunde", gen: "der Morgenrunde", dat: "dieser Morgenrunde", emoji: "☀️",
              knopf: "☀️ Gut in den Tag starten", faden: "Fokus für heute",
              hinweis: "Zwei bis vier Fragen für den Start in den Tag – ankommen, ausrichten, ein erster Schritt. "
                + "Etwa 3–5 Minuten, per Text oder Diktat." },
    mittag: { name: "Zwischenhalt", gen: "des Zwischenhalts", dat: "diesem Zwischenhalt", emoji: "🌤",
              knopf: "🌤 Kurzer Zwischenhalt", faden: "Für den Nachmittag",
              hinweis: "Zwei, drei Fragen mitten am Tag – wo du stehst und was der Nachmittag braucht. "
                + "Etwa 2–4 Minuten, per Text oder Diktat." },
    abend:  { name: "Abendrunde", gen: "der Abendrunde", dat: "dieser Abendrunde", emoji: "🌙",
              knopf: "🌙 Durch den Tag führen", faden: "Faden für morgen",
              hinweis: "Drei bis fünf Fragen zu deinem Tag, eine nach der anderen – jeden Abend anders, etwa 5–10 Minuten. "
                + "Antworten per Text oder Diktat." },
  };
  const zeitVon = z => (z && ZEITEN[z.zeit]) ? z.zeit : "abend";       /* Runden vor Version 50 waren alle abends */
  const zeitInfo = z => ZEITEN[zeitVon(z)];
  const fadenName = z => z.nachgeholt ? "Faden für heute" : zeitInfo(z).faden;
  const eintragId = z => zeitVon(z) + "-" + z.start;
  const RUNDE_ID = /^(abend|morgen|mittag)-/;
  const gestern = () => abendTag(Date.now() - 864e5);
  const wochentag = datum => new Date(datum + "T12:00").toLocaleDateString("de-DE", { weekday: "long" });

  /* ---------- Zustand ---------- */
  function lade() {
    const z = store.getJSON(ZUSTAND, null);
    if (!(z && z.v === 1 && Array.isArray(z.runden) && Date.now() - z.start < GUELTIG)) return null;
    /* Eine fertige Runde vom Vorabend nicht weiter anzeigen – sonst blockierte eine Runde,
       die nach Mitternacht endete, am nächsten Abend den Start (bis zu 18 Stunden lang). */
    if (z.phase === "ende" && abendTag(z.start) !== abendTag()) return null;
    /* Morgenrunde liegengelassen, jetzt ist Abend: nicht dort weitermachen – die Antworten stehen schon im Journal */
    if (zeitVon(z) !== tageszeit() && Date.now() - (z.aktiv || z.start) > WECHSEL) return null;
    return z;
  }
  const sichere = z => { z.aktiv = Date.now(); try { localStorage.setItem(ZUSTAND, JSON.stringify(z)); } catch {} };
  function gedaechtnis() {
    const g = store.getJSON(GEDAECHTNIS, {});
    for (const k of ["einstiege", "ueberraschungen", "fragen", "arten", "bank", "anker"]) if (!Array.isArray(g[k])) g[k] = [];
    if (!g.letzteJe || typeof g.letzteJe !== "object") g.letzteJe = { abend: g.letzte || "" };
    return g;
  }
  function merke(feld, wert, max) {
    if (!wert) return;
    const g = gedaechtnis();
    g[feld] = [wert, ...g[feld].filter(x => x !== wert)].slice(0, max);
    try { localStorage.setItem(GEDAECHTNIS, JSON.stringify(g)); } catch {}
  }
  function merkeTag(datum, zeit) {
    const g = gedaechtnis();
    g.letzteJe[zeit] = datum;
    if (zeit === "abend") g.letzte = datum;
    try { localStorage.setItem(GEDAECHTNIS, JSON.stringify(g)); } catch {}
  }

  /* ---------- Wochenspiegel ----------
     Der letzte Wochenspiegel (höchstens 9 Tage alt) liefert Vermutungen über Florian und eine Frage für die
     Woche. An manchen Abenden knüpft eine Frage gezielt daran an: prüfen, schärfen oder widerlegen.
     Gelesen wird aus dem Journal-Eintrag selbst – dadurch auf allen Geräten gleich, ohne eigenen Sync. */
  const SPIEGEL_RE = /^(🪞\s*)?(Wochenspiegel|Wochenrückblick)\b/;
  let spiegelCache = null;
  async function letzterSpiegel() {
    try {
      const e = (await alleEintraege())
        .filter(x => SPIEGEL_RE.test(x.text || "") && Date.now() - x.zeit < 9 * 864e5)
        .sort((a, b) => b.zeit - a.zeit)[0];
      if (!e) return (spiegelCache = null);
      const sauber = t => t.replace(/\*\*/g, "").replace(/^[„"]|[“"]$/g, "").trim();
      const vermutungen = [...e.text.matchAll(/^[\s>*_-]*Vermutung[*_]*\s*\d*[*_]*\s*:\s*(.+)$/gim)]
        .map(m => sauber(m[1])).filter(t => t.length > 15).slice(0, 3);
      const frage = sauber((e.text.match(/^[\s>*_-]*Frage für die (?:nächste )?Woche[*_]*\s*:\s*(.+)$/im) || [])[1] || "");
      return (spiegelCache = { datum: e.datum, vermutungen, frage });
    } catch { return (spiegelCache = null); }
  }

  /* ---------- Fragensammlung ---------- */
  const NOTFRAGEN = {
    abend: ["Welcher Moment von heute taucht als Erstes auf, wenn du an den Tag denkst?",
            "Was davon geht dir am meisten nach?",
            "Was darf von heute einfach hierbleiben, statt mit in die Nacht zu kommen?"],
    morgen: ["Mit welchem Gedanken bist du heute aufgewacht?",
             "Wenn heute nur eine Sache klappt – welche soll es sein?",
             "Was ist dein erster Schritt, sobald du hier fertig bist?"],
    mittag: ["Was vom Vormittag hängt dir noch nach?",
             "Was würde dir in den nächsten fünf Minuten guttun?",
             "Welche eine Sache würde den Nachmittag gut machen?"],
  };
  /* Folgefragen passen zu jeder Tageszeit; alles andere ohne „zeit“-Feld gehört zum Abend */
  const GETEILT = ["folgen", "folgenWort", "nachhaken"];
  const fragtZu = (f, zeit) => f.zeit ? f.zeit === zeit : (zeit === "abend" || GETEILT.includes(f.kat));
  const MITTE = ["moment", "skala", "ausnahme", "wunder", "werte", "mitgefuehl", "koerper",
                 "beziehung", "perspektive", "mut", "energie"];
  const KAT_NAME = {
    einstieg: "Einstieg", moment: "Ein Moment", skala: "Skala", ausnahme: "Ausnahme", wunder: "Wunderfrage",
    werte: "Was dir wichtig ist", mitgefuehl: "Freundlich mit dir", koerper: "Körper", beziehung: "Menschen",
    perspektive: "Perspektivwechsel", mut: "Mut", energie: "Energie", spiel: "Überraschung", dank: "Kleinigkeiten",
    abschluss: "Ausklang", folgen: "Nachgefragt", folgenWort: "Nachgefragt", nachhaken: "Nachhaken",
    fokus: "Das Eine", reibung: "Reibung", schritt: "Erster Schritt", menschen: "Menschen", kurs: "Kurs prüfen",
  };
  async function bank() {
    if (bankDaten) return bankDaten;
    try {
      const r = await fetch("abendfragen.json?v=3");
      if (r.ok) bankDaten = await r.json();
    } catch {}
    return bankDaten;
  }
  const zufall = l => l[Math.floor(Math.random() * l.length)];

  /* Stichwort aus der Antwort für Folgefragen ohne KI: ein Hauptwort mitten im Satz */
  const STOPP = new Set(("Ich Du Er Sie Es Wir Ihr Das Der Die Den Dem Des Ein Eine Einen Einem Einer Heute Morgen "
    + "Gestern Abend Dann Aber Und Oder Weil Wenn Als Also Nicht Noch Schon Mehr Viel Sehr Jetzt Hier Dort Was Wie "
    + "Wo Wer Irgendwie Eigentlich Vielleicht Manchmal Immer Nie Alles Nichts Etwas Mein Meine Dein Deine Sein Seine "
    + "Ihre Uns Euch Mich Mir Dich Dir Naja Okay Zeit Tag Tage Ende Anfang Moment Sache Sachen Dinge Ding Frage "
    + "Montag Dienstag Mittwoch Donnerstag Freitag Samstag Sonntag Uhr Stunde Stunden Minuten Prozent Gefühl").split(" "));
  function stichwort(text) {
    const woerter = String(text || "").replace(/[„“"»«()]/g, " ").split(/\s+/).filter(Boolean);
    const kand = [];
    woerter.forEach((w, i) => {
      if (i === 0 || /[.!?:]$/.test(woerter[i - 1])) return;            /* Satzanfang zählt nicht */
      const s = w.replace(/[^A-Za-zÄÖÜäöüß-]/g, "");
      if (/^[A-ZÄÖÜ][a-zäöüß-]{3,}$/.test(s) && !STOPP.has(s)) kand.push(s);
    });
    return kand.sort((a, b) => b.length - a.length)[0] || "";
  }

  /* Zu knappe Antwort („tut weh“, „ging so“)? Dann genau dort eine Ebene tiefer fragen statt weiterspringen –
     höchstens zweimal hintereinander an derselben Stelle (Florians Wunsch 11.10.2026). */
  const KNAPP_WOERTER = 5;
  const knapp = r => !!r && r.status === "beantwortet" && r.a.trim().split(/\s+/).length <= KNAPP_WOERTER;
  function nachhakenFaellig(z) {
    if (!knapp(z.runden[z.runden.length - 1])) return false;
    let schon = 0;
    for (let i = z.runden.length - 1; i >= 0 && z.runden[i].nachhaken; i--) schon++;
    return schon < 2;
  }
  const antwortZitat = r => String((r && r.a) || "").replace(/[„“"»«]/g, "").replace(/[\s.!?…,;:]+$/, "").trim();

  /* Nachgeholte Abendrunde ohne KI: Abendfragen sprechen von „heute“ – gemeint ist jetzt gestern */
  const aufGestern = t => t.replace(/\bheute\b/g, "gestern").replace(/\bHeute\b/g, "Gestern")
    .replace(/\bheutigen\b/g, "gestrigen").replace(/\bmorgen\b/g, "heute");
  async function bankFrage(z) {
    const f = await bankFrageRoh(z);
    if (z.nachgeholt && f.frage) f.frage = aufGestern(f.frage);
    return f;
  }
  async function bankFrageRoh(z) {
    const b = await bank();
    const n = z.runden.length + 1;
    const zeit = zeitVon(z);
    if (!b) return { frage: NOTFRAGEN[zeit][n === 1 ? 0 : n >= z.plan ? 2 : 1], spiegel: "", art: "", quelle: "bank" };
    const fragen = b.fragen.filter(f => fragtZu(f, zeit));
    const letzte = z.runden[z.runden.length - 1];
    if (z.hakNach) {
      const pool = fragen.filter(f => f.kat === "nachhaken" && !z.runden.some(r => r.bankId === f.id));
      if (pool.length) {
        const f = zufall(pool);
        return { frage: f.text.replace(/\{antwort\}/g, antwortZitat(letzte)), spiegel: "", art: KAT_NAME.nachhaken,
                 kat: f.kat, quelle: "bank", bankId: f.id };
      }
    }
    if (z.anker && z.anker.runde === n && z.anker.art === "frage" && !z.runden.some(r => r.frage === z.anker.text))
      return { frage: z.anker.text, spiegel: "", art: "Frage der Woche", quelle: "bank" };
    let kats, wort = "";
    if (n === 1) kats = ["einstieg"];
    else if (n >= z.plan) kats = ["abschluss"];
    else if (z.ueberraschung && z.ueberraschung.runde === n) kats = ["spiel"];
    else if (letzte && letzte.status === "beantwortet" && letzte.a.split(/\s+/).length >= 8 && Math.random() < 0.5) {
      wort = stichwort(letzte.a);
      kats = wort && Math.random() < 0.4 ? ["folgenWort"] : ["folgen"];
    } else if (zeit === "abend" && Math.random() < 0.08) kats = ["dank"];
    else {
      /* Mitte: abends die festen Kategorien, morgens/mittags alle eigenen außer Einstieg/Abschluss/Spiel */
      const mitte = zeit === "abend" ? MITTE : [...new Set(fragen.filter(f => f.zeit === zeit
        && !["einstieg", "abschluss", "spiel"].includes(f.kat)).map(f => f.kat))];
      kats = [zufall(mitte.filter(k => !letzte || k !== letzte.kat).concat(mitte.length === 1 ? mitte : []))];
    }
    const g = gedaechtnis();
    const hier = new Set([...z.runden.map(r => r.bankId), z.aktuell && z.aktuell.bankId].filter(Boolean));
    const passt = f => kats.includes(f.kat) && !hier.has(f.id);
    let pool = fragen.filter(f => passt(f) && !g.bank.includes(f.id));
    if (!pool.length) pool = fragen.filter(passt);
    if (!pool.length) pool = fragen.filter(f => f.kat === "folgen" && !hier.has(f.id));
    const f = zufall(pool);
    return { frage: f.text.replace(/\{wort\}/g, wort), spiegel: "", art: KAT_NAME[f.kat] || "", kat: f.kat,
             quelle: "bank", bankId: f.id };
  }

  /* ---------- Auftrag an die KI ---------- */
  /* Gilt für jede Tageszeit: zuhören, nachhaken, Ausgabeformat */
  const ZUHOEREN = `Aktives Zuhören (ab der zweiten Frage):
– SPIEGEL: ein kurzer Satz (höchstens 18 Wörter), der zeigt, dass du genau zugehört hast – am besten mit einem seiner
  eigenen Worte oder einer präzisen Beobachtung. Keine Wertung („Stark“, „Spannend“, „Das ist mutig“), kein
  „Danke für deine Offenheit“, kein „Ich höre, dass …“. Ist nichts Sinnvolles zu spiegeln: leer lassen.
– Danach vertiefen – dort, wo in seiner Antwort die meiste Energie steckt (ein auffälliges Wort, ein Widerspruch,
  ein Zögern, etwas halb Gesagtes) – oder bewusst wechseln, wenn es ausgeschöpft wirkt.
– Antwortet er sehr knapp (ein paar Wörter wie „tut weh“, „ging so“, „Stress halt“): NICHT das Thema wechseln,
  sondern genau dort eine Ebene tiefer fragen – konkret, behutsam, gern mit seinem eigenen Wort (was genau, wo,
  seit wann, was war kurz davor, woran er es merkt). Bleibt er nach zweimal Nachhaken knapp, leicht weiterziehen.
– Überspringt er eine Frage: leichter und spielerischer werden statt nachbohren.
– Nie dieselbe Art Frage zweimal hintereinander.

Antworte NUR mit diesen drei Zeilen, ohne Vorspann und ohne Anführungszeichen drumherum:
SPIEGEL: <ein Satz oder leer>
FRAGE: <die eine Frage>
ART: <zwei bis vier Wörter: welches Werkzeug oder Format du gewählt hast>`;

  const SYSTEM_ABEND = `Du führst Florian am Abend mit ein paar Fragen durch seinen Tag – eine nach der anderen,
wie in einem guten Gespräch. Klingen sollst du wie ein kluger, neugieriger Freund mit psychologischem Gespür,
der abends kurz nachfragt: nicht wie ein Fragebogen, nicht wie ein Coaching-Kärtchen, nicht wie eine Therapiestunde.
Florian hat ADHS, mag es konkret und hasst Küchenpsychologie, Kalendersprüche und Kitsch. Die ganze Runde soll in
fünf bis zehn Minuten machbar sein, damit er sie jeden Abend durchhält – und sich trotzdem nie gleich anfühlen.

Die Frage:
– Genau EINE Frage, meist ein einziger kurzer Satz, höchstens 25 Wörter. Keine Doppelfrage, keine Auswahlliste.
– In fünf Sekunden verstanden, in ein, zwei Minuten beantwortbar – und trotzdem mit Tiefe: Sie öffnet etwas,
  statt nur abzufragen.
– Konkret am heutigen Tag: ein Moment, eine Szene, ein Satz, eine Uhrzeit, ein Mensch – nicht „der Tag insgesamt“.
– Offen (was, wie, woran, wann, wer, wo). „Warum“ fast nie – es macht eng und rechtfertigend.
– Keine Ja/Nein-Frage und keine, die die Antwort schon nahelegt („Käme X in den Trailer?“, „War das befreiend?“).
  Lass ihn selbst wählen, was wichtig war – du darfst an Journal-Einträge anknüpfen, aber nicht vorsortieren.
– Alltagssprache, per Du, gern mal überraschend oder leicht verspielt. Keine Fachbegriffe, keine Methodennamen.
– Werkzeuge (mischen, nicht abarbeiten): Skalierung (Zahl 1–10, was einen Punkt mehr gebracht hätte), Ausnahme
  (wann war es leichter), kleine Wunderfrage, Werte (wofür hat sich Mühe gelohnt), Selbstmitgefühl (was würde ein
  Freund sagen), Körper, Beziehungen, Perspektivwechsel (ein Freund, sein 80-jähriges Ich, das Kind von damals, ein
  Beobachter), Mut und Angst, Vermeiden, Energie und Aufmerksamkeit, Entscheidungen, kleine Siege, Selbstbild
  (was er heute über sich gelernt oder sich bewiesen hat). Dankbarkeit nur selten und nie direkt.
– Keine Ratschläge, keine Deutungen ins Blaue, kein Lob, kein Pathos, keine Ausrufezeichen.
– War etwas schwer: nicht kleinreden, nicht ins Positive drehen – dann behutsam und mit Raum fragen.

So nicht → eher so (nur der Ton – die Beispiele nicht übernehmen):
✗ „Was hat dich heute bewegt?“ → ✓ „Welche Szene von heute läuft gerade noch in deinem Kopf – wo warst du da?“
✗ „Wofür bist du heute dankbar?“ → ✓ „Was lief heute besser, als es hätte laufen müssen?“
✗ „Wie hast du dich dabei gefühlt?“ → ✓ „Was hast du direkt danach gemacht?“
✗ „Was nimmst du aus dem Tag mit?“ → ✓ „Welche Minute von heute würdest du jemandem vorspielen, der dich kennenlernen will?“
✗ „Welche Werte waren dir heute wichtig?“ → ✓ „Wofür hättest du heute eine Stunde Schlaf hergegeben?“
✗ „Wie kannst du achtsamer mit dir sein?“ → ✓ „Wo warst du heute streng mit dir – und hättest du das einem Freund auch so gesagt?“
✗ (nach „das Meeting hat mich genervt“) „Erzähl mir mehr darüber.“ → ✓ „Was genau – wie es lief oder wer da saß?“
✗ (nach „tut weh“) „Und was war heute sonst noch?“ → ✓ „Was genau tut weh – etwas im Körper oder etwas, das heute passiert ist?“
✗ „Was ist deine größte Erkenntnis des Tages?“ → ✓ „Was hast du heute über dich gemerkt, das dich ein bisschen überrascht hat?“

` + ZUHOEREN;

  const SYSTEM_MORGEN = `Du begleitest Florian am Morgen mit ein paar Fragen in seinen Tag – eine nach der anderen,
wie in einem guten Gespräch beim ersten Kaffee. Klingen sollst du wie ein kluger, neugieriger Freund mit
psychologischem Gespür: nicht wie ein Fragebogen, nicht wie ein Produktivitäts-Coach, nicht wie eine To-do-App.
Florian hat ADHS, mag es konkret und hasst Küchenpsychologie, Kalendersprüche, Kitsch und Selbstoptimierungs-Sprech.
Die ganze Runde soll in drei bis fünf Minuten machbar sein – kurz genug, dass sie den Morgen nicht auffrisst,
und trotzdem nie gleich.

Worum es morgens geht: ankommen (wie er aufgewacht ist, Körper, Stimmung), sich ausrichten (was heute wirklich
zählt), ehrlich auf Reibung schauen (wo es haken könnte, wovor er sich drücken könnte) und einen kleinsten ersten
Schritt finden. Blieb gestern Abend etwas offen, darf eine Frage daran anknüpfen.

Die Frage:
– Genau EINE Frage, meist ein einziger kurzer Satz, höchstens 25 Wörter. Keine Doppelfrage, keine Auswahlliste.
– In fünf Sekunden verstanden, in einer Minute beantwortbar – auch noch halb verschlafen – und trotzdem mit Tiefe.
– Konkret an diesem Morgen und diesem Tag: wie er aufgewacht ist, ein Termin, ein Mensch, eine Uhrzeit, eine
  Sache, die ansteht – nicht „der Tag insgesamt“ und keine großen Lebensziele.
– Offen (was, wie, woran, wann, wer, wo). „Warum“ fast nie. Keine Ja/Nein-Frage, nichts Suggestives.
– Kein Planungs-Verhör: keine To-do-Listen abfragen, keine Zeitpläne, keine Ziel-Formulierungen, kein „Was willst
  du heute alles schaffen“. Es geht ums Ankommen und um Ausrichtung, nicht um Organisation.
– Alltagssprache, per Du, gern mal überraschend oder leicht verspielt. Keine Fachbegriffe, keine Methodennamen.
– Werkzeuge (mischen, nicht abarbeiten): Ankommen (Schlaf, Körper, Stimmung jetzt), Skalierung (Energie 1–10, was
  einen Punkt mehr bringen würde), das Eine (was heute zählt, wenn sonst nichts klappt), Vorfreude, Reibung und
  Vermeiden (wo es haken könnte, was es leichter machen würde), kleinster erster Schritt, Wenn-dann (wenn X passiert,
  was macht er dann), Energie planen (wann er am klarsten ist), Menschen von heute, Perspektivwechsel (sein Abend-Ich,
  ein Freund), Selbstmitgefühl (was heute liegen bleiben darf), der Faden von gestern.
– Keine Ratschläge, keine Motivationssprüche, kein Lob, kein Pathos, keine Ausrufezeichen.
– Ist er müde, gereizt oder schlecht drauf: nicht wegmotivieren, sondern ernst nehmen und kleiner fragen.

So nicht → eher so (nur der Ton – die Beispiele nicht übernehmen):
✗ „Was sind deine Ziele für heute?“ → ✓ „Woran merkst du heute Abend, dass der Tag gut war – an einer Sache, nicht an zehn?“
✗ „Wie hast du geschlafen?“ → ✓ „Mit welchem Gedanken bist du heute aufgewacht – noch bevor das Handy dran war?“
✗ „Was steht heute alles an?“ → ✓ „Welcher Punkt von heute liegt dir jetzt schon ein bisschen im Magen?“
✗ „Wie motivierst du dich heute?“ → ✓ „Was ist der kleinste Schritt, mit dem die schwierige Sache heute anfangen könnte?“
✗ „Worauf freust du dich?“ → ✓ „Welche Stunde von heute würdest du gern vorspulen – und welche lieber dehnen?“
✗ (nach „müde“) „Was gibt dir heute Energie?“ → ✓ „Müde im Kopf oder im Körper – und seit wann merkst du es?“
✗ „Was willst du heute erreichen?“ → ✓ „Was würde heute schon reichen, damit du abends nicht mit dir haderst?“

` + ZUHOEREN;

  const SYSTEM_MITTAG = `Du machst mit Florian mitten am Tag einen kurzen Zwischenhalt – zwei, drei Fragen, eine nach der
anderen. Klingen sollst du wie ein kluger, neugieriger Freund mit psychologischem Gespür, der kurz anruft und
nachfragt: nicht wie ein Fragebogen, nicht wie ein Produktivitäts-Coach. Florian hat ADHS, mag es konkret und hasst
Küchenpsychologie, Kalendersprüche und Kitsch. Die Runde soll in zwei bis vier Minuten machbar sein.

Worum es mittags geht: kurz innehalten, ehrlich schauen, wo er steht (gegenüber dem, was er sich morgens vorgenommen
hat, falls das im Journal steht), was ihm gerade Energie zieht oder gibt, was sein Körper braucht – und was der
Nachmittag wirklich braucht.

Die Frage:
– Genau EINE Frage, meist ein einziger kurzer Satz, höchstens 25 Wörter. Keine Doppelfrage, keine Auswahlliste.
– In fünf Sekunden verstanden, in einer Minute beantwortbar – zwischen zwei Dingen – und trotzdem mit Tiefe.
– Konkret an diesem Tag bis jetzt und am Rest des Tages: ein Moment vom Vormittag, wo er gerade steht, was jetzt
  ansteht – nicht „der Tag insgesamt“.
– Offen (was, wie, woran, wann, wer, wo). „Warum“ fast nie. Keine Ja/Nein-Frage, nichts Suggestives.
– Kein Leistungs-Check: nicht abfragen, was er alles geschafft hat oder noch schaffen muss.
– Werkzeuge (mischen, nicht abarbeiten): Standort (1–10, was die Zahl ausmacht), Kurskorrektur (was vom Morgen noch
  gilt, was nicht mehr), ein Moment vom Vormittag, Energie und Aufmerksamkeit, Körper (Pause, Essen, Bewegung – ohne
  Belehrung), Vermeiden, das Eine für den Nachmittag, kleinster nächster Schritt, Selbstmitgefühl, Perspektivwechsel.
– Alltagssprache, per Du. Keine Ratschläge, kein Lob, kein Pathos, keine Ausrufezeichen.
– Läuft der Tag schlecht: nicht kleinreden, nicht ins Positive drehen – ernst nehmen und kleiner fragen.

So nicht → eher so (nur der Ton – die Beispiele nicht übernehmen):
✗ „Wie läuft dein Tag?“ → ✓ „Was vom Vormittag hängt dir noch nach – im Guten oder im Schlechten?“
✗ „Bist du produktiv?“ → ✓ „Wenn der Vormittag eine Zahl von 1 bis 10 war – was bräuchte der Nachmittag für einen Punkt mehr?“
✗ „Was musst du noch erledigen?“ → ✓ „Welche eine Sache würde den Nachmittag gut machen, wenn sonst nichts klappt?“
✗ „Machst du genug Pausen?“ → ✓ „Woran merkst du gerade im Körper, wie der Vormittag war?“

` + ZUHOEREN;

  const SYSTEM_FRAGE = { abend: SYSTEM_ABEND, morgen: SYSTEM_MORGEN, mittag: SYSTEM_MITTAG };

  const ZUSAMMEN_REGELN = `Schreib eine kurze, nüchterne Zusammenfassung für sein Journal:
– 2 bis 4 Sätze, per Du, wie eine knappe Notiz.
– Übernimm seine eigenen Formulierungen, gern als kurze Zitate in „…“. Nichts hinzudichten, was er nicht gesagt hat.
– Keine Deutung, kein Rat, kein Lob, kein Pathos, keine Moral am Ende.
– Was er übersprungen hat, lässt du weg.

Beginne mit der Zeile
ZUSAMMENFASSUNG: <die 2–4 Sätze>`;
  /* morgens/mittags zusätzlich eine FOKUS-Zeile: das, was er heute bzw. am Nachmittag im Blick behalten will */
  const FOKUS_ZEILE = wofuer => `
Danach die Zeile
FOKUS: <ein kurzer Satz, möglichst in seinen eigenen Worten: worauf er ${wofuer} achten oder womit er anfangen will –
nur, was er selbst so gesagt hat. Gab er nichts in der Art an: das Wort keiner>`;
  const SYSTEM_ENDE = {
    abend: "Du hast Florian heute Abend mit ein paar Fragen durch seinen Tag geführt. Die Runde ist vorbei.\n"
      + ZUSAMMEN_REGELN + META_AUFTRAG,
    morgen: "Du hast Florian heute Morgen mit ein paar Fragen in seinen Tag begleitet. Die Runde ist vorbei.\n"
      + ZUSAMMEN_REGELN + FOKUS_ZEILE("heute") + META_AUFTRAG,
    mittag: "Du hast mit Florian mitten am Tag einen kurzen Zwischenhalt gemacht. Die Runde ist vorbei.\n"
      + ZUSAMMEN_REGELN + FOKUS_ZEILE("am Nachmittag") + META_AUFTRAG,
  };

  function wannText() {
    const d = new Date();
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      + ", " + uhrzeit(Date.now()) + " Uhr";
  }
  /* Was heute im Journal steht – ohne diese Runde selbst (die steht im Verlauf); andere Runden des Tages
     gehören dazu: abends weiß die Runde so, was morgens gesagt wurde */
  async function tagesNotizen(datum, ohneId) {
    const alle = await alleEintraege();
    /* auch Notizen nach Mitternacht (bis 4 Uhr) gehören noch zu diesem Abend */
    const text = alle.filter(e => zumTag(e, datum) && String(e.id) !== ohneId)
      .sort((a, b) => a.zeit - b.zeit)
      .map(e => uhrzeit(e.zeit) + " — " + (e.art === "bild" ? "[Foto] " : e.art === "audio" ? "[Sprachnotiz] " : "")
        + (e.text || "")).join("\n");
    return text.length > 5000 ? "…" + text.slice(-5000) : text;
  }
  /* Runden zählen zu ihrem Datum (eine nachgeholte Abendrunde zu gestern); sonst auch Notizen bis 4 Uhr früh */
  const zumTag = (e, datum) => RUNDE_ID.test(String(e.id)) ? e.datum === datum
    : (e.datum === datum || (e.zeit && abendTag(e.zeit) === datum));
  /* Morgens: Was von gestern noch zählt – die Abendrunde (Kurz gesagt + Faden), sonst das Ende des Vortags */
  async function gesternText() {
    const tag = gestern();
    const alle = (await alleEintraege()).filter(e => zumTag(e, tag));
    const runde = alle.filter(e => String(e.id).startsWith("abend-")).sort((a, b) => b.zeit - a.zeit)[0];
    if (runde) {
      const zeile = k => ((runde.text || "").match(new RegExp("^" + k + ":\\s*(.+)$", "m")) || [])[1] || "";
      const kurz = zeile("Kurz gesagt"), faden = zeile("Faden für (?:morgen|heute)");
      if (kurz || faden) return { abendrunde: true, text: [kurz && "Kurz gesagt: " + kurz,
        faden && "Faden für heute (hat er gestern Abend selbst so stehen lassen): " + faden].filter(Boolean).join("\n") };
    }
    const rest = alle.filter(e => !RUNDE_ID.test(String(e.id))).sort((a, b) => a.zeit - b.zeit)
      .map(e => uhrzeit(e.zeit) + " — " + (e.text || "")).join("\n");
    return { abendrunde: !!runde, text: rest.length > 1500 ? "…" + rest.slice(-1500) : rest };
  }
  function verlaufText(z) {
    return z.runden.map((r, i) => `Frage ${i + 1}${r.art ? " (" + r.art + ")" : ""}: ${r.frage}\n`
      + "Florian: " + (r.status === "übersprungen" ? "(hat diese Frage übersprungen)" : r.a)).join("\n\n");
  }

  async function auftrag(z, zweck) {
    const n = z.runden.length + 1;
    const g = gedaechtnis();
    const zeit = zeitVon(z), info = zeitInfo(z);
    const notizen = await tagesNotizen(z.datum, eintragId(z));
    const teile = [kontextBlock(erkenntnisse().slice(0, 5)) + "Jetzt ist " + wannText() + "."];
    const stunde = new Date().getHours();
    if (z.nachgeholt)
      teile.push(`Wichtig: Es ist nicht Abend. Florian holt die Abendrunde von gestern (${wochentag(z.datum)}) nach. `
        + "Frag nach gestern, nicht nach heute – und rechne damit, dass manches schon verblasst ist: frag lieber nach "
        + "dem, was noch präsent ist, als nach Details.");
    else if (zeit === "abend" && (stunde >= 23 || stunde < 4))
      teile.push("Es ist schon spät – lieber leicht und kurz als schwer und lang.");
    if (zeit === "morgen") {
      const gs = await gesternText();
      if (gs.text) teile.push((gs.abendrunde ? "Aus seiner Abendrunde gestern:\n" : "Was gestern im Journal stand (Ende):\n")
        + gs.text + "\nDu kannst an gestern anknüpfen, wenn es passt – musst aber nicht. Der Morgen gehört heute.");
    }
    teile.push(notizen ? (z.nachgeholt ? "Was gestern im Journal steht:\n" : "Was heute schon im Journal steht:\n") + notizen
      : z.nachgeholt ? "Von gestern steht nichts im Journal – du weißt nur, was er dir in dieser Runde erzählt."
      : zeit === "morgen" ? "Heute steht noch nichts im Journal."
      : "Heute steht noch nichts im Journal – du weißt vom Tag nur, was er dir in dieser Runde erzählt.");
    const frueher = g.fragen.filter(f => !z.runden.some(r => r.frage === f) && f !== (z.aktuell || {}).frage).slice(0, 25);
    if (frueher.length) teile.push("Fragen aus früheren Runden – nicht wiederholen, auch nicht leicht umformuliert:\n"
      + frueher.map(f => "- " + f).join("\n"));
    if (g.arten.length) teile.push("Werkzeuge der letzten Runden (heute eher andere): " + g.arten.slice(0, 10).join(", "));
    if (z.runden.length) teile.push("Bisher in " + info.dat + ":\n" + verlaufText(z));

    const a = [];
    if (n === 1) {
      a.push(zweck === "andere"
        ? "Er möchte einen anderen Einstieg. Nimm eine ganz andere, ungewöhnliche Form als die abgelehnte."
        : `Das ist die erste Frage ${info.gen} – der Einstieg. Form heute: ${z.einstieg.text}. Mach daraus eine `
          + "eigene, frische Frage (nicht wörtlich übernehmen). Verankere sie in etwas, das "
          + (z.nachgeholt ? "gestern" : "heute") + " im Journal steht, falls dort etwas steht.");
      a.push("SPIEGEL beim Einstieg leer lassen.");
    } else if (z.hakNach) {
      const schon = !!z.runden[z.runden.length - 1].nachhaken;
      a.push(`Seine letzte Antwort war sehr knapp: „${antwortZitat(z.runden[z.runden.length - 1])}“. Wechsle NICHT das `
        + "Thema – frag genau dort eine Ebene tiefer, konkret und behutsam, gern mit seinem eigenen Wort (was genau, wo, "
        + "seit wann, was war kurz davor, woran merkt er es). Kein „Erzähl mehr“, keine Deutung. ART dann: Nachhaken.");
      if (schon) a.push("Du hast hier schon einmal nachgehakt und es kam wieder wenig. Letzter Versuch an dieser Stelle: "
        + "mach die Frage noch leichter zu beantworten (ein Ort, eine Uhrzeit, ein Bild, eine Zahl).");
    } else if (n >= z.plan) {
      a.push(`Das ist die letzte Frage ${info.gen} (Frage ${n} von ${z.plan}). Geh zuerst auf seine letzte Antwort ein. `
        + (zeit === "morgen" ? "Die Frage darf den Start bündeln – das Eine für heute oder ein kleinster erster Schritt – "
            + "ohne To-do-Liste, ohne Vorsatz-Zwang."
          : zeit === "mittag" ? "Die Frage darf den Nachmittag ausrichten – leicht, ohne Druck, ohne Leistungs-Check."
          : z.nachgeholt ? "Die Frage darf den gestrigen Tag rund machen oder behutsam auf heute schauen – ohne Kitsch."
          : "Die Frage darf den Abend rund machen oder behutsam auf morgen schauen – ohne Kitsch, ohne Vorsatz-Zwang."));
    } else {
      a.push(`Das ist Frage ${n} von etwa ${z.plan}. Geh auf seine letzte Antwort ein.`);
    }
    if (z.ueberraschung && z.ueberraschung.runde === n && zweck !== "andere" && !z.hakNach)
      a.push(`Für diese Frage ein überraschendes Format: ${z.ueberraschung.text}. Es soll trotzdem an seine `
        + "letzte Antwort oder an den Tag anknüpfen und Tiefe haben.");
    if (z.anker && z.anker.runde === n && zweck !== "andere" && !z.hakNach)
      a.push(z.anker.art === "frage"
        ? `In dieser Frage knüpfst du an seine „Frage für die Woche“ aus dem letzten Wochenspiegel an: „${z.anker.text.replace(/[.\s]+$/, "")}“. `
          + "Nicht wörtlich wiederholen – dock sie an etwas Konkretes von heute an. ART dann: Frage der Woche."
        : `In dieser Frage knüpfst du an eine Vermutung aus seinem letzten Wochenspiegel an: „${z.anker.text.replace(/[.\s]+$/, "")}“. `
          + "Ziel: sie an einer konkreten Situation von heute prüfen, schärfen oder widerlegen – ergebnisoffen. "
          + "Nenn die Vermutung nicht und frag nicht suggestiv; frag nach dem, was heute tatsächlich war und woran "
          + "man es hätte sehen können. Passt sie überhaupt nicht zum heute Erzählten, frag normal weiter. "
          + "ART dann: Wochenspiegel prüfen.");
    if (zweck === "andere" && z.abgelehnt.length)
      a.push("Diese Frage wollte er gerade nicht beantworten – stell eine ganz andere, mit anderem Werkzeug und "
        + "anderem Blickwinkel:\n" + z.abgelehnt.map(f => "- " + f).join("\n"));
    teile.push("AUFTRAG:\n" + a.join("\n"));
    return teile.join("\n\n");
  }

  function leseFrage(text) {
    /* [ \t] statt \s: eine leere „SPIEGEL:“-Zeile darf nicht die nächste Zeile schlucken */
    const zeile = k => ((text.match(new RegExp("^[ \\t*_]*" + k + "[*_]*[ \\t]*:[ \\t*_]*(.*)$", "im")) || [])[1] || "").trim();
    const ohneHuelle = s => { s = s.replace(/\*\*/g, "").trim(); const m = s.match(/^["„“»](.*)["“”«]$/s); return (m ? m[1] : s).trim(); };
    let frage = zeile("FRAGE"), spiegel = zeile("SPIEGEL");
    const art = zeile("ART").replace(/[.*_]+$/, "");
    if (!frage) {
      const zeilen = text.split("\n").map(s => s.trim()).filter(s => s && !/^(SPIEGEL|ART)\s*:/i.test(s));
      frage = [...zeilen].reverse().find(s => /\?["“”«]?$/.test(s)) || zeilen[0] || "";
    }
    if (/^[(<]?\s*(leer|-|–|—|keiner?|nichts)\s*[)>]?\.?$/i.test(spiegel)) spiegel = "";
    return { frage: ohneHuelle(frage), spiegel: ohneHuelle(spiegel), art };
  }

  /* ---------- Ablauf ---------- */
  function planen(b, sp, zeit) {
    const g = gedaechtnis();
    const r = Math.random();
    /* morgens 2–4, mittags 2–3, abends 3–5 Fragen (spät nachts 3) */
    let plan = zeit === "morgen" ? (r < 0.3 ? 2 : r < 0.8 ? 3 : 4)
             : zeit === "mittag" ? (r < 0.5 ? 2 : 3)
             : (r < 0.25 ? 3 : r < 0.7 ? 4 : 5);
    const stunde = new Date().getHours();
    if (zeit === "abend" && (stunde >= 23 || stunde < 4)) plan = 3;
    const alleFormen = ((b && b.einstiegsformen) || []).filter(f => (f.zeit || "abend") === zeit);
    const formen = alleFormen.length ? alleFormen : [{ id: "moment", text: zeit === "abend"
      ? "ein einziger konkreter Moment des Tages" : "wie er gerade in diesem Moment da ist – Kopf, Körper, Stimmung" }];
    const frei = formen.filter(f => !g.einstiege.includes(f.id));
    const einstieg = zufall(frei.length ? frei : formen);
    let ueberraschung = null;
    const ueb = (b && b.ueberraschungen) || [];
    /* Überraschungsformat abends oft, morgens selten, mittags nie – und nie als letzte Frage einer kurzen Runde */
    const chance = zeit === "abend" ? (plan >= 4 ? 0.55 : 0.3) : zeit === "morgen" && plan >= 3 ? 0.25 : 0;
    if (ueb.length && Math.random() < chance) {
      const freiU = ueb.filter(u => !g.ueberraschungen.slice(0, 3).includes(u));
      ueberraschung = { runde: 2 + Math.floor(Math.random() * Math.max(1, plan - 2)), text: zufall(freiU.length ? freiU : ueb) };
    }
    /* Anker: an etwa jedem zweiten Abend greift eine Frage den letzten Wochenspiegel auf */
    let anker = null;
    const kand = sp ? [...sp.vermutungen.map(text => ({ art: "vermutung", text })),
                       ...(sp.frage ? [{ art: "frage", text: sp.frage }] : [])] : [];
    if (kand.length && Math.random() < (zeit === "abend" ? 0.5 : 0.3)) {
      const frisch = kand.filter(k => !g.anker.slice(0, 2).includes(k.text));
      const k = zufall(frisch.length ? frisch : kand);
      const moeglich = [];
      for (let i = 2; i <= plan; i++) if (!ueberraschung || ueberraschung.runde !== i) moeglich.push(i);
      if (moeglich.length) anker = { ...k, runde: zufall(moeglich), datum: sp.datum };
    }
    return { plan, einstieg, ueberraschung, anker };
  }

  /* opt.nachholen: morgens/mittags die Abendrunde von gestern nachholen (datiert auf gestern) */
  async function starten(opt) {
    if (wartet) return;
    if (autoLesen) vorleseFreigabe();
    const nachgeholt = !!(opt && opt.nachholen);
    const zeit = nachgeholt ? "abend" : tageszeit();
    const b = await bank();
    const { plan, einstieg, ueberraschung, anker } = planen(b, await letzterSpiegel(), zeit);
    const z = { v: 1, start: Date.now(), zeit, datum: nachgeholt ? gestern() : abendTag(), nachgeholt, plan, einstieg,
                ueberraschung, anker, runden: [], aktuell: null, abgelehnt: [], phase: "warte", wartetAuf: "frage",
                zweck: "neu", zusammenfassung: "", faden: "" };
    sichere(z);
    merke("einstiege", einstieg.id, 10);
    if (ueberraschung) merke("ueberraschungen", ueberraschung.text, 6);
    if (anker) merke("anker", anker.text, 4);
    localStorage.removeItem(ENTWURF_A);
    $("abendAntwort").value = "";
    await frageHolen(z, "neu");
  }

  /* Nächste (oder andere) Frage holen: KI, sonst Sammlung */
  async function frageHolen(z, zweck) {
    z.phase = "warte"; z.wartetAuf = "frage"; z.zweck = zweck;
    z.hakNach = zweck !== "andere" && nachhakenFaellig(z);
    sichere(z); zeichne(z);
    if (!kiBasis() || z.offline) return frageSetzen(z, await bankFrage(z), z.offline ? "" : "nicht verbunden");
    wartet = true;
    const info = { art: "abend", zweck, runde: z.start, n: z.runden.length + 1 };
    const r = await frageKIgemerkt(OFFEN_A, info, SYSTEM_FRAGE[zeitVon(z)], await auftrag(z, zweck));
    wartet = false;
    await nimm(r, info);
  }

  async function nimm(r, info) {
    if (!r || r.ueberholt) return;
    const z = lade();
    if (!z || z.start !== info.runde) return;
    if (info.zweck === "ende") return endeUebernehmen(z, r);
    if (z.phase !== "warte" || z.runden.length + 1 !== info.n) return;   /* schon anders weitergegangen */
    if (r.fehler) {
      /* Bridge weg: für den Rest der Runde gleich aus der Sammlung, statt jedes Mal zu warten */
      if (r.abgerissen || /erreichbar|offline|verbunden/i.test(r.fehler)) z.offline = true;
      return frageSetzen(z, await bankFrage(z), r.fehler);
    }
    const f = leseFrage(r.text);
    if (!f.frage || f.frage.length < 8) return frageSetzen(z, await bankFrage(z), "Die Antwort war leer.");
    frageSetzen(z, { ...f, quelle: "ki" }, "");
  }

  function frageSetzen(z, f, grund) {
    if (z.runden.length === 0) f.spiegel = "";
    if (z.hakNach) f.nachhaken = true;
    z.aktuell = f; z.phase = "frage";
    sichere(z);
    merke("fragen", f.frage, 40);
    if (f.art) merke("arten", f.art, 15);
    if (f.bankId) merke("bank", f.bankId, 30);
    zeichne(z);
    $("abendHinweis").textContent = grund
      ? (grund === "nicht verbunden" ? "Ohne Verbindung – die Frage kommt aus der eigenen Sammlung."
         : "Frage aus der eigenen Sammlung – " + grund.replace(/\s*[–-]\s*(bitte )?(nochmal|neu).*$/i, "").replace(/\.$/, "") + ".")
      : "";
    if (autoLesen) vorlesenStarten(frageVorlese(z), $("abendLesen"));
  }
  const frageVorlese = z => z.aktuell ? ((z.aktuell.spiegel ? z.aktuell.spiegel + " " : "") + z.aktuell.frage) : "";

  async function weiter(status) {
    const z = lade();
    if (!z || z.phase !== "frage" || !z.aktuell || wartet) return;
    const a = $("abendAntwort").value.trim();
    if (status === "beantwortet" && a.length < 2) {
      $("abendHinweis").textContent = "Erst antworten – oder „Überspringen“.";
      $("abendAntwort").focus();
      return;
    }
    vorleseStopp();
    if (autoLesen) vorleseFreigabe();      /* iOS: Ton für die nächste Frage im Tipp freischalten */
    z.runden.push({ ...z.aktuell, a: status === "beantwortet" ? a : "", status });
    z.aktuell = null; z.abgelehnt = [];
    sichere(z);
    $("abendAntwort").value = ""; localStorage.removeItem(ENTWURF_A);
    /* Nachhaken soll keine geplante Frage auffressen: Runde um eins verlängern (höchstens zweimal, nicht spät
       nachts, nicht nach der letzten Frage) – Überraschung und Wochenspiegel-Anker rücken mit */
    const stunde = new Date().getHours();
    if (z.runden.length < z.plan && nachhakenFaellig(z) && (z.extra || 0) < 2 && !(stunde >= 23 || stunde < 4)) {
      const naechste = z.runden.length + 1;
      z.plan++; z.extra = (z.extra || 0) + 1;
      if (z.ueberraschung && z.ueberraschung.runde >= naechste) z.ueberraschung.runde++;
      if (z.anker && z.anker.runde >= naechste) z.anker.runde++;
    }
    sichere(z);
    await eintragSichern(z);
    if (z.runden.length >= z.plan) return abschliessen(z);
    await frageHolen(z, "neu");
  }

  async function andere() {
    const z = lade();
    if (!z || z.phase !== "frage" || !z.aktuell || wartet) return;
    vorleseStopp();
    if (autoLesen) vorleseFreigabe();
    z.abgelehnt.push(z.aktuell.frage);
    if (z.aktuell.bankId) merke("bank", z.aktuell.bankId, 30);
    await frageHolen(z, "andere");
  }

  async function fertig() {
    const z = lade();
    if (!z) return;
    if (z.phase === "warte") {
      if (z.wartetAuf === "ende") return;
      localStorage.removeItem(OFFEN_A);    /* laufende Frage-Anfrage verwerfen */
      wartet = false;
    }
    if (wartet) return;
    vorleseStopp();
    const a = $("abendAntwort").value.trim();
    if (z.phase === "frage" && z.aktuell && a.length >= 2) {
      z.runden.push({ ...z.aktuell, a, status: "beantwortet" });
      z.aktuell = null;
      $("abendAntwort").value = ""; localStorage.removeItem(ENTWURF_A);
    }
    if (!z.runden.some(r => r.status === "beantwortet")) {
      if (!confirm("Ohne eine Antwort beenden? Dann wird nichts gespeichert.")) return;
      localStorage.removeItem(ZUSTAND); localStorage.removeItem(OFFEN_A);
      return zeichne(null);
    }
    sichere(z);
    await eintragSichern(z);
    abschliessen(z);
  }

  /* Ende: kurze Zusammenfassung + Faden für morgen (KI), sonst nur speichern */
  async function abschliessen(z) {
    z.phase = "warte"; z.wartetAuf = "ende"; z.aktuell = null;
    sichere(z); zeichne(z);
    if (!kiBasis() || z.offline) return endeUebernehmen(z, { fehler: "ohne Verbindung" });
    wartet = true;
    const info = { art: "abend", zweck: "ende", runde: z.start };
    const notizen = await tagesNotizen(z.datum, eintragId(z));
    const r = await frageKIgemerkt(OFFEN_A, info, SYSTEM_ENDE[zeitVon(z)],
      kontextBlock(erkenntnisse().slice(0, 5))
      + (notizen ? (z.nachgeholt ? "Was gestern sonst im Journal steht:\n" : "Was heute sonst im Journal steht:\n")
        + notizen + "\n\n" : "")
      + (z.nachgeholt ? `Die Abendrunde zu gestern (${wochentag(z.datum)}), heute nachgeholt – ${wannText()}:\n\n`
         : "Die " + zeitInfo(z).name + " von " + wannText() + ":\n\n") + verlaufText(z));
    wartet = false;
    await nimm(r, info);
  }

  async function endeUebernehmen(z, r) {
    if (!r.fehler && r.text) {
      const faden = ((r.text.match(/^\s*FADEN:\s*(.+)$/im) || [])[1] || "").trim();
      const fokus = ((r.text.match(/^[\s*_]*FOKUS[*_]*\s*:\s*(.+)$/im) || [])[1] || "").replace(/\*\*/g, "").trim();
      /* FOKUS vorher heraus – sonst landete die Zeile in der Zusammenfassung oder im Profil */
      const { text } = verarbeiteAntwort(r.text.replace(/^[\s*_]*FOKUS[*_]*\s*:.*$/im, ""));   /* pflegt Profil + offene Fäden mit */
      z.zusammenfassung = text.replace(/^[\s*_]*ZUSAMMENFASSUNG[*_]*\s*:\s*/im, "").trim();
      const merk = zeitVon(z) === "abend" ? faden : fokus;
      z.faden = /^keiner\b/i.test(merk) ? "" : merk;
    }
    z.phase = "ende";
    sichere(z);
    merkeTag(z.datum, zeitVon(z));
    await eintragSichern(z);
    zeichne(z);
    if (typeof zeigeFaeden === "function") zeigeFaeden();
  }

  /* ---------- Ein Journal-Eintrag pro Runde, der mitwächst ---------- */
  function eintragText(z) {
    const tag = new Date(z.datum ? z.datum + "T12:00" : z.start).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });
    const teile = [zeitInfo(z).emoji + " " + zeitInfo(z).name + " · " + tag + (z.nachgeholt ? " (am nächsten Tag nachgeholt)" : "")];
    if (z.zusammenfassung) teile.push("Kurz gesagt: " + z.zusammenfassung);
    z.runden.forEach((r, i) => teile.push((i + 1) + ". " + r.frage + "\n→ "
      + (r.status === "übersprungen" ? "(übersprungen)" : r.a)));
    if (z.faden) teile.push(fadenName(z) + ": " + z.faden);
    return teile.join("\n\n");
  }
  async function eintragSichern(z) {
    if (!z.runden.some(r => r.status === "beantwortet")) return;
    try {
      await speichern({ id: eintragId(z), datum: z.datum, zeit: z.start, art: "text", text: eintragText(z) });
      if (typeof zeigeHeute === "function") zeigeHeute();
      if (typeof zeigeFrueher === "function") zeigeFrueher();
    } catch {
      $("abendHinweis").textContent = "Konnte nicht ins Journal speichern – die Runde bleibt hier erhalten.";
    }
  }

  /* ---------- Anzeige ---------- */
  const esc = s => String(s ?? "").replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));

  function zeichne(z) {
    clearInterval(warteUhr); warteUhr = null;
    const leer = !z, ende = z && z.phase === "ende";
    $("abendLeer").hidden = !leer;
    $("abendLauf").hidden = leer || ende;
    $("abendEnde").hidden = !ende;
    if (leer) {
      const zeit = tageszeit(), info = ZEITEN[zeit];
      const heuteSchon = gedaechtnis().letzteJe[zeit] === abendTag();
      $("abendBtn").textContent = heuteSchon ? info.emoji + " Noch eine Runde" : info.knopf;
      $("abendLeerHinweis").textContent = heuteSchon
        ? info.name + " heute schon gemacht ✓ – steht unten unter „" + (abendTag() === heute() ? "Heute" : "Frühere Tage") + "“."
        : info.hinweis;
      nachholenPruefen();
      const wf = spiegelCache && spiegelCache.frage;
      $("abendWoche").hidden = !wf;
      if (wf) $("abendWoche").innerHTML = "<b>Frage der Woche</b> " + esc(wf);
      return;
    }
    if (ende) {
      $("abendZusammen").innerHTML =
        (z.zusammenfassung ? "<h3>Kurz gesagt</h3><p>" + esc(z.zusammenfassung).replace(/\n+/g, "</p><p>") + "</p>" : "")
        + (z.faden ? "<h3>" + esc(fadenName(z)) + "</h3><p>" + esc(z.faden) + "</p>" : "")
        + `<p class="ok" style="font-size:13px">✓ ${(n => n === 1 ? "1 Antwort" : n + " Antworten")(z.runden.filter(r => r.status === "beantwortet").length)} im Journal gespeichert (unter „${z.datum === heute() ? "Heute" : "Frühere Tage"}“).</p>`;
      $("abendEndeLesen").hidden = !z.zusammenfassung;
      return;
    }
    /* Kopf: Frage n · Art   ● ● ○ ○ */
    const n = z.runden.length + (z.wartetAuf === "ende" ? 0 : 1);
    const kurzArt = z.aktuell && z.aktuell.art ? z.aktuell.art.split(/[,;(]/)[0].trim().slice(0, 26) : "";
    const art = z.phase === "frage" && kurzArt ? " · " + kurzArt : "";
    $("abendStand").textContent = z.wartetAuf === "ende" && z.phase === "warte" ? zeitInfo(z).name + " · Ausklang"
      : (z.nachgeholt ? "Gestern · " : "") + "Frage " + n + art;
    const gesamt = Math.max(z.plan, n);
    $("abendPunkte").innerHTML = Array.from({ length: gesamt }, (_, i) =>
      `<i class="${i < z.runden.length ? "fertig" : i === z.runden.length && z.wartetAuf !== "ende" ? "jetzt" : ""}"></i>`).join("");
    /* Bisherige Fragen und Antworten, eingeklappt */
    const bisher = $("abendBisher");
    bisher.hidden = !z.runden.length;
    bisher.querySelector("summary").textContent = "Bisher (" + z.runden.length + ")";
    $("abendBisherListe").innerHTML = z.runden.map((r, i) =>
      `<div class="abend-bisher"><div>${i + 1}. ${esc(r.frage)}</div><em>${r.status === "übersprungen" ? "übersprungen" : esc(r.a)}</em></div>`).join("");

    const warten = z.phase === "warte";
    $("abendEingabe").hidden = warten;
    $("abendLesen").hidden = warten;
    if (warten) {
      $("abendSpiegel").textContent = ""; $("abendSpiegel").hidden = true;
      const was = z.wartetAuf === "ende" ? "Fasst zusammen" : z.runden.length ? "Hört zu" : "Sucht einen Einstieg";
      $("abendFrage").innerHTML = `<span class="abend-warte"><span class="abend-atem" aria-hidden="true"></span>`
        + `<span id="abendWarteText">${was} …</span></span>`
        + `<button class="btn abend-nichtwarten" id="abendNichtWarten" hidden>Nicht warten – ${z.wartetAuf === "ende" ? "ohne Zusammenfassung speichern" : "Frage aus der Sammlung"}</button>`;
      $("abendNichtWarten").addEventListener("click", nichtWarten);
      const t0 = Date.now();
      warteUhr = setInterval(() => {
        const s = Math.round((Date.now() - t0) / 1000);
        const el = $("abendWarteText");
        if (el) el.textContent = was + " … " + s + " s";
        if (s >= NICHT_WARTEN_AB && $("abendNichtWarten")) $("abendNichtWarten").hidden = false;
      }, 1000);
      return;
    }
    $("abendSpiegel").textContent = z.aktuell.spiegel || "";
    $("abendSpiegel").hidden = !z.aktuell.spiegel;
    $("abendFrage").textContent = z.aktuell.frage;
    $("abendWeiter").textContent = z.runden.length + 1 >= z.plan ? "Abschließen" : "Weiter";
    if (!$("abendAntwort").value) $("abendAntwort").value = store.get(ENTWURF_A, "");
  }

  /* Antwort braucht zu lange: die laufende Anfrage gilt als überholt (ihre Antwort wird ignoriert) */
  async function nichtWarten() {
    const z = lade();
    if (!z || z.phase !== "warte") return;
    localStorage.removeItem(OFFEN_A);
    wartet = false;
    if (z.wartetAuf === "ende") return endeUebernehmen(z, { fehler: "übersprungen" });
    frageSetzen(z, await bankFrage(z), "");
  }

  /* Beim Öffnen: lief noch eine Anfrage? Dann abholen – oder neu stellen, falls sie nie rausging */
  async function weitermachen() {
    const z = lade();
    zeichne(z);
    if (!z || z.phase !== "warte" || wartet) return;
    const o = store.getJSON(OFFEN_A, null);
    if (o && o.rid && o.runde === z.start) {
      wartet = true;
      const r = await offeneAnfrage(OFFEN_A);
      wartet = false;
      if (r) return nimm(r, r.info);
      return;
    }
    if (z.wartetAuf === "ende") return abschliessen(z);
    return frageHolen(z, z.zweck || "neu");
  }

  /* Zählt ein Abendrunden-Eintrag für diesen Abend? Normal: datum = Abend. Nachgeholt: datum = Vortag, Zeit am
     nächsten Morgen. Version 47 nach Mitternacht: datum = neuer Kalendertag, gehört aber zum Abend davor. */
  const abendZaehlt = (e, tag) => (e.datum === tag && abendTag(e.zeit || 0) >= tag)
    || (abendTag(e.zeit || 0) === tag && e.datum > tag);
  async function schonGemacht(zeit, tag) {
    /* Version 47 merkte nach Mitternacht den neuen Kalendertag – so eine Runde zählt für den Vorabend */
    const z = store.getJSON(ZUSTAND, null);
    const altNachMitternacht = zeit === "abend" && z && z.datum === tag && z.start && abendTag(z.start) < tag;
    if (gedaechtnis().letzteJe[zeit] === tag && !altNachMitternacht) return true;
    try {
      return (await alleEintraege()).some(e => String(e.id).startsWith(zeit + "-")
        && (zeit === "abend" ? abendZaehlt(e, tag) : e.datum === tag));
    } catch { return false; }
  }
  const heuteSchonGemacht = () => schonGemacht(tageszeit(), abendTag());

  /* Morgens und mittags: Gab es gestern keine Abendrunde, lässt sie sich nachholen */
  async function nachholenPruefen() {
    const knopf = $("abendNachholen");
    if (!knopf) return;
    const zeigen = tageszeit() !== "abend" && !(await schonGemacht("abend", gestern()));
    knopf.hidden = !zeigen;
  }

  function zeigeAuto() { $("abendAuto").textContent = autoLesen ? "🔈 Auto: an" : "🔈 Auto: aus"; }

  async function init() {
    if (!$("abendKarte")) return;
    $("abendBtn").addEventListener("click", () => starten());
    if ($("abendNachholen")) $("abendNachholen").addEventListener("click", () => starten({ nachholen: true }));
    $("abendWeiter").addEventListener("click", () => weiter("beantwortet"));
    $("abendSkip").addEventListener("click", () => weiter("übersprungen"));
    $("abendAndere").addEventListener("click", andere);
    $("abendFertig").addEventListener("click", fertig);
    $("abendSchliessen").addEventListener("click", () => {
      vorleseStopp();
      localStorage.removeItem(ZUSTAND); localStorage.removeItem(OFFEN_A);
      zeichne(null);
    });
    $("abendLesen").addEventListener("click", () => vorlesen(frageVorlese(lade() || {}), $("abendLesen")));
    $("abendEndeLesen").addEventListener("click", () => {
      const z = lade();
      vorlesen(z ? z.zusammenfassung + (z.faden ? " " + fadenName(z) + ": " + z.faden : "") : "", $("abendEndeLesen"));
    });
    letzterSpiegel().then(() => { if (!lade()) zeichne(null); });
    window.addEventListener("atemfunk-sync", () => letzterSpiegel().then(() => { if (!lade()) zeichne(null); }));
    zeigeAuto();
    $("abendAuto").addEventListener("click", () => {
      autoLesen = !autoLesen; store.set(AUTO_A, autoLesen ? "on" : "off"); zeigeAuto();
      if (autoLesen) vorleseFreigabe();
    });
    diktat($("abendAntwort"), $("abendDiktat"));
    $("abendDiktat").addEventListener("pointerdown", () => vorleseStopp());   /* nicht die eigene Stimme mitschreiben */
    $("abendAntwort").addEventListener("input", () => store.set(ENTWURF_A, $("abendAntwort").value));
    $("abendAntwort").addEventListener("keydown", e => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); weiter("beantwortet"); }
    });
    window.addEventListener("pagehide", () => {
      const v = $("abendAntwort").value;
      if (v && lade()) store.set(ENTWURF_A, v); else localStorage.removeItem(ENTWURF_A);
    });
    window.addEventListener("pageshow", ev => { if (ev.persisted) weitermachen(); });

    /* Aufruf aus der 19-Uhr-Erinnerung: journal.html?abend=1 (oder ?runde=1) startet gleich die Runde der
       jetzigen Tageszeit, wenn dafür heute noch nichts lief */
    const p = new URLSearchParams(location.search);
    if (p.has("abend") || p.has("runde")) {
      p.delete("abend"); p.delete("runde");
      history.replaceState(null, "", "journal.html" + (p.toString() ? "?" + p : ""));
      $("abendKarte").scrollIntoView({ block: "start" });
      /* eine liegengebliebene Runde vom Vorabend (Antworten stehen schon im Journal) zählt nicht als „heute“ */
      const z = lade();
      if ((!z || abendTag(z.start) !== abendTag() || zeitVon(z) !== tageszeit()) && !(await heuteSchonGemacht()))
        return starten();
    }
    weitermachen();
  }
  /* journal.html meldet einen frischen Wochenspiegel → „Frage der Woche“ sofort zeigen */
  window.abendSpiegelNeu = () => letzterSpiegel().then(() => { if (!lade()) zeichne(null); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
