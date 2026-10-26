"""Vogel-Kulisse für Innehalten + Täglich (tools/kulisse/voegel.mp3).

Florian 26.10.2026: der Wald (Sherwood, audio/atmo/wald.mp3) ist „einfach nur Rauschen“ und zu laut –
es sollen Vögel sein, viel leiser. Darum: heimische Waldvögel bei Kiel (radio aporee,
https://archive.org/details/aporee_53013_60581), die ruhigen ersten 6,5 Minuten. Wind/Rumpeln
unter 350 Hz weg, das Grundrauschen zwischen den Rufen per Spektral-Entrauschen gedrückt, nahtlos
geloopt (Ende blendet in den Anfang) und fest auf KULISSE_LUFS gepegelt – die Bau-Skripte legen
die Datei nur noch unter, ohne nachzupegeln. Spitzen gekappt, damit kein einzelner Vogel heraussticht.

Aufruf: python3 tools/kulisse_bauen.py
"""
import json, os, subprocess
import numpy as np

QUELLE = os.path.expanduser("~/Projects/apps/atemfunk-media/quellen/atmo/wald_kiel.mp3")
VON, BIS = 0, 390            # ab 8 min kommt Rumpeln (Flugzeug?) dazu
KULISSE_LUFS = -50           # Stimme −21: Vögel ~29 dB darunter (bis 26.10. Wald −40, davor −32)
SPITZE_DB = -32              # kein Ruf lauter als das
UEBERBLENDEN = 6.0
SR = 44100
ZIEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kulisse", "voegel.mp3")


def ffmpeg_f32(args, eingabe=None):
    p = subprocess.run(["ffmpeg", "-v", "error"] + args + ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                       input=eingabe, capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def lautheit(x):
    m = subprocess.run(["ffmpeg", "-hide_banner", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True, text=False).stderr.decode()
    a = m.rindex("{")
    return float(json.loads(m[a:m.index("}", a) + 1])["input_i"])


x = ffmpeg_f32(["-ss", str(VON), "-t", str(BIS - VON), "-i", QUELLE,
                "-af", "highpass=f=350,highpass=f=350,lowpass=f=9500,afftdn=nr=18:nf=-50:tn=1"])

# nahtlos: die letzten Sekunden blenden in die ersten (gleiche Leistung), Schleife beginnt danach
n = int(UEBERBLENDEN * SR)
t = np.linspace(0, np.pi / 2, n, dtype=np.float32)
naht = x[-n:] * np.cos(t) + x[:n] * np.sin(t)
schleife = np.concatenate([x[n:-n], naht])

# Limiter: alimiter kann höchstens bis −24 dBFS kappen, darum vorher anheben und danach wieder absenken
hub = -24 - SPITZE_DB
schleife = ffmpeg_f32(["-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af",
                       f"volume={KULISSE_LUFS + hub - lautheit(schleife):.2f}dB,"
                       f"alimiter=limit={10 ** (-24 / 20):.4f}:attack=5:release=80:level=false,volume={-hub}dB"],
                      eingabe=schleife.astype(np.float32).tobytes())
schleife *= 10 ** ((KULISSE_LUFS - lautheit(schleife)) / 20)

os.makedirs(os.path.dirname(ZIEL), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                "-c:a", "libmp3lame", "-b:a", "96k", ZIEL], input=schleife.astype(np.float32).tobytes(), check=True)
print(f"{ZIEL}: {len(schleife) / SR / 60:.1f} min, {lautheit(schleife):.1f} LUFS, "
      f"Spitze {20 * np.log10(np.max(np.abs(schleife))):.1f} dBFS")
