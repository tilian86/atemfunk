"""Texte für „Körper-Check“ (5, 10 Min) — zurück in den Körper finden und nachschauen: Wie geht es mir
eigentlich gerade? Entwurf: checkin_entwurf.md.

Florian 05.11.2026: „Beginn mit Atem → entspannter Körperscan (Anspannung, Müdigkeit, Unruhe, Wärme …
ohne zu bewerten) → wieder Atem → kurzes Fazit ‚wie geht es mir jetzt?‘“. Eine Bestandsaufnahme, kein
Arbeiten an einem Gefühl — das macht „Gefühl im Körper spüren“ (gefuehl_texte.py, RAIN).
  1. Ankommen  — sitzen, stehen, liegen, egal; die eine Frage
  2. Atem      — 4 · 6 im Takt (Kugel läuft mit)
  3. Körper    — vom Kopf zu den Füßen: was ist da? (10: dazu Energie, Stimmung, was sich gut anfühlt)
  4. Atem      — noch einmal 4 · 6
  5. Fazit     — in ein, zwei Worten; was brauche ich gerade?

Einträge wie in programm_bauen.py.
"""

ZUEGE = {
    "r_ein": "Ein.",
    "r_aus": "Und langsam aus.",
}

S = {
    # Ankommen
    "c1": "Schön, dass du kurz innehältst. Bleib so sitzen, stehen oder liegen, wie du gerade bist. "
          "Schließ die Augen, oder lass den Blick irgendwo ruhen.",
    "c2": "In den nächsten Minuten geht es nur um eine Frage: Wie geht es mir eigentlich gerade? "
          "Du musst nichts verändern. Nur nachschauen.",
    "c2b": "Es gibt dabei kein Richtig und kein Falsch. Gut, schlecht, irgendwie: Alles zählt als Antwort.",
    # Atem
    "c3": "Zuerst ein paar ruhige Atemzüge. Vier ein, sechs aus. Ich zähle mit.",
    "b2w": "Allein weiter, im gleichen Takt.",            # wie in Täglich, liegt schon im Cache
    "c4": "Lass den Atem jetzt wieder von allein gehen. Und geh mit der Aufmerksamkeit langsam durch den Körper, "
          "vom Kopf bis zu den Füßen.",
    # Körper (5)
    "c5": "Das Gesicht. Die Stirn, die Augen, der Kiefer. Ist da Anspannung? Oder ist es weich?",
    "c7": "Die Brust und der Bauch. Eng oder weit, ruhig oder unruhig? Vielleicht ein Flattern, ein Druck, Wärme, Hunger.",
    "c9": "Der Rücken, das Becken, die Beine, die Füße. Schwer oder leicht, müde oder unruhig?",
    # Körper (beide)
    "c6": "Der Nacken und die Schultern. Sind sie hochgezogen, fest, müde? Oder ganz entspannt?",
    "c8": "Die Arme und die Hände. Warm oder kühl, ruhig oder kribbelig.",
    # Körper (10)
    "c5a": "Das Gesicht. Die Stirn und die Augen. Ist da Anspannung, Müdigkeit, ein Druck? Oder ist es weich?",
    "c5b": "Der Kiefer und der Mund. Beißt du vielleicht die Zähne zusammen? Du musst nichts ändern. Nur bemerken.",
    "c7a": "Die Brust. Fühlt sie sich eng an oder weit? Wie geht der Atem dort, flach oder tief?",
    "c7b": "Der Bauch. Fest oder weich, ruhig oder unruhig? Vielleicht ein Flattern, ein Druck, Wärme, Hunger.",
    "c9a": "Der Rücken und das Becken. Wo trägst du gerade Gewicht? Zieht oder drückt etwas?",
    "c9b": "Die Beine und die Füße. Schwer oder leicht, müde oder unruhig? Wollen sie still sein oder sich bewegen?",
    "c15": "Und wie viel Energie ist gerade da? Eher wach oder eher erschöpft? Eher ruhig oder eher getrieben?",
    "c16": "Und die Stimmung? Wie ein Wetterbericht von innen: sonnig, bewölkt, neblig, stürmisch. Oder irgendwas dazwischen.",
    "c17": "Vielleicht ist da auch etwas, das sich gut anfühlt. Eine Stelle, die warm ist, ruhig oder entspannt. "
           "Auch das gehört zur Bestandsaufnahme.",
    # Ohne Bewerten
    "c10": "Was immer du findest, du musst es nicht bewerten und nicht lösen. Wenn es hilft, gib ihm kurz ein Wort: "
           "angespannt, müde, unruhig, ruhig. Und lass es so sein.",
    # Atem 2
    "c11": "Und jetzt noch einmal zurück zum Atem. Ein paar ruhige Züge, vier ein, sechs aus.",
    # Fazit
    "c12": "Und jetzt frag dich: Wie geht es mir gerade? Fass es in ein, zwei Worten zusammen. "
           "Zum Beispiel: müde, aber ruhig. Oder: angespannt, aber da.",
    "c13": "Vielleicht merkst du dabei, was du gerade brauchst. Ein Glas Wasser, eine kurze Pause, frische Luft. "
           "Oder einfach weitermachen.",
    "c14": "Danke, dass du kurz nachgeschaut hast. Beweg dich ein wenig, und öffne die Augen.",
}

D = "dehnbar"

TEXTE = {
    5: [
        ("teil", "ankommen"), ("still", 2),
        ("sag", "c1"), ("still", 3),
        ("sag", "c2"), ("still", 4),
        ("sag", "c3"), ("still", 1),
        ("teil", "takt"), ("takt", 2, 2), ("sag", "b2w"), ("takt", 0, 2),
        ("teil", "takt_ende"),
        ("sag", "c4"), ("still", 4),
        ("teil", "koerper"),
        ("sag", "c5"), ("still", 9, D),
        ("sag", "c6"), ("still", 9, D),
        ("sag", "c7"), ("still", 10, D),
        ("sag", "c8"), ("still", 8, D),
        ("sag", "c9"), ("still", 9, D),
        ("sag", "c10"), ("still", 10, D),
        ("sag", "c11"), ("still", 1),
        ("teil", "takt2"), ("takt", 1, 3),
        ("teil", "takt2_ende"),
        ("sag", "c12"), ("still", 12, D),
        ("sag", "c13"), ("still", 8, D),
        ("sag", "c14"),
    ],
    10: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "c1"), ("still", 4),
        ("sag", "c2"), ("still", 4),
        ("sag", "c2b"), ("still", 4),
        ("sag", "c3"), ("still", 1),
        ("teil", "takt"), ("takt", 3, 3), ("sag", "b2w"), ("takt", 0, 3),
        ("teil", "takt_ende"),
        ("sag", "c4"), ("still", 5),
        ("teil", "koerper"),
        ("sag", "c5a"), ("still", 12, D),
        ("sag", "c5b"), ("still", 10, D),
        ("sag", "c6"), ("still", 12, D),
        ("sag", "c7a"), ("still", 11, D),
        ("sag", "c7b"), ("still", 12, D),
        ("sag", "c8"), ("still", 10, D),
        ("sag", "c9a"), ("still", 11, D),
        ("sag", "c9b"), ("still", 12, D),
        ("sag", "c15"), ("still", 12, D),
        ("sag", "c16"), ("still", 14, D),
        ("sag", "c17"), ("still", 12, D),
        ("sag", "c10"), ("still", 12, D),
        ("sag", "c11"), ("still", 1),
        ("teil", "takt2"), ("takt", 2, 5),
        ("teil", "takt2_ende"),
        ("sag", "c12"), ("still", 16, D),
        ("sag", "c13"), ("still", 10, D),
        ("sag", "c14"),
    ],
}
