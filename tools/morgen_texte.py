"""Texte für „Morgen“ (5, 10 Min) — den Tag begrüßen — Entwurf: morgen_entwurf.md.

Florian 05.11.2026: Aufwachen im Körper (sanft strecken erlaubt), ein paar belebende tiefere Atemzüge,
kurz spüren, eine Haltung für den Tag, Dankbarkeit ohne Kitsch, wach und klar zurück.
Im Liegen oder Sitzen, Augen anfangs gern noch zu.
  1. Ankommen    — guten Morgen, noch im Bett sein dürfen (10: Geräusche des Morgens)
  2. Wecken      — Finger, Zehen, strecken, gähnen (10: Hände warm reiben, Schultern, Nacken)
  3. Atem        — tief ein, entspannt aus, im Takt 4 · 4 (Rhythmus „wach“, Kugel läuft mit), dann frei
  4. Spüren      — wie geht es dem Körper heute
  5. Haltung     — ein Wort für den Tag (10: einen Moment des Tages damit vorstellen)
  6. Dank        — etwas, worauf du dich freust, etwas Kleines, das gut ist
  7. Schluss     — tief atmen, strecken, Augen auf

Einträge wie in programm_bauen.py.
"""

ZUEGE = {
    "w_ein": "Tief ein.",
    "w_aus": "Und entspannt aus.",
}

S = {
    # Ankommen
    "m1": "Guten Morgen. Bevor der Tag richtig losgeht, nimm dir ein paar Minuten für dich. "
          "Du kannst noch liegen bleiben oder dich aufsetzen.",
    "m2": "Die Augen dürfen noch zu sein. Spür, wie du da bist: das Gewicht des Körpers, die Wärme, "
          "vielleicht noch etwas Schwere vom Schlaf.",
    "m2b": "Hör einen Moment hin. Welche Geräusche gibt es an diesem Morgen? Vögel, Autos, Stille im Haus. Der Tag ist schon da.",
    # Wecken
    "m3": "Beweg langsam die Finger und die Zehen. Kreise die Hände und die Füße ein wenig.",
    "m4": "Und jetzt streck dich, so wie es gerade guttut. Die Arme über den Kopf, die Beine lang. "
          "Gähnen ist ausdrücklich erlaubt.",
    "m4b": "Roll die Schultern ein paar Mal nach hinten. Neig den Kopf sanft zur einen Seite, und dann zur anderen.",
    "m4c": "Reib die Handflächen aneinander, bis sie warm werden. Leg sie dann sanft auf die Augen, und spür die Wärme.",
    "m5": "Lass wieder los, und spür nach, wie sich der Körper jetzt anfühlt.",
    # Atem
    "m6": "Jetzt ein paar tiefe Atemzüge, die dich wach machen. Tief durch die Nase ein, bis in den Bauch und die Brust. "
          "Und dann entspannt aus, einfach rausfallen lassen. Ich zähle die ersten drei mit, dann atmest du allein weiter.",
    "m8": "Lass den Atem wieder von allein gehen. Spür nach: Vielleicht ist da etwas mehr Wachheit. "
          "Ein Kribbeln, Wärme, ein klarerer Kopf.",
    # Spüren
    "m9": "Wie fühlt sich dein Körper heute an? Ausgeschlafen oder müde, leicht oder schwer? "
          "Alles ist in Ordnung. Nur wahrnehmen, wie es heute ist.",
    "m9b": "Geh einmal kurz durch den Körper. Der Kopf, die Schultern, der Bauch, die Beine. "
           "Wo bist du schon wach? Wo ist noch Schlaf?",
    # Haltung
    "m10": "Wie möchtest du heute unterwegs sein? Nicht, was du alles schaffen willst, sondern wie. "
           "Vielleicht gelassen. Freundlich. Konzentriert. Such dir ein Wort aus, das heute passt.",
    "m11": "Sag dir dieses Wort innerlich einmal. Das ist deine Haltung für heute. "
           "Du kannst im Lauf des Tages immer wieder daran denken.",
    "m11b": "Stell dir einen Moment des heutigen Tages vor, in dem dir dieses Wort helfen kann. "
            "Ein Gespräch, eine Aufgabe, eine stressige Minute. Und wie es aussieht, wenn du dich dann daran erinnerst.",
    # Dank
    "m12": "Gibt es etwas, auf das du dich heute freust? Oder etwas Kleines, das gerade gut ist: "
           "das warme Bett, der erste Kaffee, ein Mensch, an den du denkst. Es muss nichts Großes sein.",
    "m12b": "Und vielleicht auch etwas an dir selbst, das du heute gut brauchen kannst. "
            "Deine Geduld, deine Neugier, deinen Humor. Nimm es mit in den Tag.",
    # Schluss
    "m13": "Nimm noch einen tiefen Atemzug. Und streck dich noch einmal.",
    "m14": "Öffne die Augen, und schau dich um. Der Tag kann kommen.",
}

D = "dehnbar"

TEXTE = {
    5: [
        ("teil", "ankommen"), ("still", 2),
        ("sag", "m1"), ("still", 3),
        ("sag", "m2"), ("still", 6),
        ("teil", "wecken"),
        ("sag", "m3"), ("still", 8),
        ("sag", "m4"), ("still", 12, D),
        ("sag", "m5"), ("still", 5),
        ("sag", "m6"), ("still", 1),
        ("teil", "wach"), ("wach", 3, 6),
        ("teil", "wach_ende"),
        ("sag", "m8"), ("still", 10, D),
        ("teil", "spueren"),
        ("sag", "m9"), ("still", 12, D),
        ("teil", "haltung"),
        ("sag", "m10"), ("still", 14, D),
        ("sag", "m11"), ("still", 10, D),
        ("teil", "dank"),
        ("sag", "m12"), ("still", 14, D),
        ("teil", "schluss"),
        ("sag", "m13"), ("still", 6),
        ("sag", "m14"),
    ],
    10: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "m1"), ("still", 4),
        ("sag", "m2"), ("still", 8),
        ("sag", "m2b"), ("still", 15, D),
        ("teil", "wecken"),
        ("sag", "m3"), ("still", 10, D),
        ("sag", "m4"), ("still", 15, D),
        ("sag", "m4b"), ("still", 14, D),
        ("sag", "m4c"), ("still", 15, D),
        ("sag", "m5"), ("still", 6),
        ("sag", "m6"), ("still", 1),
        ("teil", "wach"), ("wach", 3, 10),
        ("teil", "wach_ende"),
        ("sag", "m8"), ("still", 15, D),
        ("teil", "spueren"),
        ("sag", "m9"), ("still", 12, D),
        ("sag", "m9b"), ("still", 15, D),
        ("teil", "haltung"),
        ("sag", "m10"), ("still", 18, D),
        ("sag", "m11"), ("still", 10, D),
        ("sag", "m11b"), ("still", 20, D),
        ("teil", "dank"),
        ("sag", "m12"), ("still", 18, D),
        ("sag", "m12b"), ("still", 15, D),
        ("teil", "schluss"),
        ("sag", "m13"), ("still", 8),
        ("sag", "m14"),
    ],
}
