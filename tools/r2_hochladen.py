#!/usr/bin/env python3
"""Lädt die Audios aus offline.json nach R2 (Bucket atemfunk-media, Schlüssel app/<pfad>), seit Version 71
(Audio liegt nicht mehr im Git-Repo, sondern hinter https://atemfunk-media.florian-s-thiel.workers.dev/audio/…).
Nur fehlende oder in der Größe abweichende Dateien – die Liste des Buckets steht in tools/.r2_stand.json.

Aufruf nach jedem Audio-Neubau:  python3 tools/offline_liste.py && python3 tools/r2_hochladen.py [--alle]
Braucht wrangler (PATH ~/.local/node/bin) mit Cloudflare-Anmeldung.
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

os.chdir(os.path.join(os.path.dirname(__file__), ".."))
STAND = "tools/.r2_stand.json"
env = dict(os.environ, PATH=os.path.expanduser("~/.local/node/bin") + ":" + os.environ["PATH"])
stand = {} if "--alle" in sys.argv or not os.path.exists(STAND) else json.load(open(STAND))
dateien = [(p, g) for p, g in json.load(open("offline.json"))["dateien"] if stand.get(p) != g]
print(len(dateien), "Dateien hochzuladen")


def hoch(eintrag):
    pfad, groesse = eintrag
    for _ in range(3):   # Cloudflare bremst bei vielen gleichzeitigen Uploads – dann nochmal
        r = subprocess.run(["wrangler", "r2", "object", "put", "atemfunk-media/app/" + pfad, "--file", pfad,
                            "--content-type", "audio/mpeg", "--cache-control", "public, max-age=2592000", "--remote"],
                           capture_output=True, text=True, env=env)
        if r.returncode == 0:
            break
    return pfad, groesse, r.returncode == 0


fehler = 0
with ThreadPoolExecutor(5) as ex:
    for n, (pfad, groesse, ok) in enumerate(ex.map(hoch, dateien), 1):
        if ok:
            stand[pfad] = groesse
        else:
            fehler += 1
            print("FEHLER", pfad, flush=True)
        if n % 50 == 0:
            json.dump(stand, open(STAND, "w"))
            print(n, "fertig", flush=True)
json.dump(stand, open(STAND, "w"))
print("fertig,", fehler, "Fehler")
