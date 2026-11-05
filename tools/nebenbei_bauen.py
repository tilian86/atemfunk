#!/usr/bin/env python3
"""Baut „Nebenbei“ audio/prog/nebenbei/{2,5}-1.mp3 aus nebenbei_texte.py — nur Bella
(audio/prog), mit dem Gerüst aus programm_bauen.py (dehnbare Stillen, −21 LUFS, sekundengenau).
Augen offen, die Tätigkeit läuft weiter: Füße, Hände, Bewegung, Hören, Sehen, Riechen, zurückkommen.
Am Ende druckt das Skript PROG_ATEM für index.html.

Aufruf: python3 tools/nebenbei_bauen.py [2 5] [--zeichen] [--schaetzen] [--stimmen w,zen,ela,eli]
"""
import os, sys

sys.path.insert(0, os.path.dirname(__file__))
if "--stimmen" not in sys.argv:
    sys.argv += ["--stimmen", "w"]     # nur Bella (Florian: Neues nur Bella)
import programm_bauen as pb
from nebenbei_texte import S, ZUEGE, TEXTE

pb.S, pb.ZUEGE, pb.TEXTE, pb.NAME = S, ZUEGE, TEXTE, "nebenbei"
pb.FASSUNG = "-1"          # index.html PROG_FASSUNG.nebenbei

if __name__ == "__main__":
    pb.main()
