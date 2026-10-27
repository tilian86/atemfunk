#!/usr/bin/env python3
"""Baut „Panik“ audio/prog/panik/3-1.mp3 aus panik_texte.py — nur Bella, mit dem Zeitplan der
Notbremse (notbremse_bauen.bauen mit anderem Ablauf). Die Restzeit geht in die Stille nach „Ich bin hier“.

Aufruf: python3 tools/panik_bauen.py
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
import notbremse_bauen as nb
from panik_texte import S

D = nb.D
nb.S, nb.NAME, nb.FASSUNG = S, "panik", "-1"     # index.html PROG_FASSUNG.panik
nb.ABLAUF = [
    ("teil", "ankommen"), ("still", 1), ("sag", "p1"), ("still", 1.5), ("sag", "p2"), ("still", 2),
    ("sag", "p3"), ("still", 4),
    ("teil", "ruhig_intro"), ("sag", "p4"), ("still", 1),
    ("teil", "ruhig"), ("ruhig", 3, 3), ("sag", "n6"), ("ruhig", 0, 1),
    ("teil", "sinne"),
    ("sag", "p5"), ("still", 12), ("sag", "p6"), ("still", 9), ("sag", "p7"), ("still", 8),
    ("sag", "p8"), ("still", 6),
    ("teil", "hier"), ("sag", "p9"), ("still", 0, D),
    ("sag", "p10"), ("still", 1.5), ("sag", "p11"), ("still", 1.5), ("sag", "n10"),
]

if __name__ == "__main__":
    plan, aus, rest, ende = nb.bauen()
    print(f"{os.path.relpath(aus, nb.rb.AUDIO + '/..')}: Stille nach „Ich bin hier“ {rest:.1f} s, letzter Satz endet bei {ende:.1f} s")
    print("PROG_ATEM =", json.dumps({"panik-3": plan}))
