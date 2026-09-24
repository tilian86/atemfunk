#!/usr/bin/env python3
"""Baut audio/prog/runterkommen-{5,10}.mp3 (+ audio/m/…) aus runter_texte.py.

ElevenLabs v3 (Gratis-Schlüssel aus ~/.klarkreis/keys.txt, rotiert bei
Sperre/leerem Kontingent) oder Grok (Schlüssel aus den PageVoice-Einstellungen)
→ jeder Satz einzeln, Stille abgeschnitten → auf einer Zeitleiste platziert →
sekundengenau 300/600 s, −21 LUFS, mono 44,1 kHz 96 kbit/s wie die übrigen
Meditationen. Edge-TTS klang Florian zu künstlich (24.09.2026).

Gratis-Konten dürfen über die API nur die Standardstimmen nutzen, keine aus
der Bibliothek und kein Voice Design (402/403).

Die Zeitmarken der Teile (Seufzer, ruhiges Atmen, Hören) sind für beide
Stimmen gleich: die langsamere Stimme bestimmt sie. Nur so kann die App einen
einzigen Atemplan für die Kugel haben. Am Ende druckt das Skript diesen Plan
(PROG_ATEM in index.html).

Aufruf: python3 tools/runter_bauen.py   (Cache in /tmp/runter-cache)
"""
import base64, hashlib, json, math, os, subprocess, sys, time, urllib.error, urllib.request
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from runter_texte import TEXTE, ZUEGE, SEUFZER_TAKT, RUHIG_TAKT

HIER = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HIER, "..", "audio")
CACHE = "/tmp/runter-cache"
SR = 44100
# (Dienst, Stimme, Ziel) — w = Standard, m = Männerstimme der App
STIMMEN = {
    "w": ("el", "EXAVITQu4vr4xnSDxMaL", AUDIO + "/prog"),     # Sarah
    "m": ("el", "nPczCjzI2devNBz1zQrb", AUDIO + "/m/prog"),   # Brian
}
EL_MODELL, EL_TAG, EL_SEED = "eleven_v3", "[softly] ", 7
# keys_ok.txt = die zuletzt funktionierenden zuerst, damit gesperrte nicht jedes Mal durchprobiert werden
_ok = os.path.expanduser("~/.klarkreis/keys_ok.txt")
EL_KEYS = (open(_ok).read().split() if os.path.exists(_ok) else []) or open(os.path.expanduser("~/.klarkreis/keys.txt")).read().split()


def _el(stimme, text):
    body = json.dumps({"text": EL_TAG + text, "model_id": EL_MODELL, "seed": EL_SEED,
                       "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}).encode()
    for k in list(EL_KEYS):
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{stimme}", data=body, method="POST",
                                     headers={"xi-api-key": k, "Content-Type": "application/json", "Accept": "audio/mpeg"})
        try:
            daten = urllib.request.urlopen(req, timeout=120).read()
            time.sleep(1.5)
            return daten
        except urllib.error.HTTPError as e:
            if e.code in (401, 402, 429):   # gesperrt/leer → nächster Schlüssel, merkt sich das für den Lauf
                EL_KEYS.remove(k)
                continue
            raise
    sys.exit("Kein ElevenLabs-Schlüssel mehr frei")


def _grok(stimme, text):
    key = subprocess.run(["defaults", "read", "com.florian.pagevoice", "grokApiKey"],
                         capture_output=True, text=True).stdout.strip()
    body = json.dumps({"text": text, "voice_id": stimme, "language": "de", "speed": 0.85,
                       "output_format": {"codec": "mp3", "sample_rate": 24000, "bit_rate": 128000}}).encode()
    req = urllib.request.Request("https://api.x.ai/v1/tts", data=body, method="POST",
                                 headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    daten = urllib.request.urlopen(req, timeout=120).read()
    if daten[:1] == b"{":
        d = json.loads(daten)
        daten = base64.b64decode(d.get("audio") or d.get("data") or d.get("audio_base64"))
    return daten


TEIL_RHYTHMUS = {"ankommen": "frei", "seufzer": "seufzer", "ruhig_intro": "frei",
                 "ruhig": "ruhig", "hoeren": "frei"}
SCHLUSS_LUFT = 3.0   # so viel Stille nach dem letzten Satz, dann Gong der App

os.makedirs(CACHE, exist_ok=True)


def clip(stimme, text):
    """Satz → numpy-Array (float32, 44,1 kHz mono), Stille vorn/hinten entfernt."""
    dienst, voice, _ = STIMMEN[stimme]
    h = hashlib.sha1(f"{dienst}|{voice}|{EL_MODELL}|{EL_TAG}|{EL_SEED}|{text}".encode()).hexdigest()[:16]
    mp3, raw = f"{CACHE}/{h}.mp3", f"{CACHE}/{h}.f32"
    if not os.path.exists(mp3):
        open(mp3, "wb").write(_el(voice, text) if dienst == "el" else _grok(voice, text))
    if not os.path.exists(raw):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-ac", "1",
                        "-ar", str(SR), "-f", "f32le", raw], check=True)
    return beschneiden(np.fromfile(raw, dtype=np.float32))


def beschneiden(a, schwelle=-45, luecke=0.35, insel=0.12):
    """Stille vorn/hinten weg. v3 setzt ans Dateiende oft einen kurzen Knackser
    nach langer Stille; ein Schwellen-Trim bleibt daran hängen und die Ansage
    wird fast doppelt so lang. Darum: Sprachinseln suchen (10-ms-Rahmen über
    `schwelle`, Lücken < `luecke` s zusammengefasst) und Inseln am Rand, die
    kürzer als `insel` s sind, verwerfen."""
    r = int(SR * 0.01)
    n = len(a) // r
    db = 20 * np.log10(np.sqrt(np.mean(a[:n * r].reshape(n, r) ** 2, axis=1)) + 1e-9)
    laut = np.flatnonzero(db > schwelle)
    if not len(laut):
        return a
    gruppen, anf, vor = [], laut[0], laut[0]
    for i in laut[1:]:
        if (i - vor) * 0.01 > luecke:
            gruppen.append((anf, vor)); anf = i
        vor = i
    gruppen.append((anf, vor))
    while len(gruppen) > 1 and (gruppen[-1][1] - gruppen[-1][0] + 1) * 0.01 < insel:
        gruppen.pop()
    while len(gruppen) > 1 and (gruppen[0][1] - gruppen[0][0] + 1) * 0.01 < insel:
        gruppen.pop(0)
    von = max(0, gruppen[0][0] * r - int(0.04 * SR))
    bis = min(len(a), (gruppen[-1][1] + 1) * r + int(0.08 * SR))
    b = a[von:bis].copy()
    f = min(len(b), int(0.03 * SR))
    b[-f:] *= np.linspace(1, 0, f, dtype=np.float32)   # kein Klick am Schnitt
    return b


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
        aus = f"{ziel}/runterkommen-{minuten}.mp3"
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
        plaene[f"runterkommen-{minuten}"] = plan
        for s, (aus, luft) in erg.items():
            print(f"{os.path.relpath(aus, HIER + '/..')}: Hör-Stille +{luft:.1f} s")
    print("PROG_ATEM =", json.dumps(plaene))
