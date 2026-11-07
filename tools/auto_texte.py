"""Texte für „Im Auto“ (5, 10, 20 Min) — achtsam fahren, Augen offen, Verkehr geht vor.

Florian 07.11.2026: „eine Meditation beim Autofahren“; Text freigegeben am selben Tag (tools/auto_entwurf.md).
Wie „Nebenbei“: keine Atemübung, kein Augenschließen, kein Schwerwerden, kein Takt. Lange Stillen, damit die
Stimme nicht ablenkt. Sitz, Hände am Lenkrad, Schultern/Kiefer, Hören, weiter Blick, Abstand, Ungeduld,
rote Ampel als Moment zum Ausatmen.
Alle vier Stimmen. Einträge wie in programm_bauen.py.
"""

ZUEGE = {}

S = {
    "v1": "Diese Meditation ist fürs Autofahren. Die Augen bleiben auf der Straße, und der Verkehr hat immer Vorrang. "
          "Wird es irgendwo eng, dann hör einfach nicht hin. Ich warte.",
    "v2": "Und wenn du merkst, dass du müde wirst, dann hilft keine Meditation. "
          "Dann hilft nur eine Pause auf dem nächsten Parkplatz.",
    "s1": "Spür, wie du sitzt. Der Rücken an der Lehne, das Gewicht im Sitz. Der Sitz trägt dich.",
    "s2": "Jetzt die Hände am Lenkrad. Wie fest hältst du es? Oft fester als nötig. "
          "Lass den Griff so weit nach, dass du gerade noch sicher lenkst.",
    "s3": "Die Schultern: Sind sie hochgezogen? Lass sie ein Stück sinken. "
          "Und der Kiefer darf locker werden, die Zähne müssen nicht aufeinanderliegen.",
    "s4": "Spür den rechten Fuß am Pedal. Wie fein er Gas gibt und bremst, fast von allein.",
    "s5": "Der Atem läuft von allein. Du musst nichts damit machen. Bemerk ihn nur: ein, und aus.",
    "h1": "Jetzt die Ohren. Der Motor, das Rollen der Reifen, der Wind. Hör hin wie bei Musik, ohne etwas daran zu ändern.",
    "h2": "Und die Augen: Schau weit nach vorn und nimm dabei die Ränder mit, die Spiegel, den Himmel. "
          "Nicht starren, sondern alles im Blick haben.",
    "h3": "In einer Kurve spürst du vielleicht, wie der Körper sich ein wenig mitneigt und die Hände das Lenkrad führen. "
          "Du und das Auto bewegt euch zusammen.",
    "h4": "Gibt es Licht? Sonne auf den Händen, Schatten von Bäumen, Lichter in der Dämmerung. "
          "Bemerk es nur kurz, die Augen bleiben auf der Straße.",
    "a1": "Abstand ist auch Ruhe. Wenn du magst, lass ein bisschen mehr Platz nach vorn. "
          "Das nimmt Druck raus, für dich und für die anderen.",
    "a2": "Vielleicht drängelt jemand, oder es geht nicht voran. Merk, was das mit dir macht: "
          "Wärme im Gesicht, ein fester Griff, ein Satz im Kopf. Es reicht, das zu bemerken. Du musst nicht schneller sein.",
    "a3": "Wenn die Gedanken schon am Ziel sind, beim Termin oder bei dem, was danach kommt, ist das ganz normal. "
          "Sobald du es merkst, bist du schon zurück: Hände, Sitz, Straße.",
    "a4": "Kiefer, Schultern und Hände ziehen sich gern heimlich wieder fest. Lös sie einfach noch einmal.",
    "p1": "Eine rote Ampel oder ein Stau sind dein Moment. Atme einmal lang aus, lass die Hände kurz locker "
          "und fahr weiter, wenn es weitergeht.",
    "z1": "Noch einmal alles zusammen: der Sitz unter dir, die lockeren Hände, die Geräusche, der weite Blick. Du fährst einfach nur.",
    "z2": "Das war's. Fahr ruhig so wach weiter wie jetzt. "
          "Und beim nächsten Halt kannst du es wieder probieren: Hände locker, Schultern runter, einmal lang aus.",
}

D = "dehnbar"


def ablauf(minuten):
    ab10, nur20 = minuten >= 10, minuten >= 20
    folge = [("v1", 3, None), ("v2", 6, D), ("s1", 12, D), ("s2", 15, D), ("s3", 15, D)]
    if ab10:
        folge.append(("s4", 15, D))
    folge += [("s5", 15, D), ("h1", 18, D), ("h2", 18, D)]
    if ab10:
        folge.append(("h3", 18, D))
    if nur20:
        folge.append(("h4", 18, D))
    folge += [("a1", 18, D), ("a2", 20, D), ("a3", 18, D)]
    if ab10:
        folge.append(("a4", 18, D))
    folge += [("p1", 18, D), ("z1", 12, D)]
    erg = [("teil", "auto"), ("still", 1)]
    for k, s, d in folge:
        erg.append(("sag", k))
        erg.append(("still", s, d) if d else ("still", s))
    erg += [("teil", "schluss"), ("sag", "z2")]
    return erg


TEXTE = {m: ablauf(m) for m in (5, 10, 20)}
