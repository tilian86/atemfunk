#!/usr/bin/env python3
"""Baut die Stimme der Atemuhr audio/prog/atem/{1,3,5,7,10}-1.mp3 (+ audio/m/…) aus atemuhr_texte.py.

Seit 26.10.2026 (Version 59) ElevenLabs v4 Bella (w) / Eric (m) statt der alten Edge-Aufnahmen
audio/atem-N.mp3. Gebaut wie „Einfach sitzen“ (sitzen_bauen.bauen, nur mit anderen Texten): Absätze
einzeln vertont, auf die Zeitleiste gelegt, die dehnbaren Stillen nehmen die Restzeit auf, −21 LUFS.
Kein Atemplan – die App lässt die Kugel bei Stimme immer „Ruhig“ 4·6 laufen.

Aufruf: python3 tools/atemuhr_bauen.py [1 3 5 7 10] [--zeichen]
"""
import os, sys

sys.path.insert(0, os.path.dirname(__file__))
import sitzen_bauen as sb
from runter_bauen import AUDIO
from atemuhr_texte import S, TEXTE

sb.S, sb.TEXTE, sb.NAME = S, TEXTE, "atem"
sb.FASSUNG = "-1"          # index.html PROG_FASSUNG.atem
sb.SCHLUSS_LUFT = 3.4      # wie die alten Aufnahmen: Platz für den Endgong

if __name__ == "__main__":
    laengen = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(TEXTE)
    if "--zeichen" in sys.argv:
        n, absaetze = sb.zeichen(laengen)
        print(f"{absaetze} Absätze, {n} Zeichen je Stimme, {2 * n} für beide (ohne Cache-Treffer)")
        sys.exit()
    for minuten in laengen:
        _, erg, dehn, _ = sb.bauen(minuten)
        print(f"{minuten} Min: Stillen ×{dehn:.2f}")
        for s, (aus, ende) in erg.items():
            print(f"  {os.path.relpath(aus, AUDIO + '/..')}: letzter Satz endet bei {ende:.1f} s")
