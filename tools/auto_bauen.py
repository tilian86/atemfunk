#!/usr/bin/env python3
"""Baut „Im Auto“ audio/prog/auto/{5,10,20}-1.mp3 aus auto_texte.py — Bella, Zen, Ela, Elion
(audio/prog, audio/v/<stimme>/prog), mit dem Gerüst aus programm_bauen.py (dehnbare Stillen, −21 LUFS, sekundengenau).
Florian 07.11.2026, Text freigegeben (tools/auto_entwurf.md). Augen offen, kein Takt, kein Hintergrund.
Am Ende druckt das Skript PROG_ATEM für index.html.

Aufruf: python3 tools/auto_bauen.py [5 10 20] [--zeichen] [--schaetzen] [--stimmen w,zen,ela,eli]
"""
import os, sys

sys.path.insert(0, os.path.dirname(__file__))
import programm_bauen as pb
from auto_texte import S, ZUEGE, TEXTE

pb.S, pb.ZUEGE, pb.TEXTE, pb.NAME = S, ZUEGE, TEXTE, "auto"
pb.FASSUNG = "-1"          # index.html PROG_FASSUNG.auto

if __name__ == "__main__":
    pb.main()
