#!/usr/bin/env python3
"""Gerüst für die neuen Programme (Bella, Zen, Ela, Elion) mit mehreren Längen und Atemrunden — Einschlafen, Morgen,
Körper-Check (05.11.2026). Wie taeglich_bauen.py, aber nur eine Stimme und ohne Grundeinstellung in
den Bau-Skripten: schlafen_bauen.py, staerken_bauen.py, morgen_bauen.py und checkin_bauen.py setzen S, ZUEGE, TEXTE, NAME
und rufen bauen() auf (so wie zen_bauen.py sitzen_bauen.py nutzt).

Einträge in TEXTE[minuten]:
  ("teil", name)              Zeitmarke, auf halbe Sekunden aufgerundet (Atemplan der App). Teile, die mit
                              seufzer/takt/wach beginnen, geben der Kugel den Rhythmus vor (RHYTHMUS),
                              alle anderen (auch …_ende) sind „frei“.
  ("still", s) / ("still", s, "dehnbar")   dehnbare Stillen nehmen die Restzeit auf
  ("sag", schlüssel) / ("sag", schlüssel, faktor)   faktor < 1 = leiser (Einschlafen wird zum Ende hin leiser;
                              die Lautheit −21 LUFS wird ohne diese Absenkung gemessen)
  ("seufzer"|"takt"|"wach", n_mit_stimme, n_runden)   Atemrunden; ein ("sag", …) zwischen zwei Atemrunden
                              liegt über dem Ausatmen der letzten angesagten Runde und schiebt den Takt nicht.

Aufruf über die Bau-Skripte, z. B. python3 tools/schlafen_bauen.py [10 20] [--zeichen] [--schaetzen]
--zeichen:   nur zählen, wie viele Zeichen neu vertont würden (Cache-Treffer zählen nicht, nichts wird abgerufen)
--schaetzen: Zeitplan mit geschätzten Satzlängen (13,5 Zeichen/s) durchrechnen, nichts abrufen
--stimmen w,zen,ela,eli: nur diese Stimmen (Standard: alle aus runter_bauen.STIMMEN außer Eric „m“).
             Die Zeitmarken (Atemplan) sind für alle Stimmen gleich, die langsamste bestimmt sie.
"""
import json, math, os, subprocess, sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import sitzen_bauen as sb          # setzt v4/Bella/0.6 und bringt lautheit()
import runter_bauen as rb

# Alle Stimmen aus runter_bauen.STIMMEN außer Eric (wie zen/gehen seit Version 69: Bella, Zen, Ela, Elion);
# --stimmen schränkt ein, z. B. für tts_pruefen.py --nur eli --stimmen eli
_wahl = sys.argv[sys.argv.index("--stimmen") + 1].split(",") if "--stimmen" in sys.argv else [s for s in sb.STIMMEN if s != "m"]
for _st in list(sb.STIMMEN):
    if _st not in _wahl:
        del sb.STIMMEN[_st]

S, ZUEGE, TEXTE, NAME = {}, {}, {}, ""
FASSUNG = "-1"                     # index.html PROG_FASSUNG.<NAME>
SCHLUSS_LUFT = 3.0                 # Stille nach dem Ende des Ablaufs (Einschlafen hat seine Stille im Ablauf)
D = "dehnbar"
TAKTE = {                          # Phasen (ein, [nachfassen,] aus) und Ansagen (Zeitpunkt in der Runde, ZUEGE-Schlüssel)
    "seufzer": ((4.0, 1.5, 8.0), [(0.15, "s_ein"), (3.85, "s_nach"), (5.6, "s_aus")]),
    "takt":    ((4.0, 6.0),      [(0.15, "r_ein"), (4.15, "r_aus")]),
    "wach":    ((4.0, 4.0),      [(0.15, "w_ein"), (4.15, "w_aus")]),
}
RHYTHMUS = {"seufzer": "seufzer", "takt": "ruhig", "wach": "wach"}   # Rhythmus-Name in index.html RHYTHMS
ZEICHEN_JE_S = 13.5                # Bella v4, gemessen an Täglich
SCHAETZEN = False


def clip(stimme, text):
    if SCHAETZEN and not os.path.exists(rb.clip_pfad(stimme, text) + ".mp3"):
        return np.zeros(int(len(text) / ZEICHEN_JE_S * rb.SR), dtype=np.float32)
    return rb.clip(stimme, text)


def rhythmus(teil):
    if teil.endswith("_ende"):
        return "frei"
    return next((r for p, r in RHYTHMUS.items() if teil.startswith(p)), "frei")


def anordnen(stimme, minuten, marken, dehn):
    t, stuecke, teile = 0.0, [], {}
    im_atem, runde = False, None   # runde: (start, ende, ende der letzten Ansage) der letzten angesagten Runde
    for e in TEXTE[minuten]:
        art = e[0]
        if art == "teil":
            t = max(math.ceil(t * 2) / 2, marken.get(e[1], 0))
            teile[e[1]] = t
            im_atem, runde = rhythmus(e[1]) != "frei", None
        elif art == "still":
            t += e[1] * (dehn if len(e) > 2 else 1)
        elif art == "sag":
            a, faktor = clip(stimme, S[e[1]]), (e[2] if len(e) > 2 else 1.0)
            if im_atem:
                assert runde, f"{minuten} Min: Satz {e[1]} braucht eine angesagte Runde davor"
                # 0,7 s nach der letzten Ansage; wird es eng (Zen/Ela sprechen langsamer), rückt er bis 0,3 s heran
                start = min(runde[2] + 0.7, runde[1] - 0.4 - len(a) / rb.SR)
                assert start >= runde[2] + 0.3, f"{minuten} Min, {stimme}: {e[1]} passt nicht ins Ausatmen"
                stuecke.append((start, a, faktor))
            else:
                stuecke.append((t, a, faktor))
                t += len(a) / rb.SR
        elif art in TAKTE:
            phasen, ansagen = TAKTE[art]
            mit, gesamt = e[1], e[2]
            for i in range(gesamt):
                if i < mit:
                    for ab, k in ansagen:
                        a = clip(stimme, ZUEGE[k])
                        stuecke.append((t + ab, a, 1.0))
                    runde = (t, t + sum(phasen), t + ansagen[-1][0] + len(a) / rb.SR)
                t += sum(phasen)
    return stuecke, teile, t


def marken_fuer(minuten, dehn):
    """Gemeinsame Zeitmarken aller Stimmen (die spätere) – immer von vorn, eine verschobene Marke schiebt alle folgenden."""
    marken = {}
    while True:
        erg = {s: anordnen(s, minuten, marken, dehn) for s in sb.STIMMEN}
        neu = {n: max(erg[s][1][n] for s in sb.STIMMEN) for n in erg["w"][1]}
        if neu == marken:
            return marken, max(erg[s][2] for s in sb.STIMMEN)
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
    plan = []
    for name in sorted(marken, key=marken.get):
        r = rhythmus(name)
        if not plan or plan[-1][1] != r:
            plan.append([marken[name], r])
    if SCHAETZEN:
        return plan, {}, dehn
    ergebnis = {}
    for st, (_, _, ziel) in sb.STIMMEN.items():
        stuecke, _, ende = anordnen(st, minuten, marken, dehn)
        assert ende <= gesamt - SCHLUSS_LUFT + 0.01, (st, minuten, ende)
        spur = np.zeros(int(gesamt * rb.SR), dtype=np.float32)
        leiser = np.zeros_like(spur)             # nur die Absenkung, damit die Lautheit ohne sie gemessen wird
        for start, a, faktor in stuecke:
            i = int(round(start * rb.SR))
            assert i + len(a) <= len(spur), (st, minuten, start)
            spur[i:i + len(a)] += a
            leiser[i:i + len(a)] += a * (faktor - 1)
        raw = f"{rb.CACHE}/{NAME}-{minuten}-{st}.f32"
        spur.tofile(raw)
        spur = (spur + leiser) * 10 ** ((-21 - sb.lautheit(raw)) / 20)
        spur.astype(np.float32).tofile(raw)
        os.makedirs(f"{ziel}/{NAME}", exist_ok=True)
        aus = f"{ziel}/{NAME}/{minuten}{FASSUNG}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(rb.SR), "-ac", "1", "-i", raw,
                        "-af", "alimiter=limit=0.79:level=false:attack=5:release=50", "-t", str(gesamt),
                        "-c:a", "libmp3lame", "-b:a", "96k", aus], check=True)
        ergebnis[st] = (aus, ende)
    return plan, ergebnis, dehn


def zeichen(laengen):
    texte = {S[e[1]] for m in laengen for e in TEXTE[m] if e[0] == "sag"}
    texte |= {ZUEGE[k] for m in laengen for e in TEXTE[m] if e[0] in TAKTE and e[1] for _, k in TAKTE[e[0]][1]}
    neu = [t for st in sb.STIMMEN for t in texte if not os.path.exists(rb.clip_pfad(st, t) + ".mp3")]
    return sum(map(len, neu)), len(neu), len(texte)


def main():
    global SCHAETZEN
    laengen = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(TEXTE)
    if "--zeichen" in sys.argv:
        n, neu, alle = zeichen(laengen)
        print(f"{alle} Sätze je Stimme ({', '.join(sb.STIMMEN)}), {neu} neu zu vertonen: {n} Zeichen")
        return
    SCHAETZEN = "--schaetzen" in sys.argv
    plaene = {}
    for minuten in laengen:
        plan, erg, dehn = bauen(minuten)
        plaene[f"{NAME}-{minuten}"] = plan
        print(f"{minuten} Min: dehnbare Stillen ×{dehn:.2f}" + (" (geschätzt)" if SCHAETZEN else ""))
        for st, (aus, ende) in erg.items():
            print(f"  {os.path.relpath(aus, rb.AUDIO + '/..')}: Ablauf endet bei {ende:.1f} s")
    print("PROG_ATEM =", json.dumps(plaene))
