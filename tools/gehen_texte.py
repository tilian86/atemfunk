"""Texte von „Gehen“ (3, 5, 7, 10 Min) — Meditation beim ganz normalen Spazierengehen, mit Kopfhörern.

Florian 26.10.2026 (beim Spazieren): „nicht so eine klassische, super langsame Gehmeditation, sondern
einfach, dass man normal spazieren geht … 3, 5, 7, 10 Minuten … mit bisschen Atmung“ – Texte ohne
vorherige Freigabe („bisher haben die Texte immer ganz gut gepasst“). Augen offen, eigenes Tempo,
der Atem wird an die Schritte gekoppelt (4 ein / 4 aus, ab 5 Min 4 ein / 6 aus), dann losgelassen.
Bogen:
  1. Ankommen  — Tempo bleibt, Füße, Schultern
  2. Atem      — Schritte zählen, ab 5 Min längeres Ausatmen, dann loslassen
  3. Körper    — der gehende Körper, Luft auf der Haut (ab 5 Min)
  4. Sinne     — hören, sehen
  5. Offen     — einfach gehen (ab 7 Min)
  6. Schluss   — drei tiefere Atemzüge, weitergehen
Nur Bella. Einträge wie in sitzen_texte.py: ("sag", schlüssel), ("still", s) oder ("still", s, "dehnbar").
"""

S = {
    # Ankommen
    "g1": "Gehen. Geh einfach in deinem normalen Tempo weiter. Die Augen bleiben offen, und du achtest wie immer auf den Weg.",
    "g2": "Für die nächsten Minuten musst du nirgendwo ankommen. Du gehst einfach, und bist dabei ganz hier.",
    "g3": "Spür deine Füße. Wie sie aufsetzen, abrollen und sich wieder lösen. Schritt für Schritt.",
    "g4": "Lass die Schultern sinken und die Arme locker mitschwingen. Das Gesicht darf weich werden.",
    # Atem mit den Schritten
    "b1": "Jetzt verbinde den Atem mit deinen Schritten. Atme ein über vier Schritte. Und atme aus über vier Schritte.",
    "b2": "Zähl dabei still mit. Einatmen, zwei, drei, vier. Ausatmen, zwei, drei, vier.",
    "b3": "Wenn vier Schritte nicht passen, nimm drei oder fünf. Hauptsache, es fühlt sich leicht an.",
    "b4": "Jetzt verlängere das Ausatmen ein wenig. Vier Schritte ein, sechs Schritte aus.",
    "b5": "Wird es dir zu lang, geh einfach zurück zu vier und vier. Der Atem soll bequem bleiben.",
    "b6": "Bleib noch eine Weile bei diesem Rhythmus. Schritte und Atem gehen zusammen.",
    "b7": "Jetzt lass das Zählen los. Der Atem darf wieder von allein gehen, so, wie er will.",
    # Körper
    "k1": "Spür jetzt, wie dein Körper geht. Die Beine tragen dich, ganz von selbst.",
    "k2": "Die Hüften, die sich mit jedem Schritt ein wenig mitbewegen. Der Oberkörper, aufrecht und leicht.",
    "k3": "Die Arme, die mitschwingen. Die Hände, locker und offen.",
    "k4": "Und das Gesicht. Vielleicht die Luft auf der Haut. Kühl oder warm, still oder windig.",
    # Sinne
    "h1": "Öffne jetzt die Ohren für das, was um dich herum zu hören ist. Nahe Geräusche, ferne Geräusche. Du musst sie nicht benennen.",
    "h2": "Vielleicht auch deine eigenen Schritte. Das Geräusch der Sohlen auf dem Weg.",
    "h3": "Lass jetzt den Blick weit werden. Licht, Farben, Bewegung. Schau, ohne an etwas hängen zu bleiben.",
    "h4": "Vielleicht entdeckst du etwas, das du sonst übersehen würdest. Eine Farbe, eine Form, den Himmel.",
    # Gedanken
    "w1": "Gedanken werden kommen. Das ist in Ordnung. Sobald du es merkst, kehr einfach zum nächsten Schritt zurück.",
    "w2": "Wo bist du gerade? Wenn du in Gedanken warst: zurück zu den Füßen. Dieser Schritt. Und dieser.",
    # Offen gehen
    "o1": "Jetzt gibt es nichts Bestimmtes mehr zu tun. Einfach gehen. Spüren, hören, sehen, was gerade da ist.",
    "o2": "Nur gehen. Nur atmen. Nur da sein.",
    # Schluss („f0“ wortgleich mit Einfach sitzen → Cache-Treffer)
    "f0": "Langsam kommen wir zum Ende.",
    "f1": "Nimm noch drei tiefere Atemzüge, ganz in deinem Tempo.",
    "f2": "Und dann geh einfach weiter, wach und ruhig. Etwas von dieser Aufmerksamkeit darf dich begleiten.",
}

D = "dehnbar"

TEXTE = {
    3: [
        ("still", 3), ("sag", "g1"), ("still", 3), ("sag", "g3"), ("still", 6),
        ("sag", "b1"), ("still", 3), ("sag", "b2"), ("still", 25, D),
        ("sag", "w1"), ("still", 15, D),
        ("sag", "b7"), ("still", 4),
        ("sag", "h1"), ("still", 20, D),
        ("sag", "f0"), ("still", 2), ("sag", "f1"), ("still", 14), ("sag", "f2"),
    ],
    5: [
        ("still", 3), ("sag", "g1"), ("still", 3), ("sag", "g2"), ("still", 5),
        ("sag", "g3"), ("still", 8), ("sag", "g4"), ("still", 6),
        ("sag", "b1"), ("still", 3), ("sag", "b2"), ("still", 25, D),
        ("sag", "b4"), ("still", 3), ("sag", "b5"), ("still", 30, D),
        ("sag", "w1"), ("still", 15, D),
        ("sag", "b7"), ("still", 6),
        ("sag", "k1"), ("still", 8), ("sag", "k4"), ("still", 15, D),
        ("sag", "h1"), ("still", 20, D),
        ("sag", "h3"), ("still", 20, D),
        ("sag", "f0"), ("still", 2), ("sag", "f1"), ("still", 14), ("sag", "f2"),
    ],
    7: [
        ("still", 3), ("sag", "g1"), ("still", 3), ("sag", "g2"), ("still", 5),
        ("sag", "g3"), ("still", 10), ("sag", "g4"), ("still", 8),
        ("sag", "b1"), ("still", 3), ("sag", "b2"), ("still", 15, D),
        ("sag", "b3"), ("still", 20, D),
        ("sag", "b4"), ("still", 3), ("sag", "b5"), ("still", 25, D),
        ("sag", "b6"), ("still", 25, D),
        ("sag", "w1"), ("still", 15, D),
        ("sag", "b7"), ("still", 8),
        ("sag", "k1"), ("still", 8), ("sag", "k2"), ("still", 8), ("sag", "k3"), ("still", 8),
        ("sag", "k4"), ("still", 15, D),
        ("sag", "h1"), ("still", 15, D), ("sag", "h2"), ("still", 15, D),
        ("sag", "h3"), ("still", 15, D), ("sag", "h4"), ("still", 20, D),
        ("sag", "o2"), ("still", 20, D),
        ("sag", "f0"), ("still", 2), ("sag", "f1"), ("still", 14), ("sag", "f2"),
    ],
    10: [
        ("still", 3), ("sag", "g1"), ("still", 3), ("sag", "g2"), ("still", 6),
        ("sag", "g3"), ("still", 12), ("sag", "g4"), ("still", 10),
        ("sag", "b1"), ("still", 3), ("sag", "b2"), ("still", 20, D),
        ("sag", "b3"), ("still", 25, D),
        ("sag", "b4"), ("still", 3), ("sag", "b5"), ("still", 30, D),
        ("sag", "b6"), ("still", 35, D),
        ("sag", "w1"), ("still", 20, D),
        ("sag", "b7"), ("still", 10),
        ("sag", "k1"), ("still", 10), ("sag", "k2"), ("still", 10), ("sag", "k3"), ("still", 10),
        ("sag", "k4"), ("still", 20, D),
        ("sag", "h1"), ("still", 20, D), ("sag", "h2"), ("still", 15, D),
        ("sag", "w2"), ("still", 20, D),
        ("sag", "h3"), ("still", 20, D), ("sag", "h4"), ("still", 25, D),
        ("sag", "o1"), ("still", 40, D),
        ("sag", "o2"), ("still", 25, D),
        ("sag", "f0"), ("still", 2), ("sag", "f1"), ("still", 15), ("sag", "f2"),
    ],
}
