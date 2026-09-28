#!/usr/bin/env python3
"""Baut audio/prog/innehalten-{3,5,10,15}.mp3 (+ audio/m/…) aus innehalten_texte.py:
Sätze einzeln aus ElevenLabs v3 (Sarah/Brian, Cache /tmp/runter-cache), auf einer
Zeitleiste angeordnet, dehnbare Stillen nehmen die Restzeit auf, Stimme auf −21 LUFS,
darunter die Waldkulisse (audio/atmo/wald.mp3, geloopt) auf −32 LUFS — so laut wie
die Kulisse in der App bei Standardlautstärke. Die App schaltet ihre eigene Kulisse
während dieser Programme ab.

Zeitmarken („teil") sind für beide Stimmen gleich (die langsamere bestimmt), damit die
Kugel einen Atemplan hat. Am Ende druckt das Skript PROG_ATEM für index.html.

Aufruf: python3 tools/innehalten_bauen.py [3 5 10 15] [--grok]
--grok: Grok-Stimmen (orion/celeste, api.x.ai, Schlüssel aus PageVoice) statt ElevenLabs —
so wurden 10 und 15 Min gebaut, als die ElevenLabs-Gratisschlüssel leer waren (28.09.2026).
"""
import json, math, os, subprocess, sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from runter_bauen import clip, SR, AUDIO, CACHE, STIMMEN
from innehalten_texte import S, TEXTE, ZUEGE

GROK_STIMMEN = {"w": "celeste", "m": "orion"}   # Florians Hörprobe 30.08.2026
SCHLUSS_LUFT = 3.0
TAKT = 10.0                      # 4 ein · 6 aus
KULISSE, KULISSE_LUFS = AUDIO + "/atmo/wald.mp3", -32
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
        elif art == "takt":
            mit, gesamt = e[1], e[2]
            for i in range(gesamt):
                if i < mit:
                    stuecke += [(t + 0.15, clip(stimme, ZUEGE["r_ein"])),
                                (t + 4.15, clip(stimme, ZUEGE["r_aus"]))]
                t += TAKT
    return stuecke, teile, t


def kulisse(gesamt):
    raw = f"{CACHE}/kulisse-{int(gesamt)}.f32"
    if not os.path.exists(raw):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-stream_loop", "-1", "-i", KULISSE, "-t", str(gesamt),
                        "-af", f"loudnorm=I={KULISSE_LUFS}:TP=-8:LRA=11,afade=t=in:st=0:d=4,afade=t=out:st={gesamt - 6}:d=6",
                        "-ac", "1", "-ar", str(SR), "-f", "f32le", raw], check=True)
    a = np.fromfile(raw, dtype=np.float32)
    n = int(gesamt * SR)
    return np.pad(a[:n], (0, max(0, n - len(a))))


def marken_fuer(minuten, dehn):
    """Gemeinsame Zeitmarken beider Stimmen (die spätere, auf halbe Sekunden aufgerundet)
    für eine gegebene Dehnung – immer von vorn berechnet, weil eine verschobene Marke
    alle folgenden mitschiebt."""
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
    bett = kulisse(gesamt)
    ergebnis = {}
    for s, (_, _, ziel) in STIMMEN.items():
        stuecke, teile, ende = anordnen(s, minuten, marken, dehn)
        assert ende <= gesamt - SCHLUSS_LUFT + 0.01, (s, minuten, ende)
        spur = np.zeros(int(gesamt * SR), dtype=np.float32)
        for start, a in stuecke:
            i = int(round(start * SR))
            assert i + len(a) <= len(spur), (s, minuten, start)
            spur[i:i + len(a)] += a
        raw = f"{CACHE}/inne-{minuten}-{s}.f32"
        spur.tofile(raw)
        spur *= 10 ** ((-21 - lautheit(raw)) / 20)
        mix = spur + bett
        raw = f"{CACHE}/inne-mix-{minuten}-{s}.f32"
        mix.astype(np.float32).tofile(raw)
        os.makedirs(ziel, exist_ok=True)
        aus = f"{ziel}/innehalten-{minuten}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-af", "alimiter=limit=0.79:level=false:attack=5:release=50", "-t", str(gesamt),
                        "-c:a", "libmp3lame", "-b:a", "96k", aus], check=True)
        ergebnis[s] = (aus, ende)
    plan = [[0, "frei"], [marken["takt"], "ruhig"], [marken["takt_ende"], "frei"]]
    return plan, ergebnis, dehn, marken


if __name__ == "__main__":
    if "--grok" in sys.argv:
        for st, voice in GROK_STIMMEN.items():
            STIMMEN[st] = ("grok", voice, STIMMEN[st][2])
    laengen = [int(a) for a in sys.argv[1:] if a.isdigit()] or [3, 5, 10, 15]
    plaene = {}
    for minuten in laengen:
        plan, erg, dehn, marken = bauen(minuten)
        plaene[f"innehalten-{minuten}"] = plan
        print(f"{minuten} Min: dehnbare Stillen ×{dehn:.2f}, Marken", {k: v for k, v in marken.items()})
        for s, (aus, ende) in erg.items():
            print(f"  {os.path.relpath(aus, AUDIO + '/..')}: letzter Satz endet bei {ende:.1f} s")
    print("PROG_ATEM =", json.dumps(plaene))
