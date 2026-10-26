#!/usr/bin/env python3
"""Baut audio/fragen2/<nr>.mp3 aus fragen.json („Über eine Frage meditieren“, KlarKreis-Fragen):
<nr> ist die Stelle in fragen.json → fragen, so wie die App sie abspielt (index.html sprichFrage).

Seit 26.10.2026 ElevenLabs v4 Bella über runter_bauen.clip(), nur Frauenstimme (Florian: „reicht
nur Bella“) – die Männerstimme bleibt die alte Aufnahme in audio/m/fragen/ (index.html FRAGEN_ORDNER).
Lautheit wie abschluss_bauen.py: eine gemeinsame Verstärkung auf −21 LUFS, Spitzen ≤ −2 dBFS.

Aufruf: python3 tools/fragen_bauen.py [m|w]   (ohne Argument: nur w)
"""
import json, os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from runter_bauen import clip, SR, AUDIO, CACHE
from flex_bauen import lautheit

ZIEL = {"w": AUDIO + "/fragen2", "m": AUDIO + "/m/fragen2"}
VORLAUF, NACHLAUF = 0.25, 0.5
FRAGEN = json.load(open(os.path.join(AUDIO, "..", "fragen.json")))["fragen"]


def sprechtext(t):
    """Was Bella sagen soll: „der/die“ las sie als „der Schrägstrich die“."""
    return t.replace("der/die", "der oder die")


if __name__ == "__main__":
    for stimme in [a for a in sys.argv[1:] if a in ZIEL] or ["w"]:
        clips = [clip(stimme, sprechtext(t)) for t in FRAGEN]
        luecke = np.zeros(int(0.5 * SR), dtype=np.float32)
        gain = 10 ** ((-21 - lautheit(np.concatenate([x for a in clips for x in (a, luecke)]))) / 20)
        os.makedirs(ZIEL[stimme], exist_ok=True)
        for nr, a in enumerate(clips):
            b = a * gain
            spitze = float(np.max(np.abs(b)))
            if spitze > 0.79:
                b *= 0.79 / spitze
            b = np.concatenate([np.zeros(int(VORLAUF * SR), dtype=np.float32), b, np.zeros(int(NACHLAUF * SR), dtype=np.float32)])
            raw = f"{CACHE}/frage-{stimme}-{nr}.f32"
            b.astype(np.float32).tofile(raw)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                            "-c:a", "libmp3lame", "-b:a", "96k", f"{ZIEL[stimme]}/{nr}.mp3"], check=True)
        print(stimme, len(clips), "Fragen →", os.path.relpath(ZIEL[stimme], AUDIO + "/.."))
