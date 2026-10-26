#!/usr/bin/env python3
"""Baut die Phasenansagen audio/cues2/{Einatmen,Halten,Ausatmen,Nachatmen}.mp3 (+ audio/m/cues2/) —
die App spielt sie bei Box-, 4-7-8- und den anderen Atemrhythmen zu Beginn jeder Phase (index.html loadCues).
Seit 26.10.2026 ElevenLabs v4 Bella/Eric über runter_bauen.clip(), wie abschluss_bauen.py gepegelt.

Aufruf: python3 tools/cues_bauen.py
"""
import os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from runter_bauen import clip, SR, AUDIO, CACHE
from flex_bauen import lautheit

ZIEL = {"w": AUDIO + "/cues2", "m": AUDIO + "/m/cues2"}
CUES = {"Einatmen": "Einatmen.", "Halten": "Halten.", "Ausatmen": "Ausatmen.", "Nachatmen": "Nachatmen."}
VORLAUF, NACHLAUF = 0.05, 0.3          # kurz: die Ansage soll genau mit der Phase beginnen

for stimme, ziel in ZIEL.items():
    clips = {k: clip(stimme, t) for k, t in CUES.items()}
    luecke = np.zeros(int(0.5 * SR), dtype=np.float32)
    gain = 10 ** ((-21 - lautheit(np.concatenate([x for a in clips.values() for x in (a, luecke)]))) / 20)
    os.makedirs(ziel, exist_ok=True)
    for k, a in clips.items():
        b = a * gain
        spitze = float(np.max(np.abs(b)))
        if spitze > 0.79:
            b *= 0.79 / spitze
        b = np.concatenate([np.zeros(int(VORLAUF * SR), dtype=np.float32), b, np.zeros(int(NACHLAUF * SR), dtype=np.float32)])
        raw = f"{CACHE}/cue-{stimme}-{k}.f32"
        b.astype(np.float32).tofile(raw)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-c:a", "libmp3lame", "-b:a", "96k", f"{ziel}/{k}.mp3"], check=True)
        print(stimme, k, f"{len(b) / SR:.1f} s")
