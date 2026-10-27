#!/usr/bin/env python3
"""Baut die „Notbremse“ audio/prog/notbremse/3-1.mp3 aus notbremse_texte.py — nur Bella (wie Zazen/Gehen).

Wie Runterkommen mit Atemtakt für die Kugel: Seufzer- und Ruhig-Runden beginnen auf halben Sekunden,
die Zählwörter sind die von Runterkommen (runter_texte.ZUEGE). Die Restzeit geht in die Stille nach
der Frage „Wo stehst du jetzt …“. −21 LUFS wie alles andere. Am Ende druckt das Skript PROG_ATEM.

Aufruf: python3 tools/notbremse_bauen.py
"""
import json, math, os, subprocess, sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import sitzen_bauen as sb          # setzt v4/Bella/0.6 und bringt lautheit()
import runter_bauen as rb
from runter_texte import ZUEGE, SEUFZER_TAKT, RUHIG_TAKT
from notbremse_texte import S

del sb.STIMMEN["m"]                # nur Bella
NAME, FASSUNG = "notbremse", "-1"  # index.html PROG_FASSUNG.notbremse (panik_bauen.py setzt eigene)
D = "dehnbar"

ABLAUF = [
    ("teil", "ankommen"), ("still", 1), ("sag", "n1"), ("still", 1.5),
    ("teil", "druecken"),
    ("sag", "n2"), ("still", 5), ("sag", "n3"), ("still", 3),
    ("sag", "n4"), ("still", 5), ("sag", "n3"), ("still", 3),
    ("teil", "seufzer_intro"), ("sag", "n5"), ("still", 1),
    ("teil", "seufzer"), ("seufzer", 3, 3), ("sag", "n6"), ("seufzer", 0, 2),
    ("teil", "benennen"), ("sag", "n7"), ("still", 5),
    ("teil", "ruhig_intro"), ("sag", "n8"), ("still", 1),
    ("teil", "ruhig"), ("ruhig", 2, 2),
    ("teil", "check"), ("sag", "n9"), ("still", 0, D), ("sag", "n10"),
]
RHYTHMUS = {"seufzer": "seufzer", "ruhig": "ruhig"}   # alle anderen Teile: frei


def anordnen(rest=0.0):
    t, stuecke, teile, takt = 0.0, [], {}, None
    for e in ABLAUF:
        art = e[0]
        if art == "teil":
            t = math.ceil(t * 2) / 2           # Takt-Teile beginnen auf halben Sekunden (Atemplan der App)
            teile[e[1]] = t
            takt = {"seufzer": SEUFZER_TAKT, "ruhig": RUHIG_TAKT}.get(e[1])
        elif art == "still":
            t += rest if len(e) > 2 else e[1]
        elif art == "sag":
            a = rb.clip("w", S[e[1]])
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
                        stuecke += [(t + 0.15, rb.clip("w", ZUEGE["s_ein"])), (t + 3.85, rb.clip("w", ZUEGE["s_nach"])),
                                    (t + 5.6, rb.clip("w", ZUEGE["s_aus"]))]
                    else:
                        stuecke += [(t + 0.15, rb.clip("w", ZUEGE["r_ein"])), (t + 4.15, rb.clip("w", ZUEGE["r_aus"]))]
                t += rb.takt_laenge(SEUFZER_TAKT if art == "seufzer" else RUHIG_TAKT)
    return stuecke, teile, t


def bauen(minuten=3):
    gesamt = minuten * 60
    _, _, ende = anordnen()
    rest = gesamt - sb.SCHLUSS_LUFT - ende
    assert rest >= 4, f"zu viel Text: nur {rest:.1f} s Stille nach der Frage"
    stuecke, teile, ende = anordnen(rest)
    spur = np.zeros(int(gesamt * rb.SR), dtype=np.float32)
    for start, a in stuecke:
        i = int(round(start * rb.SR))
        assert i + len(a) <= len(spur), start
        spur[i:i + len(a)] += a
    raw = f"{rb.CACHE}/{NAME}-{minuten}-w.f32"
    spur.tofile(raw)
    spur *= 10 ** ((-21 - sb.lautheit(raw)) / 20)
    spur.tofile(raw)
    ziel = sb.STIMMEN["w"][2] + "/" + NAME
    os.makedirs(ziel, exist_ok=True)
    aus = f"{ziel}/{minuten}{FASSUNG}.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(rb.SR), "-ac", "1", "-i", raw,
                    "-af", "alimiter=limit=0.79:level=false:attack=5:release=50", "-t", str(gesamt),
                    "-c:a", "libmp3lame", "-b:a", "96k", aus], check=True)
    plan = []
    for name in sorted(teile, key=teile.get):
        r = RHYTHMUS.get(name, "frei")
        if not plan or plan[-1][1] != r:
            plan.append([teile[name], r])
    return plan, aus, rest, ende


if __name__ == "__main__":
    plan, aus, rest, ende = bauen()
    print(f"{os.path.relpath(aus, rb.AUDIO + '/..')}: Stille nach der Frage {rest:.1f} s, letzter Satz endet bei {ende:.1f} s")
    print("PROG_ATEM =", json.dumps({f"{NAME}-3": plan}))
