#!/usr/bin/env python3
"""Baut audio/prog/sitzen/{1,3,5,7,10,15,20}.mp3 (+ audio/m/…) aus sitzen_texte.py — die klassische
Meditation „Einfach sitzen“ (Florian 26.10.2026): Atem nur beobachten, Körperscan, offen sitzen.
Wie innehalten_bauen.py, aber ganz ohne Atemtakt: Sätze einzeln vertont (Cache ~/.cache/atemfunk-tts),
auf einer Zeitleiste angeordnet, dehnbare Stillen nehmen die Restzeit auf, Stimme −21 LUFS, ohne
Hintergrund – den legt die App darunter (Vögel/Stille/Frequenzen, eigener Regler).

Stimmen: ElevenLabs v4 Bella (w) / Eric (m), Stabilität 0.6, ohne [softly] – wie Täglich.
Die Kugel bekommt keinen Atemplan (nur „frei“), sie soll keinen Rhythmus vorgeben.
Am Ende druckt das Skript PROG_ATEM für index.html.

Aufruf: python3 tools/sitzen_bauen.py [1 3 5 7 10 15 20] [--zeichen]
--zeichen: nur zählen, wie viele Zeichen je Stimme neu vertont würden (nichts wird abgerufen).
"""
import json, math, os, subprocess, sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import runter_bauen
from runter_bauen import clip, SR, AUDIO, CACHE, STIMMEN
from sitzen_texte import S, TEXTE

runter_bauen.EL_MODELL, runter_bauen.EL_TAG, runter_bauen.EL_STABIL = "eleven_v4", "", 0.6
for _st, _voice in {"w": "hpp4J3VqNfWAUOO0d1Us", "m": "cjVigY5qzO86Huf0OWal"}.items():
    STIMMEN[_st] = ("el", _voice, STIMMEN[_st][2])

SCHLUSS_LUFT = 3.0
NAME = "sitzen"          # Ordner/Programmname – atemuhr_bauen.py setzt „atem“ und eigene Texte
# Fassung im Dateinamen: die App holt Audio cache-first, neue Töne brauchen neue Namen (index.html PROG_FASSUNG)
FASSUNG = "-1"
os.makedirs(CACHE, exist_ok=True)


def lautheit(raw):
    mess = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                           "-af", "loudnorm=I=-21:TP=-2:LRA=11:print_format=json", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    anf = mess.rindex("{")
    return float(json.loads(mess[anf:mess.index("}", anf) + 1])["input_i"])


def anordnen(stimme, minuten, marken, dehn):
    t, stuecke, teile = 0.0, [], {}
    for e in TEXTE[minuten]:
        art = e[0]
        if art == "teil":
            if e[1] in marken:
                t = max(t, marken[e[1]])
            teile[e[1]] = t
        elif art == "still":
            t += e[1] * (dehn if len(e) > 2 else 1)
        elif art == "sag":
            a = clip(stimme, S[e[1]])
            stuecke.append((t, a))
            t += len(a) / SR
    return stuecke, teile, t


def marken_fuer(minuten, dehn):
    """Gemeinsame Zeitmarken beider Stimmen (die spätere, auf halbe Sekunden aufgerundet) –
    immer von vorn berechnet, weil eine verschobene Marke alle folgenden mitschiebt."""
    marken = {}
    while True:
        erg = {s: anordnen(s, minuten, marken, dehn) for s in STIMMEN}
        neu = {n: math.ceil(max(erg[s][1][n] for s in STIMMEN) * 2) / 2 for n in erg["w"][1]}
        if neu == marken:
            return marken, max(erg[s][2] for s in STIMMEN)
        marken = neu


def bauen(minuten):
    gesamt = minuten * 60
    dehnbar = sum(e[1] for e in TEXTE[minuten] if e[0] == "still" and len(e) > 2)
    dehn = 1.0
    for _ in range(60):
        marken, ende = marken_fuer(minuten, dehn)
        luft = gesamt - SCHLUSS_LUFT - ende
        if 0 <= luft < 0.5:
            break
        dehn = max(0.3, dehn + 0.8 * luft / dehnbar)
    while ende > gesamt - SCHLUSS_LUFT:          # Rundung der Marken: notfalls minimal kürzen
        dehn -= 0.005
        marken, ende = marken_fuer(minuten, dehn)
    assert dehn >= 0.7, f"{minuten} Min: zu viel Text, dehnbare Stillen auf {dehn:.2f} geschrumpft"
    ergebnis = {}
    for s, (_, _, ziel) in STIMMEN.items():
        stuecke, teile, ende = anordnen(s, minuten, marken, dehn)
        assert ende <= gesamt - SCHLUSS_LUFT + 0.01, (s, minuten, ende)
        spur = np.zeros(int(gesamt * SR), dtype=np.float32)
        for start, a in stuecke:
            i = int(round(start * SR))
            assert i + len(a) <= len(spur), (s, minuten, start)
            spur[i:i + len(a)] += a
        raw = f"{CACHE}/{NAME}-{minuten}-{s}.f32"
        spur.tofile(raw)
        spur *= 10 ** ((-21 - lautheit(raw)) / 20)
        spur.tofile(raw)
        os.makedirs(f"{ziel}/{NAME}", exist_ok=True)
        aus = f"{ziel}/{NAME}/{minuten}{FASSUNG}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-af", "alimiter=limit=0.79:level=false:attack=5:release=50", "-t", str(gesamt),
                        "-c:a", "libmp3lame", "-b:a", "96k", aus], check=True)
        ergebnis[s] = (aus, ende)
    return [[0, "frei"]], ergebnis, dehn, marken


def zeichen(laengen):
    schluessel = {e[1] for m in laengen for e in TEXTE[m] if e[0] == "sag"}
    return sum(len(S[k]) for k in schluessel), len(schluessel)


if __name__ == "__main__":
    laengen = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(TEXTE)
    if "--zeichen" in sys.argv:
        n, saetze = zeichen(laengen)
        print(f"{saetze} Sätze, {n} Zeichen je Stimme, {2 * n} für beide (ohne Cache-Treffer)")
        sys.exit()
    plaene = {}
    for minuten in laengen:
        plan, erg, dehn, marken = bauen(minuten)
        plaene[f"sitzen-{minuten}"] = plan
        print(f"{minuten} Min: dehnbare Stillen ×{dehn:.2f}, Marken", marken)
        for s, (aus, ende) in erg.items():
            print(f"  {os.path.relpath(aus, AUDIO + '/..')}: letzter Satz endet bei {ende:.1f} s")
    print("PROG_ATEM =", json.dumps(plaene))
