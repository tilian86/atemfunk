#!/usr/bin/env python3
"""Baut audio/prog/runter-{5,10}.mp3 (+ audio/m/…) aus runter_texte.py.

Edge-TTS (kostenlos, kein Schlüssel) → jeder Satz einzeln, Stille abgeschnitten
→ auf einer Zeitleiste platziert → sekundengenau 300/600 s, −21 LUFS, mono
44,1 kHz 96 kbit/s wie die übrigen Meditationen.

Die Zeitmarken der Teile (Seufzer, ruhiges Atmen, Hören) sind für beide
Stimmen gleich: die langsamere Stimme bestimmt sie. Nur so kann die App einen
einzigen Atemplan für die Kugel haben. Am Ende druckt das Skript diesen Plan
(PROG_ATEM in index.html).

Aufruf: python3 tools/runter_bauen.py   (Cache in /tmp/runter-cache)
"""
import asyncio, hashlib, json, math, os, subprocess, sys
import numpy as np
import edge_tts

sys.path.insert(0, os.path.dirname(__file__))
from runter_texte import TEXTE, ZUEGE, SEUFZER_TAKT, RUHIG_TAKT

HIER = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HIER, "..", "audio")
CACHE = "/tmp/runter-cache"
SR = 44100
STIMMEN = {  # gleiche Stimmen wie der Rest der App (an den Hinweis-Clips nachgemessen)
    "w": ("de-DE-SeraphinaMultilingualNeural", "-15%", AUDIO + "/prog"),
    "m": ("de-DE-ConradNeural", "-20%", AUDIO + "/m/prog"),
}
TEIL_RHYTHMUS = {"ankommen": "frei", "seufzer": "seufzer", "ruhig_intro": "frei",
                 "ruhig": "ruhig", "hoeren": "frei"}
SCHLUSS_LUFT = 3.0   # so viel Stille nach dem letzten Satz, dann Gong der App

os.makedirs(CACHE, exist_ok=True)


def clip(stimme, text):
    """Satz → numpy-Array (float32, 44,1 kHz mono), Stille vorn/hinten entfernt."""
    voice, rate, _ = STIMMEN[stimme]
    h = hashlib.sha1(f"{voice}|{rate}|{text}".encode()).hexdigest()[:16]
    mp3, raw = f"{CACHE}/{h}.mp3", f"{CACHE}/{h}.f32"
    if not os.path.exists(raw):
        asyncio.run(edge_tts.Communicate(text, voice, rate=rate).save(mp3))
        trim = ("silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.04,"
                "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af", trim, "-ac", "1",
                        "-ar", str(SR), "-f", "f32le", raw], check=True)
    return np.fromfile(raw, dtype=np.float32)


def takt_laenge(takt):
    return sum(d for _, d in takt)


def anordnen(stimme, minuten, marken=None):
    """Zeitleiste: Liste (start_s, array) + Teil-Anfänge. Mit `marken` werden die
    Teile auf diese Zeitpunkte geschoben (Stille davor wird länger)."""
    t, stuecke, teile = 0.0, [], {}
    texte = TEXTE[minuten]
    letzte_stille = None
    for eintrag in texte:
        art = eintrag[0]
        if art == "teil":
            name = eintrag[1]
            if marken and name in marken:
                t = max(t, marken[name])   # früher angekommen → Stille davor
            teile[name] = t
            im_takt = name in ("seufzer", "ruhig")
            takt = SEUFZER_TAKT if name == "seufzer" else RUHIG_TAKT
            continue
        if art == "still":
            letzte_stille = (len(stuecke), eintrag[1])
            t += eintrag[1]
        elif art == "sag":
            a = clip(stimme, eintrag[1])
            if im_takt:
                # Mitten im Atemtakt: der Satz liegt über dem Ausatmen der
                # nächsten (stillen) Runde und schiebt den Takt nicht weiter.
                aus_ab = sum(d for n, d in takt if n != "Ausatmen")
                stuecke.append((t + aus_ab + 0.3, a))
                assert len(a) / SR < takt_laenge(takt) * 2, eintrag[1]
            else:
                stuecke.append((t, a))
                t += len(a) / SR
        elif art in ("seufzer", "ruhig"):
            mit, gesamt = eintrag[1], eintrag[2]
            for i in range(gesamt):
                if i < mit:
                    if art == "seufzer":
                        stuecke += [(t + 0.15, clip(stimme, ZUEGE["s_ein"])),
                                    (t + 3.85, clip(stimme, ZUEGE["s_nach"])),
                                    (t + 5.6, clip(stimme, ZUEGE["s_aus"]))]
                    else:
                        stuecke += [(t + 0.15, clip(stimme, ZUEGE["r_ein"])),
                                    (t + 4.15, clip(stimme, ZUEGE["r_aus"]))]
                t += takt_laenge(SEUFZER_TAKT if art == "seufzer" else RUHIG_TAKT)
        elif art == "rest":
            pass
    return stuecke, teile, t, letzte_stille


def bauen(minuten):
    gesamt = minuten * 60
    # 1. natürliche Zeitpunkte beider Stimmen → gemeinsame Marken (die spätere, aufgerundet)
    # Eine verschobene Marke schiebt alle folgenden mit — also wiederholen,
    # bis sich nichts mehr bewegt.
    marken = {}
    while True:
        teile = {s: anordnen(s, minuten, marken)[1] for s in STIMMEN}
        neu = {n: math.ceil(max(teile[s][n] for s in STIMMEN) * 2) / 2 for n in teile["w"]}
        if neu == marken:
            break
        marken = neu
    ergebnis = {}
    for s, (_, _, ziel) in STIMMEN.items():
        stuecke, teile, ende, _ = anordnen(s, minuten, marken)
        luft = gesamt - SCHLUSS_LUFT - ende
        assert luft >= 0, f"{minuten} Min/{s}: {-luft:.1f} s zu lang"
        # Übrige Zeit in die lange Hör-Stille legen: alles nach der Hör-Marke,
        # das nach der letzten Stille kommt, rückt um `luft` nach hinten.
        hoeren = teile["hoeren"]
        # Letzter Satz (Zurück) = das Stück mit dem spätesten Start
        letzter = max(range(len(stuecke)), key=lambda i: stuecke[i][0])
        stuecke[letzter] = (stuecke[letzter][0] + luft, stuecke[letzter][1])
        # Mischen
        spur = np.zeros(int(gesamt * SR), dtype=np.float32)
        for start, a in stuecke:
            i = int(round(start * SR))
            assert i + len(a) <= len(spur), (s, minuten, start)
            spur[i:i + len(a)] += a
        raw = f"{CACHE}/mix-{minuten}-{s}.f32"
        spur.tofile(raw)
        # Lautheit wie der Rest (−21 LUFS), zweistufig
        mess = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                               "-af", "loudnorm=I=-21:TP=-2:LRA=11:print_format=json", "-f", "null", "-"],
                              capture_output=True, text=True).stderr
        anf = mess.rindex("{")
        m = json.loads(mess[anf:mess.index("}", anf) + 1])
        ln = (f"loudnorm=I=-21:TP=-2:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
        os.makedirs(ziel, exist_ok=True)
        aus = f"{ziel}/runter-{minuten}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                        "-af", ln + f",aresample={SR}", "-t", str(gesamt), "-ac", "1", "-ar", str(SR),
                        "-c:a", "libmp3lame", "-b:a", "96k", aus], check=True)
        ergebnis[s] = (aus, luft)
    plan = [[marken[n], TEIL_RHYTHMUS[n]] for n in sorted(marken, key=marken.get)]
    return plan, ergebnis


if __name__ == "__main__":
    plaene = {}
    for minuten in (5, 10):
        plan, erg = bauen(minuten)
        plaene[f"runter-{minuten}"] = plan
        for s, (aus, luft) in erg.items():
            print(f"{os.path.relpath(aus, HIER + '/..')}: Hör-Stille +{luft:.1f} s")
    print("PROG_ATEM =", json.dumps(plaene))
