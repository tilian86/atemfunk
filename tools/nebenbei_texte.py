"""Texte für „Nebenbei“ (2, 5 Min) — Achtsamkeit mit offenen Augen bei einer Alltagstätigkeit.

Florian 05.11.2026: „eine Nebenbei-Meditation, die man so neben dem Zähneputzen machen kann oder einfach so
im Alltag beim Staubsaugen“. Informelle Praxis (Kabat-Zinn, „Abspülen, um abzuspülen“ nach Thich Nhat Hanh):
nichts unterbrechen, nur die Aufmerksamkeit in die Tätigkeit legen – Stand, Hände, Bewegung, Hören, Riechen.
Mehr Sätze und kürzere Stillen als im Sitzen, weil die Aufmerksamkeit bei Bewegung schneller wegdriftet.
  2 Min: Zähneputzen, Hände waschen, Kaffee machen
  5 Min: Staubsaugen, Abspülen, Aufräumen, Wäsche
Alle vier Stimmen (seit Version 71). Einträge wie in programm_bauen.py.
"""

ZUEGE = {}

S = {
    # 2 Min
    "k1": "Mach einfach weiter mit dem, was du gerade tust. Die Augen bleiben offen. Wir machen es nur ein bisschen wacher.",
    "k2": "Spür deine Füße auf dem Boden. Wie du gerade stehst.",
    "k3": "Und jetzt die Hand, die arbeitet. Was spürt sie? Den Griff, das Gewicht, vielleicht Wasser oder Wärme.",
    "k4": "Werd ein kleines bisschen langsamer. Nicht viel. So, dass du jede Bewegung mitbekommst.",
    "k5": "Was hörst du gerade? Lass die Geräusche einfach da sein, ohne sie zu benennen.",
    "k6": "Gibt es einen Geschmack oder einen Geruch? Frisch, warm, nach Seife? Nur kurz bemerken.",
    "k7": "Wenn die Gedanken schon beim Nächsten sind: Das ist normal. Komm einfach zurück zu der Hand.",
    "k8": "Ein ruhiger Atemzug, mitten in der Bewegung. Ein, und lang aus.",
    "k9": "Das war's schon. Das kannst du bei allem machen, was du jeden Tag tust.",
    # 5 Min
    "l1": "Diese Meditation läuft neben dem Alltag. Beim Staubsaugen, Abspülen, Aufräumen. "
          "Mach einfach weiter, die Augen bleiben offen. Du musst nichts anders machen, nur ein bisschen wacher dabei sein.",
    "l2": "Spür zuerst deine Füße. Wie sie den Boden berühren, wie sich das Gewicht verlagert, wenn du dich bewegst.",
    "l3": "Merk, wie du stehst. Vielleicht sind die Schultern hochgezogen. Lass sie ein wenig sinken.",
    "l4": "Jetzt die Hände. Was halten sie? Spür den Griff. Ist er fest oder locker? Warm oder kühl? Glatt oder rau?",
    "l5": "Und die Bewegung selbst. Vor und zurück, hin und her. Es gibt einen Rhythmus darin. Lass dich von ihm tragen.",
    "l6": "Werd ein kleines bisschen langsamer, nur so viel, dass du jede Bewegung mitbekommst. Es muss nicht schneller fertig werden.",
    "l7": "Jetzt die Ohren. Das Rauschen, das Klappern, das Wasser, vielleicht ein Gerät. "
          "Hör hin, als wäre es Musik. Laut, leise, nah, fern.",
    "l8": "Und die Augen. Schau genau hin, wo du gerade arbeitest. Farben, Licht, kleine Einzelheiten, die du sonst übersiehst.",
    "l9": "Gibt es einen Geruch? Seife, Staub, frische Luft, Essen? Nur bemerken, kurz.",
    "l10": "Irgendwann ist der Kopf woanders. Bei einer Aufgabe, einem Gespräch, bei morgen. Das ist kein Fehler. "
           "Sobald du es merkst, bist du schon zurück. Komm wieder zu den Händen.",
    "l11": "Wenn du magst, ein ruhiger Atemzug mitten in der Bewegung. Ein, und lang aus. Die Arbeit geht einfach weiter.",
    "l12": "Noch einmal alles zusammen: Füße, Hände, Bewegung, Geräusche. Du bist ganz hier, bei dieser einen Sache.",
    "l13": "Das war's. Du kannst noch weitermachen, so wach wie jetzt oder ganz normal. "
           "Und beim nächsten Mal Zähneputzen oder Abspülen weißt du: Das ist auch eine Meditation.",
}

D = "dehnbar"

TEXTE = {
    2: [
        ("teil", "nebenbei"), ("still", 1),
        ("sag", "k1"), ("still", 3),
        ("sag", "k2"), ("still", 6, D),
        ("sag", "k3"), ("still", 9, D),
        ("sag", "k4"), ("still", 8, D),
        ("sag", "k5"), ("still", 9, D),
        ("sag", "k6"), ("still", 7, D),
        ("sag", "k7"), ("still", 8, D),
        ("sag", "k8"), ("still", 5, D),
        ("teil", "schluss"),
        ("sag", "k9"),
    ],
    5: [
        ("teil", "nebenbei"), ("still", 1),
        ("sag", "l1"), ("still", 4),
        ("sag", "l2"), ("still", 12, D),
        ("sag", "l3"), ("still", 10, D),
        ("sag", "l4"), ("still", 15, D),
        ("sag", "l5"), ("still", 15, D),
        ("sag", "l6"), ("still", 15, D),
        ("sag", "l7"), ("still", 18, D),
        ("sag", "l8"), ("still", 15, D),
        ("sag", "l9"), ("still", 10, D),
        ("sag", "l10"), ("still", 18, D),
        ("sag", "l11"), ("still", 10, D),
        ("sag", "l12"), ("still", 15, D),
        ("teil", "schluss"),
        ("sag", "l13"),
    ],
}
