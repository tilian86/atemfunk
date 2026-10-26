#!/usr/bin/env python3
"""Vertont alle Sätze eines Textmoduls (S + ZUEGE) in den Cache und hört sie mit
mlx_whisper gegen den Text ab. Weicht ein Satz ab (Ähnlichkeit < 0,9), wird er bis zu
dreimal neu geholt; der beste Take bleibt im Cache, die Bau-Skripte nehmen dann ihn.

Aufruf: python3 tools/tts_pruefen.py taeglich_texte|innehalten_texte [--grok]
"""
import difflib, importlib, os, re, shutil, sys

sys.path.insert(0, os.path.dirname(__file__))
import runter_bauen as rb
import mlx_whisper

GROK_STIMMEN = {"w": "celeste", "m": "orion"}
ZAHLEN = {"zwei": "2", "drei": "3", "vier": "4", "fünf": "5", "sechs": "6", "acht": "8", "zehn": "10"}
VERSUCHE = 3


def norm(t):
    t = re.sub(r"[^\wäöüß ]", " ", t.lower())
    return " ".join(ZAHLEN.get(w, w) for w in t.split())


def hoeren(mp3):
    return mlx_whisper.transcribe(mp3, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="de")["text"].strip()


def guete(text, gehoert):
    return difflib.SequenceMatcher(None, norm(text), norm(gehoert)).ratio()


if __name__ == "__main__":
    modul = importlib.import_module(sys.argv[1])
    if "--grok" in sys.argv:
        for st, voice in GROK_STIMMEN.items():
            rb.STIMMEN[st] = ("grok", voice, rb.STIMMEN[st][2])
    saetze = {**modul.S, **modul.ZUEGE}
    auffaellig = []
    for st in rb.STIMMEN:
        for k, text in saetze.items():
            rb.clip(st, text)
            basis = rb.clip_pfad(st, text)
            gehoert = hoeren(basis + ".mp3")
            beste = (guete(text, gehoert), gehoert)
            versuch = 0
            while beste[0] < 0.9 and versuch < VERSUCHE:
                versuch += 1
                shutil.copy(basis + ".mp3", f"{basis}.best.mp3") if versuch == 1 else None
                for ext in (".mp3", ".f32"):
                    if os.path.exists(basis + ext):
                        os.remove(basis + ext)
                rb.clip(st, text)
                g = hoeren(basis + ".mp3")
                if guete(text, g) > beste[0]:
                    beste = (guete(text, g), g)
                    shutil.copy(basis + ".mp3", f"{basis}.best.mp3")
            if versuch:   # besten Take zurücklegen
                shutil.move(f"{basis}.best.mp3", basis + ".mp3")
                if os.path.exists(basis + ".f32"):
                    os.remove(basis + ".f32")
                rb.clip(st, text)
            zeile = f"{st} | {k} | {beste[0]:.2f} | {versuch} neu | {text} | {beste[1]}"
            if beste[0] < 0.9:
                auffaellig.append(zeile)
            print(zeile, flush=True)
    print(f"\n{len(saetze) * len(rb.STIMMEN)} Sätze geprüft, auffällig: {len(auffaellig)}")
    print("\n".join(auffaellig))
