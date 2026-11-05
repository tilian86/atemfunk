#!/usr/bin/env python3
"""Baut „Einschlafen“ audio/prog/schlafen/{10,20}-1.mp3 aus schlafen_texte.py — Bella, Zen, Ela, Elion
(audio/prog, audio/v/zen/prog, audio/v/ela/prog, audio/v/elion/prog), mit dem Gerüst aus programm_bauen.py (Atemrunden, dehnbare Stillen, −21 LUFS, sekundengenau).
Endet in Stille: der letzte Satz („Gute Nacht.“) kommt etwa 40 s (10 Min) bzw. 75 s (20 Min) vor dem
Ende, die Sätze im Ausklang werden schrittweise leiser. Die App sollte hier keinen Schlussgong spielen.
Am Ende druckt das Skript PROG_ATEM für index.html.

Aufruf: python3 tools/schlafen_bauen.py [10 20] [--zeichen] [--schaetzen] [--stimmen w,zen,ela,eli]
"""
import os, sys

sys.path.insert(0, os.path.dirname(__file__))
import programm_bauen as pb
from schlafen_texte import S, ZUEGE, TEXTE

pb.S, pb.ZUEGE, pb.TEXTE, pb.NAME = S, ZUEGE, TEXTE, "schlafen"
pb.FASSUNG = "-1"          # index.html PROG_FASSUNG.schlafen

if __name__ == "__main__":
    pb.main()
