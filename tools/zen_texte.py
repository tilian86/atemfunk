"""Texte von „Zazen“ (7, 10, 15 Min) — Zen-Meditation: Haltung, Atemzüge zählen, dann fast nur Stille.

Von Florian am 26.10.2026 freigegeben („dann mach noch so ein Zazen … nur 7, 10 und 15 Minuten“).
Anders als „Einfach sitzen“ kaum Worte: Haltung + Zählanleitung in der ersten Minute, danach höchstens
ein Satz zur Erinnerung (ab einem Drittel) und ab 10 Min einer zur Halbzeit. Kein Schlusstext –
die App gibt drei Gongschläge am Anfang (darum VORLAUF) und den üblichen Gong am Ende.
Einträge wie in sitzen_texte.py: ("sag", schlüssel), ("still", s) oder ("still", s, "dehnbar").
"""

S = {
    "z1": "Zazen. Setz dich aufrecht und stabil hin. Der Rücken ist gerade, das Kinn ein wenig zurückgenommen.",
    "z2": "Leg die Hände im Schoß ineinander, die Daumenspitzen berühren sich leicht.",
    "z3": "Lass die Augen halb offen. Der Blick ruht ohne Ziel auf dem Boden vor dir.",
    "z4": "Zähl jetzt die Atemzüge, jeweils beim Ausatmen: eins, zwei, bis zehn. Dann beginnst du wieder bei eins.",
    "z5": "Wenn du dich verzählst oder abschweifst: einfach wieder bei eins anfangen. Das gehört dazu.",
    "z6": "Wenn du magst, lass das Zählen jetzt los. Nur sitzen.",
}

D = "dehnbar"
VORLAUF = 11.0     # die drei Anfangsgongs der App (0 / 3,5 / 7 s) klingen aus, bevor die Stimme kommt

_ANFANG = [("still", VORLAUF), ("sag", "z1"), ("still", 4), ("sag", "z2"), ("still", 4),
           ("sag", "z3"), ("still", 6), ("sag", "z4")]

# Verhältnisse der dehnbaren Stillen legen fest, wo z5 (≈ ein Drittel) und z6 (≈ Halbzeit) landen
TEXTE = {
    7: _ANFANG + [("still", 60, D), ("sag", "z5"), ("still", 180, D)],
    10: _ANFANG + [("still", 60, D), ("sag", "z5"), ("still", 40, D), ("sag", "z6"), ("still", 120, D)],
    15: _ANFANG + [("still", 60, D), ("sag", "z5"), ("still", 35, D), ("sag", "z6"), ("still", 105, D)],
}
