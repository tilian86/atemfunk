#!/usr/bin/env python3
"""Baut „Morgen“ audio/prog/morgen/{5,10}-1.mp3 aus morgen_texte.py — Bella, Zen, Ela, Elion
(audio/prog, audio/v/zen/prog, audio/v/ela/prog, audio/v/elion/prog), mit dem Gerüst aus programm_bauen.py (Atemrunden, dehnbare Stillen, −21 LUFS, sekundengenau).
Die belebenden Atemzüge laufen im Rhythmus „wach“ (4 ein · 4 aus) – den braucht index.html in RHYTHMS.
Am Ende druckt das Skript PROG_ATEM für index.html.

Aufruf: python3 tools/morgen_bauen.py [5 10] [--zeichen] [--schaetzen] [--stimmen w,zen,ela,eli]
"""
import os, sys

sys.path.insert(0, os.path.dirname(__file__))
import programm_bauen as pb
from morgen_texte import S, ZUEGE, TEXTE

pb.S, pb.ZUEGE, pb.TEXTE, pb.NAME = S, ZUEGE, TEXTE, "morgen"
pb.FASSUNG = "-1"          # index.html PROG_FASSUNG.morgen

if __name__ == "__main__":
    pb.main()
