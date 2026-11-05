#!/usr/bin/env python3
"""Baut die Ansagen der Kraftatmung nach Wim Hof (Version 69, Florian 05.11.2026) —
audio/kraft/<schlüssel>.mp3 (Bella) und audio/v/{zen,ela,elion}/kraft/. Die Übung selbst steuert die App
(index.html Kraftatmung): 30 tiefe Atemzüge im Takt der Kugel, Luft anhalten bis zum Tippen,
15 s Erholungsatem, 3 Runden. Hier nur die einzelnen Sätze, gepegelt wie cues_bauen.py.

Aufruf: python3 tools/kraft_bauen.py [w zen ela eli]
"""
import os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from runter_bauen import clip, SR, AUDIO, CACHE
from flex_bauen import lautheit

ZIEL = {"w": AUDIO + "/kraft", "zen": AUDIO + "/v/zen/kraft", "ela": AUDIO + "/v/ela/kraft", "eli": AUDIO + "/v/elion/kraft"}
TEXTE = {
    "intro": "Kraftatmung nach Wim Hof. Setz oder leg dich bequem hin. Niemals im Wasser, und nie beim Autofahren. "
             "Kribbeln oder ein leichter Schwindel sind normal. Wenn dir unwohl wird, hör einfach auf und atme normal weiter.",
    "anleitung": "Gleich atmest du dreißig Mal tief ein, bis in den Bauch und die Brust. Und lässt die Luft jedes Mal locker wieder raus, "
                 "ohne zu drücken. Folge einfach der Kugel.",
    "runde1": "Runde eins.",
    "runde2": "Runde zwei.",
    "runde3": "Runde drei.",
    "runde4": "Runde vier.",
    "noch5": "Noch fünf Atemzüge.",
    "anhalten": "Jetzt noch einmal einatmen, locker ausatmen, und die Luft draußen lassen. Entspann dich. "
                "Tippe auf die Kugel, sobald du wieder atmen möchtest.",
    "erholung": "Tief einatmen. Und halten.",
    "loslassen": "Und loslassen.",
    "ende": "Das war die letzte Runde. Atme jetzt ganz normal weiter, und spür nach, wie lebendig sich dein Körper anfühlt.",
}
VORLAUF, NACHLAUF = 0.05, 0.3

for stimme, ziel in ZIEL.items():
    if len(sys.argv) > 1 and stimme not in sys.argv[1:]:
        continue
    clips = {k: clip(stimme, t) for k, t in TEXTE.items()}
    luecke = np.zeros(int(0.5 * SR), dtype=np.float32)
    gain = 10 ** ((-21 - lautheit(np.concatenate([x for a in clips.values() for x in (a, luecke)]))) / 20)
    os.makedirs(ziel, exist_ok=True)
    for k, a in clips.items():
        b = a * gain
        spitze = float(np.max(np.abs(b)))
        if spitze > 0.79:
            b *= 0.79 / spitze
        b = np.concatenate([np.zeros(int(VORLAUF * SR), dtype=np.float32), b, np.zeros(int(NACHLAUF * SR), dtype=np.float32)])
        raw = f"{CACHE}/kraft-{stimme}-{k}.f32"
        b.astype(np.float32).tofile(raw)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-c:a", "libmp3lame", "-b:a", "96k", f"{ziel}/{k}.mp3"], check=True)
        print(stimme, k, f"{len(b) / SR:.1f} s")
