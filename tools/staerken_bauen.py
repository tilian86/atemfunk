#!/usr/bin/env python3
"""Baut „Stärken“ audio/prog/staerken/{5,10}-1.mp3 aus staerken_texte.py — Bella, Zen, Ela, Elion
(audio/prog, audio/v/zen/prog, audio/v/ela/prog, audio/v/elion/prog), mit dem Gerüst aus programm_bauen.py (Atemrunden, dehnbare Stillen, −21 LUFS, sekundengenau).
Ankommen mit 4 · 6 (Kugel läuft mit) → Sätze aus Selbstmitgefühl, Stärken und realistischen Sätzen, je mit Stille → Schluss.
Am Ende druckt das Skript PROG_ATEM für index.html.

Aufruf: python3 tools/staerken_bauen.py [5 10] [--zeichen] [--schaetzen] [--stimmen w,zen,ela,eli]
"""
import os, sys

sys.path.insert(0, os.path.dirname(__file__))
import programm_bauen as pb
from staerken_texte import S, ZUEGE, TEXTE

pb.S, pb.ZUEGE, pb.TEXTE, pb.NAME = S, ZUEGE, TEXTE, "staerken"
pb.FASSUNG = "-1"          # index.html PROG_FASSUNG.staerken

if __name__ == "__main__":
    pb.main()
