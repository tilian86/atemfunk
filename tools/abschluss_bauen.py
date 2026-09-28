#!/usr/bin/env python3
"""Baut audio/abschluss/<key>.mp3 (+ audio/m/abschluss/) aus abschluss_texte.py —
ElevenLabs v3 Sarah/Brian, gemeinsame Verstärkung je Stimme auf −21 LUFS wie flex_bauen.py.
Aufruf: python3 tools/abschluss_bauen.py"""
import json, os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from runter_bauen import clip, SR, AUDIO, CACHE
from flex_bauen import lautheit
from abschluss_texte import ABSCHLUSS

ZIEL = {"w": AUDIO + "/abschluss", "m": AUDIO + "/m/abschluss"}
VORLAUF, NACHLAUF = 0.25, 0.5
for stimme, ziel in ZIEL.items():
    clips = {k: clip(stimme, t) for k, t in ABSCHLUSS.items()}
    luecke = np.zeros(int(0.5 * SR), dtype=np.float32)
    gain = 10 ** ((-21 - lautheit(np.concatenate([x for a in clips.values() for x in (a, luecke)]))) / 20)
    os.makedirs(ziel, exist_ok=True)
    for k, a in clips.items():
        b = a * gain
        spitze = float(np.max(np.abs(b)))
        if spitze > 0.79:
            b *= 0.79 / spitze
        b = np.concatenate([np.zeros(int(VORLAUF * SR), dtype=np.float32), b, np.zeros(int(NACHLAUF * SR), dtype=np.float32)])
        raw = f"{CACHE}/abschluss-{stimme}-{k}.f32"
        b.astype(np.float32).tofile(raw)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-c:a", "libmp3lame", "-b:a", "96k", f"{ziel}/{k}.mp3"], check=True)
        print(stimme, k, f"{len(b) / SR:.1f} s")
