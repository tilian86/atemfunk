#!/usr/bin/env python3
"""Baut die Bausteine audio/flex/<art>/<key>.mp3 (+ audio/m/flex/…) aus
flex_texte.py und trägt die Sekundenlängen in flex.json ein.

Stimmen, Schlüsselrotation, Beschneiden und Cache kommen aus runter_bauen.py
(ElevenLabs v3, Sarah/Brian). Lautheit: eine gemeinsame Verstärkung je Stimme,
gemessen über alle Bausteine zusammen (−21 LUFS wie der Rest der App), damit
die Sätze untereinander so laut bleiben, wie die Stimme sie gesprochen hat.

Aufruf: python3 tools/flex_bauen.py [m|w] [art …] [--nur-neu]   (ohne Argumente: alles)
Geänderter Klang → neuer Ordnername, der Service Worker liefert Audio
cache-first und ignoriert ?v=.
"""
import json, os, subprocess, sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from runter_bauen import clip, SR, AUDIO, CACHE
from flex_texte import ARTEN

ZIEL = {"w": AUDIO + "/flex", "m": AUDIO + "/m/flex"}
VORLAUF, NACHLAUF = 0.25, 0.6
def keys_von(art): return [k for k in ARTEN[art] if k not in ("titel", "kurz")]


def lautheit(a):
    raw = f"{CACHE}/mess.f32"
    a.astype(np.float32).tofile(raw)
    mess = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                           "-af", "loudnorm=I=-21:TP=-2:LRA=11:print_format=json", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    anf = mess.rindex("{")
    return float(json.loads(mess[anf:mess.index("}", anf) + 1])["input_i"])


def bauen(stimme, arten, nur_neu=False):
    clips = {(art, k): clip(stimme, ARTEN[art][k]) for art in arten for k in keys_von(art)}
    luecke = np.zeros(int(0.5 * SR), dtype=np.float32)
    alle = np.concatenate([x for a in clips.values() for x in (a, luecke)])
    gain = 10 ** ((-21 - lautheit(alle)) / 20)
    print(f"{stimme}: Verstärkung {20 * np.log10(gain):+.1f} dB")
    laengen = {}
    for (art, k), a in clips.items():
        if nur_neu and os.path.exists(f"{ZIEL[stimme]}/{art}/{k}.mp3"):
            continue
        b = a * gain
        spitze = float(np.max(np.abs(b)))
        if spitze > 0.79:            # −2 dBFS
            b *= 0.79 / spitze
        b = np.concatenate([np.zeros(int(VORLAUF * SR), dtype=np.float32), b,
                            np.zeros(int(NACHLAUF * SR), dtype=np.float32)])
        raw = f"{CACHE}/flex-{stimme}-{art}-{k}.f32"
        b.astype(np.float32).tofile(raw)
        ordner = f"{ZIEL[stimme]}/{art}"
        os.makedirs(ordner, exist_ok=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-c:a", "libmp3lame", "-b:a", "96k", f"{ordner}/{k}.mp3"], check=True)
        laengen[(art, k)] = round(len(b) / SR, 2)
    return laengen


if __name__ == "__main__":
    args = sys.argv[1:]
    nur_neu = "--nur-neu" in args          # vorhandene Dateien unangetastet lassen (Cache auf den Geräten)
    stimmen = [a for a in args if a in ("m", "w")] or ["m", "w"]
    arten = [a for a in args if a in ARTEN] or list(ARTEN)
    pfad = os.path.join(AUDIO, "..", "flex.json")
    flex = json.load(open(pfad))
    neu = {}
    for s in stimmen:
        for key, sek in bauen(s, arten, nur_neu).items():
            neu[key] = max(neu.get(key, 0), sek)
    for (art, k), sek in neu.items():
        alt = flex.get(art, {}).get(k, 0) if len(stimmen) == 1 else 0   # nur eine Stimme gebaut → die andere bleibt maßgeblich
        flex.setdefault(art, {})[k] = max(alt, sek)
    for art in arten:                       # verwaiste Einträge (gelöschte Bausteine) entfernen
        for k in list(flex.get(art, {})):
            if k not in keys_von(art): del flex[art][k]
    json.dump(flex, open(pfad, "w"), indent=1, ensure_ascii=False, sort_keys=True)
    open(pfad, "a").write("\n")
    for art in arten:
        print(art, {k: flex[art][k] for k in keys_von(art)})
