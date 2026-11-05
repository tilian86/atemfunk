#!/usr/bin/env python3
"""Baut „Gefühl im Körper spüren“ audio/prog/gefuehl/5-1.mp3 aus gefuehl_texte.py — nur Bella.

Gerüst wie notbremse_bauen.py (gleiche Kugel-Takte, −21 LUFS); die Restzeit geht in die Stille
beim Verweilen an der Stelle („Bleib noch eine Weile …“). Am Ende druckt das Skript PROG_ATEM.

Aufruf: python3 tools/gefuehl_bauen.py
"""
import json, math, os, subprocess, sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import sitzen_bauen as sb          # setzt v4/Bella/0.6 und bringt lautheit()
import runter_bauen as rb
from runter_texte import ZUEGE, SEUFZER_TAKT, RUHIG_TAKT
from gefuehl_texte import S

del sb.STIMMEN["m"]                # Bella, Zen, Ela, Elion (ohne Eric, seit Version 69)
NAME, FASSUNG = "gefuehl", "-2"    # index.html PROG_FASSUNG.gefuehl
D = "dehnbar"

ABLAUF = [
    ("teil", "ankommen"), ("still", 1), ("sag", "g1"), ("still", 3), ("sag", "g2"), ("still", 1),
    ("teil", "ruhig"), ("ruhig", 0, 3),
    ("teil", "spueren"), ("sag", "g3"), ("still", 6), ("sag", "g4"), ("still", 15),
    ("sag", "g5"), ("still", 9), ("sag", "g6"), ("still", 9), ("sag", "g7"), ("still", 6),
    ("sag", "g8"), ("still", 18), ("sag", "g9"), ("still", 10), ("sag", "g10"), ("still", 12),
    ("sag", "g11"), ("still", 0, D),
    ("sag", "g12"), ("still", 8), ("sag", "g13"),
]
RHYTHMUS = {"ruhig": "ruhig"}   # alle anderen Teile: frei


def anordnen(stimme, rest=0.0, mind=None):
    t, stuecke, teile, takt = 0.0, [], {}, None
    for e in ABLAUF:
        art = e[0]
        if art == "teil":
            t = math.ceil(t * 2) / 2           # Takt-Teile beginnen auf halben Sekunden (Atemplan der App)
            if mind:                           # gemeinsame Marken aller Stimmen (die langsamste gibt den Takt vor)
                t = max(t, mind[e[1]])
            teile[e[1]] = t
            takt = {"seufzer": SEUFZER_TAKT, "ruhig": RUHIG_TAKT}.get(e[1])
        elif art == "still":
            t += rest if len(e) > 2 else e[1]
        elif art == "sag":
            a = rb.clip(stimme, S[e[1]])
            if takt:                           # liegt über dem Ausatmen der nächsten, stillen Runde
                aus_ab = sum(d for n, d in takt if n != "Ausatmen")
                stuecke.append((t + aus_ab + 0.3, a))
            else:
                stuecke.append((t, a))
                t += len(a) / rb.SR
        elif art in ("seufzer", "ruhig"):
            mit, gesamt = e[1], e[2]
            for i in range(gesamt):
                if i < mit:
                    if art == "seufzer":
                        stuecke += [(t + 0.15, rb.clip(stimme, ZUEGE["s_ein"])), (t + 3.85, rb.clip(stimme, ZUEGE["s_nach"])),
                                    (t + 5.6, rb.clip(stimme, ZUEGE["s_aus"]))]
                    else:
                        stuecke += [(t + 0.15, rb.clip(stimme, ZUEGE["r_ein"])), (t + 4.15, rb.clip(stimme, ZUEGE["r_aus"]))]
                t += rb.takt_laenge(SEUFZER_TAKT if art == "seufzer" else RUHIG_TAKT)
    return stuecke, teile, t


def bauen(minuten=5):
    gesamt = minuten * 60
    stimmen = list(sb.STIMMEN)
    mind = None
    for _ in range(8):                         # Marken angleichen, bis sie sich nicht mehr ändern
        erg = {s: anordnen(s, 0.0, mind) for s in stimmen}
        neu = {n: max(erg[s][1][n] for s in stimmen) for n in erg[stimmen[0]][1]}
        if neu == mind:
            break
        mind = neu
    ende = max(erg[s][2] for s in stimmen)
    rest = gesamt - sb.SCHLUSS_LUFT - ende
    assert rest >= 4, f"zu viel Text: nur {rest:.1f} s Stille beim Verweilen"
    for s in stimmen:
        stuecke, teile, ende_s = anordnen(s, rest, mind)
        spur = np.zeros(int(gesamt * rb.SR), dtype=np.float32)
        for start, a in stuecke:
            i = int(round(start * rb.SR))
            assert i + len(a) <= len(spur), (s, start)
            spur[i:i + len(a)] += a
        raw = f"{rb.CACHE}/{NAME}-{minuten}-{s}.f32"
        spur.tofile(raw)
        spur *= 10 ** ((-21 - sb.lautheit(raw)) / 20)
        spur.tofile(raw)
        ziel = sb.STIMMEN[s][2] + "/" + NAME
        os.makedirs(ziel, exist_ok=True)
        datei = f"{ziel}/{minuten}{FASSUNG}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(rb.SR), "-ac", "1", "-i", raw,
                        "-af", "alimiter=limit=0.79:level=false:attack=5:release=50", "-t", str(gesamt),
                        "-c:a", "libmp3lame", "-b:a", "96k", datei], check=True)
        print(f"  {os.path.relpath(datei, rb.AUDIO + '/..')}: letzter Satz endet bei {ende_s:.1f} s")
        if s == "w":
            aus = datei
    plan = []
    for name in sorted(mind, key=mind.get):
        r = RHYTHMUS.get(name, "frei")
        if not plan or plan[-1][1] != r:
            plan.append([mind[name], r])
    return plan, aus, rest, ende


if __name__ == "__main__":
    plan, aus, rest, ende = bauen()
    print(f"{os.path.relpath(aus, rb.AUDIO + '/..')}: Stille beim Verweilen {rest:.1f} s, letzter Satz endet bei {ende:.1f} s")
    print("PROG_ATEM =", json.dumps({f"{NAME}-5": plan}))
