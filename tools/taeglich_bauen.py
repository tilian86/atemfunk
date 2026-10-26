#!/usr/bin/env python3
"""Baut audio/prog/taeglich/{3,5,7,10}.mp3 (+ audio/m/…) aus taeglich_texte.py — wie
innehalten_bauen.py: Sätze einzeln vertont (Cache ~/.cache/atemfunk-tts), auf einer Zeitleiste
angeordnet, dehnbare Stillen nehmen die Restzeit auf, Stimme −21 LUFS, darunter die
Waldkulisse −40 LUFS. Neu gegenüber Innehalten: Seufzer-Runden (4 · 1,5 · 8) vor dem
4 · 6-Takt, und Übergangssätze mitten im Atemtakt („Allein weiter …“), die über dem
Ausatmen der letzten angesagten Runde liegen und den Takt nicht verschieben.

Stimmen: Grok celeste (w) / orion (m) wie bei Innehalten — ElevenLabs-Kontingent bis 23.10. leer.
Am Ende druckt das Skript PROG_ATEM für index.html.

Aufruf: python3 tools/taeglich_bauen.py [3 5 7 10]
"""
import json, math, os, subprocess, sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from runter_bauen import clip, SR, AUDIO, CACHE, STIMMEN
from taeglich_texte import S, TEXTE, ZUEGE

GROK_STIMMEN = {"w": "celeste", "m": "orion"}   # Florians Hörprobe 30.08.2026
for _st, _voice in GROK_STIMMEN.items():
    STIMMEN[_st] = ("grok", _voice, STIMMEN[_st][2])

SCHLUSS_LUFT = 3.0
SEUFZER = (4.0, 1.5, 8.0)        # ein · nachfassen · aus
TAKT = (4.0, 6.0)                # ein · aus
KULISSE, KULISSE_LUFS = AUDIO + "/atmo/wald.mp3", -40   # bis 26.10.2026 −32, Florian zu laut
# Fassung im Dateinamen: die App holt Audio cache-first, neue Töne brauchen neue Namen (index.html PROG_FASSUNG)
FASSUNG = "-2"
os.makedirs(CACHE, exist_ok=True)


def lautheit(raw):
    mess = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                           "-af", "loudnorm=I=-21:TP=-2:LRA=11:print_format=json", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    anf = mess.rindex("{")
    return float(json.loads(mess[anf:mess.index("}", anf) + 1])["input_i"])


def anordnen(stimme, minuten, marken, dehn):
    t, stuecke, teile = 0.0, [], {}
    im_atem = False
    runde = None                   # (start, ende, ende der letzten Ansage) der letzten angesagten Runde
    for e in TEXTE[minuten]:
        art = e[0]
        if art == "teil":
            if e[1] in marken:
                t = max(t, marken[e[1]])
            teile[e[1]] = t
            im_atem = e[1] in ("seufzer", "takt")
            runde = None
        elif art == "still":
            t += e[1] * (dehn if len(e) > 2 else 1)
        elif art == "sag":
            a = clip(stimme, S[e[1]])
            if im_atem:
                # Übergang im Takt: nach der letzten Ansage ins Ausatmen, Takt läuft weiter
                assert runde, f"{minuten} Min: Satz {e[1]} braucht eine angesagte Runde davor"
                start = runde[2] + 0.7
                assert start + len(a) / SR <= runde[1] - 0.4, f"{minuten} Min: {e[1]} passt nicht ins Ausatmen"
                stuecke.append((start, a))
            else:
                stuecke.append((t, a))
                t += len(a) / SR
        elif art in ("seufzer", "takt"):
            mit, gesamt = e[1], e[2]
            dauer = sum(SEUFZER if art == "seufzer" else TAKT)
            for i in range(gesamt):
                if i < mit:
                    if art == "seufzer":
                        ans = [(t + 0.15, "s_ein"), (t + 3.85, "s_nach"), (t + 5.6, "s_aus")]
                    else:
                        ans = [(t + 0.15, "r_ein"), (t + 4.15, "r_aus")]
                    for start, k in ans:
                        a = clip(stimme, ZUEGE[k])
                        stuecke.append((start, a))
                    runde = (t, t + dauer, ans[-1][0] + len(a) / SR)
                t += dauer
    return stuecke, teile, t


def kulisse(gesamt):
    raw = f"{CACHE}/kulisse{KULISSE_LUFS}-{int(gesamt)}.f32"
    if not os.path.exists(raw):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-stream_loop", "-1", "-i", KULISSE, "-t", str(gesamt),
                        "-af", f"loudnorm=I={KULISSE_LUFS}:TP=-8:LRA=11,afade=t=in:st=0:d=4,afade=t=out:st={gesamt - 6}:d=6",
                        "-ac", "1", "-ar", str(SR), "-f", "f32le", raw], check=True)
    a = np.fromfile(raw, dtype=np.float32)
    n = int(gesamt * SR)
    return np.pad(a[:n], (0, max(0, n - len(a))))


def marken_fuer(minuten, dehn):
    """Gemeinsame Zeitmarken beider Stimmen (die spätere, auf halbe Sekunden aufgerundet)."""
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
    while ende > gesamt - SCHLUSS_LUFT:
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
        raw = f"{CACHE}/taeglich-{minuten}-{s}.f32"
        spur.tofile(raw)
        spur *= 10 ** ((-21 - lautheit(raw)) / 20)
        mix = spur + bett
        raw = f"{CACHE}/taeglich-mix-{minuten}-{s}.f32"
        mix.astype(np.float32).tofile(raw)
        os.makedirs(f"{ziel}/taeglich", exist_ok=True)
        aus = f"{ziel}/taeglich/{minuten}{FASSUNG}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-af", "alimiter=limit=0.79:level=false:attack=5:release=50", "-t", str(gesamt),
                        "-c:a", "libmp3lame", "-b:a", "96k", aus], check=True)
        ergebnis[s] = (aus, ende)
    plan = [[0, "frei"]]
    for an, aus, rhythmus in (("seufzer", "seufzer_ende", "seufzer"), ("takt", "takt_ende", "ruhig")):
        if an in marken:
            plan += [[marken[an], rhythmus], [marken[aus], "frei"]]
    return plan, ergebnis, dehn, marken


if __name__ == "__main__":
    laengen = [int(a) for a in sys.argv[1:] if a.isdigit()] or [3, 5, 7, 10]
    plaene = {}
    for minuten in laengen:
        plan, erg, dehn, marken = bauen(minuten)
        plaene[f"taeglich-{minuten}"] = plan
        print(f"{minuten} Min: dehnbare Stillen ×{dehn:.2f}, Marken", marken)
        for s, (aus, ende) in erg.items():
            print(f"  {os.path.relpath(aus, AUDIO + '/..')}: letzter Satz endet bei {ende:.1f} s")
    print("PROG_ATEM =", json.dumps(plaene))
