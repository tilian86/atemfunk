#!/usr/bin/env python3
"""Vertont alle Sätze eines Textmoduls in den Cache und hört sie mit mlx_whisper gegen den
Text ab. Weicht ein Satz ab (Ähnlichkeit < 0,9), wird er bis zu dreimal neu geholt; der beste
Take bleibt im Cache, die Bau-Skripte nehmen dann ihn. Danach das Bau-Skript neu laufen lassen.

Aufruf: python3 tools/tts_pruefen.py <modul> [--nur w|m] [--grok]
<modul>: taeglich_texte, innehalten_texte, sitzen_texte (S + ZUEGE), runter_texte (Sätze in TEXTE),
flex_texte (ARTEN), abschluss_texte (ABSCHLUSS) oder fragen (fragen.json)
--nur w: nur eine Stimme prüfen (Flex + Fragen gibt es seit 26.10.2026 nur mit Bella)
"""
import difflib, importlib, json, os, re, shutil, sys

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


def saetze_von(name):
    """{Schlüssel: Satz} – die Textmodule legen ihre Sätze unterschiedlich ab."""
    if name == "fragen":
        from fragen_bauen import FRAGEN, sprechtext
        return {str(i): sprechtext(t) for i, t in enumerate(FRAGEN)}
    modul = importlib.import_module(name)
    if hasattr(modul, "S"):
        importlib.import_module(name.replace("_texte", "_bauen"))   # Stimmen wie im Bau
        return {**modul.S, **getattr(modul, "ZUEGE", {})}
    saetze = dict(getattr(modul, "ZUEGE", {}))
    for m, teile in getattr(modul, "TEXTE", {}).items():          # Runterkommen: Sätze direkt im Ablauf
        for e in teile:
            if e[0] == "sag" and e[1] not in saetze.values():
                saetze[f"{m}/{len(saetze)}"] = e[1]
    for art, d in getattr(modul, "ARTEN", {}).items():
        saetze.update({f"{art}/{k}": t for k, t in d.items() if k not in ("titel", "kurz")})
    saetze.update(getattr(modul, "ABSCHLUSS", {}))
    return saetze


if __name__ == "__main__":
    saetze = saetze_von(sys.argv[1])
    if "--grok" in sys.argv:
        for st, voice in GROK_STIMMEN.items():
            rb.STIMMEN[st] = ("grok", voice, rb.STIMMEN[st][2])
    stimmen = [sys.argv[sys.argv.index("--nur") + 1]] if "--nur" in sys.argv else list(rb.STIMMEN)
    auffaellig = []
    for st in stimmen:
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
                dienst, voice, _ = rb.STIMMEN[st]
                if dienst == "el":   # gleicher Seed gäbe denselben Take – Neuversuch mit anderem Seed, gleicher Cache-Name
                    alt, rb.EL_SEED = rb.EL_SEED, rb.EL_SEED + versuch
                    daten = rb._el(voice, text)
                    rb.EL_SEED = alt
                    open(basis + ".mp3", "wb").write(daten)
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
    print(f"\n{len(saetze) * len(stimmen)} Sätze geprüft, auffällig: {len(auffaellig)}")
    print("\n".join(auffaellig))
