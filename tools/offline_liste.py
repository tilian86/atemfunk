#!/usr/bin/env python3
"""Schreibt offline.json: alle Dateien, die die App gerade braucht, mit Größe (Version 69, Florian 05.11.2026:
„auf einen Knopf drücken und dann wird alles offline geladen, auch alle Stimmen“). Der Knopf in index.html
(offlineLaden) holt jede fehlende Datei in den Cache „atemfunk-offline“, den sw.js bei Versionswechseln behält.

Drin: nur Audio (Seiten und Code cacht sw.js bei jeder Version selbst) – Klangschale, Klangkulissen, und für Bella, Zen, Ela, Elion nur die aktuelle Fassung
jeder Meditation (PROG_FASSUNG aus index.html) plus Abschluss, Signale, Nach Wahl, Fragen, Kraftatmung.
Nicht drin: Eric (audio/m, seit Version 69 nicht mehr wählbar) und alte Fassungen.

Nach jedem Neubau von Audio aufrufen: python3 tools/offline_liste.py
"""
import json, os, re

WURZEL = os.path.join(os.path.dirname(__file__), "..")
os.chdir(WURZEL)
html = open("index.html").read()
fassung = dict(re.findall(r'(\w+): "(-\d+)"', re.search(r"const PROG_FASSUNG = \{([^}]*)\}", html).group(1)))

dateien = set()   # Seiten und Code nicht: die legt sw.js bei jeder Version frisch ab, eine alte Kopie hier würde sie offline überdecken
for f in os.listdir("audio/atmo"):
    dateien.add("audio/atmo/" + f)
for stimme in ["audio/", "audio/v/zen/", "audio/v/ela/", "audio/v/elion/"]:
    for art, fs in fassung.items():
        ordner = stimme + "prog/" + art
        if not os.path.isdir(ordner):
            continue
        for f in os.listdir(ordner):
            if re.fullmatch(r"\d+[bc]?" + re.escape(fs) + r"\.mp3", f):
                dateien.add(ordner + "/" + f)
    for teil in ["abschluss3", "cues2", "flex2", "fragen2", "kraft"]:
        for wurzel, _, fs in os.walk(stimme + teil):
            for f in fs:
                if f.endswith(".mp3"):
                    dateien.add(os.path.join(wurzel, f))

liste = sorted([d, os.path.getsize(d)] for d in dateien if os.path.isfile(d))
fehlt = sorted(d for d in dateien if not os.path.isfile(d))
gesamt = sum(g for _, g in liste)
json.dump({"stand": __import__("time").strftime("%Y-%m-%d %H:%M"), "gesamt": gesamt, "dateien": liste},
          open("offline.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(f"offline.json: {len(liste)} Dateien, {gesamt / 1e6:.0f} MB")
if fehlt:
    print("fehlt:", fehlt)
