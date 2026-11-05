"""Texte für „Stärken“ (5, 10 Min) — Sätze, die stärken — Entwurf: staerken_entwurf.md.

Florian 05.11.2026: „positive Affirmationen … die einen stärkt“. Bewusst KEINE Jubel-Sätze („Ich bin
großartig“): Wood, Perunovic & Lee 2009 zeigen, dass sie Menschen mit niedrigem Selbstwert eher schlechter
fühlen lassen. Stattdessen, was die Forschung stützt:
  - Selbstmitgefühl (Kristin Neff): „Möge ich freundlich mit mir sein“, „Das ist gerade schwer“
  - eigene Werte und Stärken erinnern (Selbstbestätigung nach Cohen & Sherman)
  - realistische Sätze, die man glauben kann: „Ich darf lernen“, „Ich habe schon Schweres geschafft“
Wer einen Satz nicht glauben kann, darf ihn weglassen oder kleiner machen – das sagt die Anleitung.
  1. Ankommen      — Haltung, 4 · 6 im Takt (Kugel läuft mit), Hand auf Brust oder Bauch
  2. Freundlich    — Selbstmitgefühl
  3. Stärken       — etwas gut gemacht, was dabei geholfen hat (10: ein Wert, der dir wichtig ist)
  4. Glaubbar      — realistische Sätze, jeder mit Stille zum Nachspüren
  5. Schluss       — einen Satz mitnehmen, Augen auf

Einträge wie in programm_bauen.py.
"""

ZUEGE = {
    "r_ein": "Ein.",
    "r_aus": "Und langsam aus.",
}

S = {
    # Ankommen
    "s1": "Schön, dass du da bist. Setz oder leg dich bequem hin. Und schließ die Augen, wenn du magst.",
    "c3": "Zuerst ein paar ruhige Atemzüge. Vier ein, sechs aus. Ich zähle mit.",   # wie im Körper-Check
    "b2w": "Allein weiter, im gleichen Takt.",                                      # wie in Täglich
    "s3": "Lass den Atem wieder von allein gehen. Leg, wenn du magst, eine Hand auf die Brust oder auf den Bauch. "
          "Spür die Wärme und den leichten Druck.",
    "s4": "Gleich kommen ein paar Sätze. Sprich sie innerlich mit, langsam, und spür nach, wie sie sich anfühlen. "
          "Wenn ein Satz nicht passt, lass ihn einfach vorbeigehen. Oder mach ihn kleiner, so dass er für dich stimmt.",
    # Freundlich (Selbstmitgefühl)
    "s5": "Möge ich freundlich mit mir sein.",
    "s5b": "Spür nach, wie der Satz ankommt. Wird es eher enger oder eher weiter? Beides ist eine Antwort.",
    "s6": "Möge ich mich so annehmen, wie ich gerade bin.",
    "s7": "Und wenn gerade etwas schwer ist: Das ist ein schwerer Moment. Schwierigkeiten gehören zum Leben. "
          "Anderen geht es auch so.",
    # Stärken und Werte
    "s8": "Erinner dich an etwas, das du gut gemacht hast. Es darf etwas Kleines sein, von heute oder von früher. "
          "Sieh es einen Moment vor dir.",
    "s9": "Was hat dir dabei geholfen? Geduld, Mut, Sorgfalt, Humor? Das gehört zu dir. Es ist auch heute da.",
    "s10": "Was ist dir wichtig im Leben? Vielleicht Ehrlichkeit, die Menschen, die du magst, etwas Neues lernen. "
           "Nimm einen dieser Werte, und bleib einen Moment bei ihm.",
    # Glaubbare Sätze
    "s11": "Ich habe schon Schweres geschafft.",
    "s12": "Ich darf lernen. Fehler gehören dazu.",
    "s13": "Ich muss nicht perfekt sein.",
    "s14": "Ich darf mir Zeit lassen.",
    "s15": "Ich tue, was ich kann. Und das ist genug für heute.",
    "s16": "Ich darf um Hilfe bitten.",
    "s19": "Ich kann einen Schritt nach dem anderen gehen.",
    # Schluss
    "s17": "Such dir den Satz aus, der dir am meisten gutgetan hat. Sag ihn dir noch einmal, und nimm ihn mit.",
    "s18": "Nimm einen tiefen Atemzug. Nimm die Hand wieder zu dir. Und wenn du so weit bist, öffne die Augen.",
}

D = "dehnbar"

TEXTE = {
    5: [
        ("teil", "ankommen"), ("still", 2),
        ("sag", "s1"), ("still", 3),
        ("sag", "c3"), ("still", 1),
        ("teil", "takt"), ("takt", 2, 2), ("sag", "b2w"), ("takt", 0, 2),
        ("teil", "takt_ende"),
        ("sag", "s3"), ("still", 6),
        ("sag", "s4"), ("still", 4),
        ("teil", "freundlich"),
        ("sag", "s5"), ("still", 12, D),
        ("sag", "s6"), ("still", 12, D),
        ("teil", "staerken"),
        ("sag", "s8"), ("still", 15, D),
        ("sag", "s9"), ("still", 12, D),
        ("teil", "saetze"),
        ("sag", "s11"), ("still", 10, D),
        ("sag", "s12"), ("still", 10, D),
        ("sag", "s13"), ("still", 10, D),
        ("sag", "s15"), ("still", 12, D),
        ("teil", "schluss"),
        ("sag", "s17"), ("still", 12, D),
        ("sag", "s18"),
    ],
    10: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "s1"), ("still", 4),
        ("sag", "c3"), ("still", 1),
        ("teil", "takt"), ("takt", 3, 3), ("sag", "b2w"), ("takt", 0, 4),
        ("teil", "takt_ende"),
        ("sag", "s3"), ("still", 10),
        ("sag", "s4"), ("still", 5),
        ("teil", "freundlich"),
        ("sag", "s5"), ("still", 10),
        ("sag", "s5b"), ("still", 12, D),
        ("sag", "s6"), ("still", 15, D),
        ("sag", "s7"), ("still", 18, D),
        ("teil", "staerken"),
        ("sag", "s8"), ("still", 20, D),
        ("sag", "s9"), ("still", 15, D),
        ("sag", "s10"), ("still", 20, D),
        ("teil", "saetze"),
        ("sag", "s11"), ("still", 14, D),
        ("sag", "s12"), ("still", 14, D),
        ("sag", "s13"), ("still", 14, D),
        ("sag", "s14"), ("still", 14, D),
        ("sag", "s15"), ("still", 15, D),
        ("sag", "s16"), ("still", 14, D),
        ("sag", "s19"), ("still", 14, D),
        ("teil", "schluss"),
        ("sag", "s17"), ("still", 18, D),
        ("sag", "s18"),
    ],
}
