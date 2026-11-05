"""Texte für „Einschlafen“ (10, 20 Min) — im Liegen — Entwurf: schlafen_entwurf.md.

Florian 05.11.2026: zum Einschlafen, Atem verlangsamen, lange entspannte Körperreise, Gedanken
loslassen, zum Ende immer leiser mit längeren Stillen — und KEIN Zurückholen: kein „öffne die Augen“,
die Tonspur endet in Stille. Atemfunk-Texte brauchen keine Vorab-Freigabe.
  1. Ankommen    — hinlegen, Gewicht abgeben, der Tag ist vorbei
  2. Atem        — 4 · 6 im Takt (Kugel läuft mit), dann frei
  3. Körper      — Reise von den Füßen bis zum Kopf, schwer und warm (20: dazu Schwere und Wärme
                   wie im Autogenen Training)
  4. Gedanken    — beiseitelegen, vorbeiziehen lassen (20: Ausatemzüge rückwärts zählen)
  5. Ausklang    — immer kürzer, leiser, längere Stillen, „Gute Nacht“, dann nur noch Stille

Einträge wie in programm_bauen.py; ("sag", k, faktor) wird um faktor leiser.
"""

ZUEGE = {
    "r_ein": "Ein.",
    "r_aus": "Und langsam aus.",
}

S = {
    # Ankommen
    "a1": "Schön, dass du da bist. Leg dich so hin, wie du gleich einschlafen möchtest. "
          "Auf den Rücken oder auf die Seite, ganz wie es dir gefällt.",
    "a2": "Lass den Kopf ins Kissen sinken. Und schließ die Augen.",
    "a3": "Spür, wo der Körper aufliegt. Der Kopf, die Schultern, der Rücken, die Beine. "
          "Die Matratze trägt dich. Du musst dich jetzt nicht mehr halten.",
    "a4": "Der Tag ist vorbei. Für heute ist nichts mehr zu tun. Alles, was noch offen ist, darf bis morgen warten.",
    # Atem
    "b1": "Lass uns den Atem ein wenig verlangsamen. Vier ein, sechs aus. "
          "Ein langes Ausatmen sagt deinem Körper: Jetzt ist Zeit zum Ausruhen. Ich zähle die ersten Runden mit.",
    "b2w": "Allein weiter, im gleichen Takt.",            # wie in Täglich, liegt schon im Cache
    "b3": "Lass den Atem jetzt wieder von allein gehen. Vielleicht bleibt er langsam. "
          "Vielleicht wird das Ausatmen von selbst noch etwas länger.",
    "b4": "Mit jedem Ausatmen sinkst du ein kleines Stück tiefer in die Matratze.",
    # Körper
    "k0": "Jetzt eine langsame Reise durch den Körper, von den Füßen bis zum Kopf. "
          "Du musst nichts tun. Nur mit der Aufmerksamkeit dort sein, und loslassen, was loslassen will.",
    "k1": "Die Füße. Die Zehen, die Sohlen, die Fersen. Lass sie schwer werden.",
    "k2": "Die Knöchel und die Unterschenkel. Die Waden werden weich.",
    "k3": "Die Knie. Die Oberschenkel, groß und schwer. Die Beine liegen einfach da.",
    "k4": "Das Becken und die Hüften. Sie sinken nach unten, ganz von allein.",
    "k5": "Der Bauch. Er hebt sich beim Einatmen und senkt sich beim Ausatmen. Lass ihn ganz weich sein.",
    "k6": "Der Rücken. Der untere Rücken, die Mitte, die Stelle zwischen den Schulterblättern. Breit und schwer liegt er auf.",
    "k7": "Die Brust. Der Atem geht ruhig hinein und wieder hinaus. Das Herz schlägt, ganz ohne dein Zutun.",
    "k8": "Die Schultern. Lass sie sinken, weg von den Ohren. Vielleicht noch ein kleines Stück mehr.",
    "k9": "Die Oberarme, die Ellbogen, die Unterarme. Die Hände. Jeder einzelne Finger ist schwer und warm.",
    "k10": "Der Nacken. Er darf ganz loslassen. Der Kopf wird vom Kissen gehalten.",
    "k11": "Das Gesicht. Der Kiefer wird locker, die Zähne berühren sich nicht. Die Zunge liegt weich im Mund.",
    "k12": "Die Augen liegen schwer und ruhig. Die Stirn wird glatt und weit.",
    "k13": "Die Kopfhaut, der Hinterkopf, bis hinauf zum Scheitel.",
    "kz": "Und jetzt der ganze Körper auf einmal. Schwer. Warm. Ruhig.",
    "kz2": "Wo noch etwas festhält, darf es so bleiben. Du musst nichts erzwingen. Der Körper weiß, wie Schlafen geht.",
    # Schwere und Wärme (nur 20)
    "w1": "Sag dir jetzt innerlich, ganz langsam: Meine Arme sind schwer.",
    "w2": "Meine Beine sind schwer.",
    "w3": "Meine Arme und Beine sind angenehm warm.",
    "w4": "Der Atem geht ganz von allein. Ruhig und gleichmäßig.",
    # Gedanken
    "g1": "Vielleicht tauchen Gedanken auf. Vom Tag, der war, oder von morgen. Das ist ganz normal.",
    "g2": "Du musst heute nichts mehr lösen. Was morgen dran ist, ist morgen auch noch da. "
          "Leg es für die Nacht beiseite, so wie die Kleider über den Stuhl.",
    "g3": "Wenn ein Gedanke kommt, lass ihn vorbeiziehen. Du musst ihm nicht folgen. "
          "Kehr einfach zurück zur Schwere des Körpers und zum Atem.",
    "g4": "Wenn du magst, zähl jetzt still deine Ausatemzüge, rückwärts von zehn bis eins. Ganz langsam. "
          "Wenn du dich verzählst, ist das egal. Fang einfach irgendwo wieder an.",
    "g5": "Und falls du noch wach bist, wenn es gleich still wird: Bleib einfach liegen und atme. Auch ruhiges Liegen erholt.",
    # Ausklang – immer leiser
    "e1": "Du kannst jetzt alles loslassen.",
    "e2": "Nichts mehr zu tun.",
    "e3": "Schwer. Und warm. Und ruhig.",
    "e4": "Der Schlaf darf kommen, wann er will.",
    "e5": "Gute Nacht.",
}

D = "dehnbar"

TEXTE = {
    10: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 5),
        ("sag", "a2"), ("still", 5),
        ("sag", "a3"), ("still", 8),
        ("sag", "b1"), ("still", 1),
        ("teil", "takt"), ("takt", 3, 3), ("sag", "b2w"), ("takt", 0, 4),
        ("teil", "takt_ende"),
        ("sag", "b3"), ("still", 15, D),
        ("sag", "k0"), ("still", 4),
        ("sag", "k1"), ("still", 11),
        ("sag", "k3"), ("still", 11),
        ("sag", "k5"), ("still", 12),
        ("sag", "k6"), ("still", 12),
        ("sag", "k8"), ("still", 11),
        ("sag", "k9"), ("still", 12),
        ("sag", "k10"), ("still", 11),
        ("sag", "k11"), ("still", 12),
        ("sag", "kz"), ("still", 18, D),
        ("teil", "gedanken"),
        ("sag", "g1"), ("still", 6),
        ("sag", "g2"), ("still", 12),
        ("sag", "g3"), ("still", 22, D),
        ("teil", "ausklang"),
        ("sag", "g5", 0.9), ("still", 12),
        ("sag", "e1", 0.85), ("still", 18, D),
        ("sag", "e2", 0.75), ("still", 22, D),
        ("sag", "e4", 0.65), ("still", 26, D),
        ("sag", "e5", 0.55), ("still", 40),
    ],
    20: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 5),
        ("sag", "a2"), ("still", 6),
        ("sag", "a3"), ("still", 10),
        ("sag", "a4"), ("still", 8),
        ("sag", "b1"), ("still", 1),
        ("teil", "takt"), ("takt", 3, 3), ("sag", "b2w"), ("takt", 0, 9),
        ("teil", "takt_ende"),
        ("sag", "b3"), ("still", 15, D),
        ("sag", "b4"), ("still", 15, D),
        ("sag", "k0"), ("still", 5),
        ("sag", "k1"), ("still", 15),
        ("sag", "k2"), ("still", 14),
        ("sag", "k3"), ("still", 15),
        ("sag", "k4"), ("still", 15),
        ("sag", "k5"), ("still", 16),
        ("sag", "k6"), ("still", 16),
        ("sag", "k7"), ("still", 16),
        ("sag", "k8"), ("still", 15),
        ("sag", "k9"), ("still", 16),
        ("sag", "k10"), ("still", 15),
        ("sag", "k11"), ("still", 15),
        ("sag", "k12"), ("still", 14),
        ("sag", "k13"), ("still", 14),
        ("sag", "kz"), ("still", 15, D),
        ("sag", "kz2"), ("still", 15, D),
        ("teil", "schwere"),
        ("sag", "w1"), ("still", 16),
        ("sag", "w2"), ("still", 16),
        ("sag", "w3"), ("still", 18),
        ("sag", "w4"), ("still", 18, D),
        ("teil", "gedanken"),
        ("sag", "g1"), ("still", 8),
        ("sag", "g2"), ("still", 15),
        ("sag", "g3"), ("still", 20, D),
        ("sag", "g4"), ("still", 50, D),
        ("teil", "ausklang"),
        ("sag", "g5", 0.9), ("still", 15),
        ("sag", "e1", 0.85), ("still", 20, D),
        ("sag", "e2", 0.75), ("still", 25, D),
        ("sag", "e3", 0.7), ("still", 30, D),
        ("sag", "e4", 0.65), ("still", 35, D),
        ("sag", "e5", 0.55), ("still", 75),
    ],
}
