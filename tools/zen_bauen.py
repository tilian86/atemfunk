#!/usr/bin/env python3
"""Baut „Zazen“ audio/prog/zen/{7,10,15}-1.mp3 aus zen_texte.py — nur Bella, keine Männerstimme
(Florian 26.10.2026: „du machst ja nur noch Bella“); die App spielt Zazen auch bei Männerstimme mit Bella.
Gebaut wie „Einfach sitzen“ (sitzen_bauen.bauen mit anderen Texten), −21 LUFS, Kugel ohne Takt.

Aufruf: python3 tools/zen_bauen.py [7 10 15] [--zeichen]
"""
import os, sys

sys.path.insert(0, os.path.dirname(__file__))
import sitzen_bauen as sb
from runter_bauen import AUDIO
from zen_texte import S, TEXTE

sb.S, sb.TEXTE, sb.NAME = S, TEXTE, "zen"
sb.FASSUNG = "-1"          # index.html PROG_FASSUNG.zen
del sb.STIMMEN["m"]        # nur Bella

if __name__ == "__main__":
    laengen = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(TEXTE)
    if "--zeichen" in sys.argv:
        n, saetze = sb.zeichen(laengen)
        print(f"{saetze} Sätze, {n} Zeichen (nur Bella, ohne Cache-Treffer)")
        sys.exit()
    for minuten in laengen:
        _, erg, dehn, _ = sb.bauen(minuten)
        print(f"{minuten} Min: Stillen ×{dehn:.2f}")
        for s, (aus, ende) in erg.items():
            print(f"  {os.path.relpath(aus, AUDIO + '/..')}: letzter Satz endet bei {ende:.1f} s")
