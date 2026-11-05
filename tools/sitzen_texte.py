"""Texte der klassischen Meditation „Einfach sitzen" (5, 10, 15, 20 Min) — Entwurf: sitzen_entwurf.md.

Florian 26.10.2026: „wirklich nur auf die Atmung achten, Körperscan, klassisch meditieren" — keine
Atemübung, kein Takt, der Atem wird nicht beeinflusst. Gut angeleitet (regelmäßige kurze Hinweise,
damit man nicht wegdriftet), aber mit Freiheit (Stillen dazwischen). Immer gleicher Bogen:
  1. Ankommen     — Haltung, Kontakt, Augen
  2. Atem         — beobachten, nicht steuern; Abschweifen und Zurückkommen
  3. Körper       — Scan von den Füßen bis zum Kopf, immer komplett
  4. Offen sitzen — Geräusche, Gedanken, Gefühle, ohne festen Ort
  5. Schluss      — zurück in den Raum

Einträge wie in taeglich_texte.py: ("sag", schlüssel), ("still", s) oder ("still", s, "dehnbar") —
dehnbare Stillen nehmen die Restzeit auf. ("teil", name) setzt eine Zeitmarke für beide Stimmen.
"""

S = {
    # Ankommen
    "a1": "Schön, dass du da bist. Setz dich aufrecht und bequem hin, so, dass du eine Weile gut sitzen kannst.",
    "a2": "Spür, wo du aufliegst. Die Füße am Boden, das Gewicht auf dem Sitz.",
    "a3": "Lass den Rücken aufgerichtet sein, aber nicht steif. Die Schultern hängen locker, die Hände liegen einfach da.",
    "a4": "Schließ die Augen, oder lass den Blick weich nach unten sinken.",
    "a5": "Für die nächsten Minuten gibt es nichts zu erreichen und nichts zu verbessern. Du darfst einfach hier sein und bemerken, was gerade da ist.",
    # Atem
    "b1": "Bring die Aufmerksamkeit jetzt zum Atem. Du musst ihn nicht verändern. Er geht von allein, so wie er gerade geht.",
    "b2": "Such dir die Stelle, an der du ihn am deutlichsten spürst: an der Nase, an der Brust oder am Bauch. Und bleib mit der Aufmerksamkeit dort.",
    "b3": "An der Nase ist es vielleicht die kühle Luft beim Einatmen und die etwas wärmere beim Ausatmen. Am Bauch ein sanftes Heben und Senken.",
    "b4": "Versuch, einem einzigen Atemzug ganz zu folgen. Vom Anfang des Einatmens über die kleine Pause bis zum Ende des Ausatmens.",
    "b5": "Ein Atemzug kann kurz sein oder lang, flach oder tief. Es gibt keinen richtigen Atem. Nur diesen hier.",
    "b6": "Vielleicht merkst du, dass du den Atem doch steuerst, sobald du hinschaust. Das ist normal. Bemerk es und lass ihn wieder los. Er weiß von selbst, wie er gehen soll.",
    "b7": "Die Gedanken werden abschweifen. Das ist kein Fehler. Sobald du es merkst, kehr freundlich zum Atem zurück. Immer wieder. Genau das ist die Übung.",
    "b8": "Wenn es dir hilft, zähl still die Ausatemzüge, von eins bis zehn, und dann wieder von vorn. Wenn du dich verzählst, fang einfach wieder bei eins an.",
    "b9": "Wo ist deine Aufmerksamkeit gerade? Wenn sie woanders war, ist das in Ordnung. Zurück zum nächsten Atemzug.",
    "b10": "Du musst dich nicht anstrengen. Die Aufmerksamkeit darf leicht sein, wie eine Hand, die etwas behutsam hält.",
    "b11": "Bleib noch eine Weile beim Atem. Ein Atemzug nach dem anderen.",
    # Körper
    "k0": "Geh jetzt mit der Aufmerksamkeit durch den Körper, von den Füßen bis zum Kopf. Nichts verändern, nur wahrnehmen, was da ist.",
    "k0b": "Wärme, Kribbeln, Druck, Ziehen. Oder gar nichts. Alles ist in Ordnung. Auch „nichts spüren“ ist eine Wahrnehmung.",
    "k5_1": "Die Füße und die Beine.",
    "k5_2": "Das Becken, der Bauch, der Rücken.",
    "k5_3": "Die Brust, die Schultern, die Arme und die Hände.",
    "k5_4": "Der Nacken, das Gesicht, der ganze Kopf.",
    "k1": "Die Füße. Die Sohlen, die Fersen, die Zehen. Die Stellen, an denen sie den Boden berühren.",
    "k2": "Die Unterschenkel, die Knie, die Oberschenkel.",
    "k3": "Das Becken, und das Gewicht, das auf dem Sitz ruht.",
    "k4": "Der Bauch. Vielleicht spürst du hier, wie der Atem ihn bewegt.",
    "k5": "Der Rücken, vom Kreuz bis zwischen die Schulterblätter.",
    "k_unang": "Wenn du auf etwas Unangenehmes triffst, eine Spannung oder einen Schmerz, musst du nichts dagegen tun. Bleib einen Moment dabei, mit Neugier, und geh dann weiter.",
    "k6": "Die Brust. Vielleicht auch der Herzschlag.",
    "k_zurueck": "Wenn du gemerkt hast, dass du abgeschweift bist: einfach da weitermachen, wo wir gerade sind.",
    "k7": "Die Hände. Die Finger, die Handflächen. Die Arme bis zu den Schultern.",
    "k8": "Der Nacken. Der Hals.",
    "k9": "Das Gesicht. Die Stirn, die Augen, die Wangen, der Kiefer. Die Zunge im Mund.",
    "k10": "Der ganze Kopf, bis zum Scheitel.",
    "kz": "Und jetzt der ganze Körper auf einmal, so, wie er gerade sitzt. Ein Körper, der atmet.",
    # Offen sitzen
    "o5": "Lass die Aufmerksamkeit jetzt weit werden. Geräusche, Empfindungen, Gedanken: Alles kommt und geht. Und wenn du dich verlierst, ist der Atem dein Anker.",
    "o1": "Öffne jetzt die Aufmerksamkeit für die Geräusche. Nahe und ferne. Du musst sie nicht benennen und nicht bewerten. Sie kommen und gehen von allein.",
    "o2": "Vielleicht bemerkst du auch die Stille zwischen den Geräuschen.",
    "o3": "Auch Gedanken kommen und gehen. Du musst ihnen nicht folgen und sie nicht wegschicken. Schau ihnen zu, wie Wolken am Himmel.",
    "o4": "Wenn ein Gedanke dich mitnimmt, kannst du ihn kurz benennen. Planen. Erinnern. Sorgen. Und dann zurück zum Atem.",
    "o_gefuehl": "Vielleicht ist auch ein Gefühl da. Unruhe, Müdigkeit, Freude, Langeweile. Auch das darf da sein, genau so, wie es ist. Wo spürst du es im Körper?",
    "o6": "Jetzt gibt es keinen bestimmten Ort mehr für die Aufmerksamkeit. Nur sitzen. Und bemerken, was gerade da ist: ein Geräusch, ein Gedanke, ein Atemzug.",
    "o7": "Wenn du dich verloren hast: Der Atem ist immer da. Ein Atemzug, und du bist wieder hier.",
    "o8": "Wo bist du gerade? Bemerk es, ohne zu urteilen. Und dann wieder: einfach sitzen.",
    "o9": "Nur sitzen. Nur atmen. Nur da sein.",
    # Schluss
    "f0": "Langsam kommen wir zum Ende.",
    "f1": "Spür noch einmal den ganzen Körper, wie er hier sitzt. Und nimm wahr, wie es dir jetzt geht, ohne es zu bewerten.",
    "f2": "Vielleicht nimmst du etwas von dieser Ruhe mit in das, was jetzt kommt.",
    "f3": "Beweg die Finger und Zehen. Und wenn du so weit bist, öffne die Augen.",
}

D = "dehnbar"


def _scan(lang, unang):
    """Körperscan ab 10 Min; `lang` = Pause je Station, `unang` = Hinweis auf Unangenehmes (ab 15)."""
    teil = [("sag", "k1"), ("still", lang), ("sag", "k2"), ("still", lang), ("sag", "k3"), ("still", lang),
            ("sag", "k4"), ("still", lang), ("sag", "k5"), ("still", lang)]
    if unang:
        teil += [("sag", "k_unang"), ("still", lang + 4)]
    return teil + [("sag", "k6"), ("still", lang), ("sag", "k_zurueck"), ("still", lang - 2),
                   ("sag", "k7"), ("still", lang), ("sag", "k8"), ("still", lang),
                   ("sag", "k9"), ("still", lang), ("sag", "k10"), ("still", lang)]


TEXTE = {
    # 1 Min = „achtsame Minute“, 3 Min = nur Ankommen, Atem, Schluss (Florian 26.10.2026: „einfach sitzen und
    # Atem beobachten“) – für Körperscan und offenes Sitzen zu kurz. 1, 3 und 7 Min nutzen nur Sätze aus den
    # anderen Längen, es wurde nichts neu vertont.
    1: [   # Pausen vorn 1 + 2 s statt 2 + 3 s: Zen und Ela sprechen langsamer (Version 69)
        ("teil", "ankommen"), ("still", 1),
        ("sag", "a4"), ("still", 2),
        ("teil", "atem"),
        ("sag", "b1"), ("still", 8, D),
        ("sag", "b4"), ("still", 12, D),
        ("teil", "schluss"),
        ("sag", "o9"), ("still", 5, D),
        ("sag", "f3"),
    ],
    3: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 3),
        ("sag", "a4"), ("still", 4),
        ("teil", "atem"),
        ("sag", "b1"), ("still", 5),
        ("sag", "b2"), ("still", 12, D),
        ("sag", "b4"), ("still", 15, D),
        ("sag", "b7"), ("still", 20, D),
        ("sag", "b11"), ("still", 20, D),
        ("teil", "schluss"),
        ("sag", "f1"), ("still", 5),
        ("sag", "f3"),
    ],
    5: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 3),
        ("sag", "a2"), ("still", 4),
        ("sag", "a4"), ("still", 4),
        ("teil", "atem"),
        ("sag", "b1"), ("still", 6),
        ("sag", "b2"), ("still", 10, D),
        ("sag", "b4"), ("still", 12, D),
        ("sag", "b6"), ("still", 10, D),
        ("sag", "b7"), ("still", 15, D),
        ("teil", "koerper"),
        ("sag", "k0"), ("still", 3),
        ("sag", "k5_1"), ("still", 7),
        ("sag", "k5_2"), ("still", 7),
        ("sag", "k5_3"), ("still", 7),
        ("sag", "k5_4"), ("still", 7),
        ("sag", "kz"), ("still", 10, D),
        ("teil", "offen"),
        ("sag", "o5"), ("still", 25, D),
        ("teil", "schluss"),
        ("sag", "f1"), ("still", 6),
        ("sag", "f3"),
    ],
    # 7 Min: der ganze Bogen wie 10, aber mit dem kurzen Körperscan aus 5
    7: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 3),
        ("sag", "a2"), ("still", 4),
        ("sag", "a4"), ("still", 4),
        ("sag", "a5"), ("still", 5),
        ("teil", "atem"),
        ("sag", "b1"), ("still", 6),
        ("sag", "b2"), ("still", 10, D),
        ("sag", "b4"), ("still", 12, D),
        ("sag", "b6"), ("still", 12, D),
        ("sag", "b7"), ("still", 15, D),
        ("sag", "b9"), ("still", 15, D),
        ("teil", "koerper"),
        ("sag", "k0"), ("still", 3),
        ("sag", "k5_1"), ("still", 7),
        ("sag", "k5_2"), ("still", 7),
        ("sag", "k5_3"), ("still", 7),
        ("sag", "k5_4"), ("still", 7),
        ("sag", "kz"), ("still", 12, D),
        ("teil", "offen"),
        ("sag", "o1"), ("still", 12, D),
        ("sag", "o3"), ("still", 15, D),
        ("sag", "o4"), ("still", 15, D),
        ("sag", "o7"), ("still", 20, D),
        ("teil", "schluss"),
        ("sag", "f0"), ("still", 3),
        ("sag", "f1"), ("still", 6),
        ("sag", "f3"),
    ],
    10: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 4),
        ("sag", "a2"), ("still", 5),
        ("sag", "a3"), ("still", 5),
        ("sag", "a4"), ("still", 4),
        ("sag", "a5"), ("still", 6),
        ("teil", "atem"),
        ("sag", "b1"), ("still", 8),
        ("sag", "b2"), ("still", 12, D),
        ("sag", "b3"), ("still", 12, D),
        ("sag", "b4"), ("still", 15, D),
        ("sag", "b5"), ("still", 12, D),
        ("sag", "b6"), ("still", 15, D),
        ("sag", "b7"), ("still", 20, D),
        ("sag", "b9"), ("still", 20, D),
        ("teil", "koerper"),
        ("sag", "k0"), ("still", 3),
        ("sag", "k0b"), ("still", 4),
        *_scan(7, False),
        ("sag", "kz"), ("still", 15, D),
        ("teil", "offen"),
        ("sag", "o1"), ("still", 15, D),
        ("sag", "o3"), ("still", 15, D),
        ("sag", "o4"), ("still", 15, D),
        ("sag", "o6"), ("still", 20, D),
        ("sag", "o7"), ("still", 20, D),
        ("teil", "schluss"),
        ("sag", "f0"), ("still", 3),
        ("sag", "f1"), ("still", 7),
        ("sag", "f3"),
    ],
    15: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 5),
        ("sag", "a2"), ("still", 6),
        ("sag", "a3"), ("still", 6),
        ("sag", "a4"), ("still", 4),
        ("sag", "a5"), ("still", 8),
        ("teil", "atem"),
        ("sag", "b1"), ("still", 10),
        ("sag", "b2"), ("still", 15, D),
        ("sag", "b3"), ("still", 15, D),
        ("sag", "b4"), ("still", 20, D),
        ("sag", "b5"), ("still", 15, D),
        ("sag", "b6"), ("still", 20, D),
        ("sag", "b7"), ("still", 20, D),
        ("sag", "b8"), ("still", 30, D),
        ("sag", "b9"), ("still", 25, D),
        ("sag", "b10"), ("still", 25, D),
        ("teil", "koerper"),
        ("sag", "k0"), ("still", 3),
        ("sag", "k0b"), ("still", 5),
        *_scan(9, True),
        ("sag", "kz"), ("still", 20, D),
        ("teil", "offen"),
        ("sag", "o1"), ("still", 15, D),
        ("sag", "o2"), ("still", 15, D),
        ("sag", "o3"), ("still", 20, D),
        ("sag", "o4"), ("still", 20, D),
        ("sag", "o_gefuehl"), ("still", 20, D),
        ("sag", "o6"), ("still", 25, D),
        ("sag", "o7"), ("still", 25, D),
        ("sag", "o8"), ("still", 25, D),
        ("teil", "schluss"),
        ("sag", "f0"), ("still", 4),
        ("sag", "f1"), ("still", 8),
        ("sag", "f2"), ("still", 6),
        ("sag", "f3"),
    ],
    20: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 5),
        ("sag", "a2"), ("still", 7),
        ("sag", "a3"), ("still", 7),
        ("sag", "a4"), ("still", 5),
        ("sag", "a5"), ("still", 10),
        ("teil", "atem"),
        ("sag", "b1"), ("still", 12),
        ("sag", "b2"), ("still", 18, D),
        ("sag", "b3"), ("still", 18, D),
        ("sag", "b4"), ("still", 25, D),
        ("sag", "b5"), ("still", 18, D),
        ("sag", "b6"), ("still", 25, D),
        ("sag", "b7"), ("still", 25, D),
        ("sag", "b8"), ("still", 40, D),
        ("sag", "b9"), ("still", 30, D),
        ("sag", "b10"), ("still", 30, D),
        ("sag", "b11"), ("still", 35, D),
        ("teil", "koerper"),
        ("sag", "k0"), ("still", 4),
        ("sag", "k0b"), ("still", 6),
        *_scan(12, True),
        ("sag", "kz"), ("still", 25, D),
        ("teil", "offen"),
        ("sag", "o1"), ("still", 20, D),
        ("sag", "o2"), ("still", 20, D),
        ("sag", "o3"), ("still", 25, D),
        ("sag", "o4"), ("still", 25, D),
        ("sag", "o_gefuehl"), ("still", 25, D),
        ("sag", "o6"), ("still", 30, D),
        ("sag", "o7"), ("still", 30, D),
        ("sag", "o8"), ("still", 30, D),
        ("sag", "o9"), ("still", 35, D),
        ("teil", "schluss"),
        ("sag", "f0"), ("still", 5),
        ("sag", "f1"), ("still", 10),
        ("sag", "f2"), ("still", 8),
        ("sag", "f3"),
    ],
}


# ---------- Varianten B und C (Version 69, Florian 05.11.2026: „drei Varianten, die sich abwechseln“) ----------
# Gleicher Bogen und gleiche Teile wie oben (Ankommen und Schluss werden übernommen, sind also schon vertont),
# nur der Weg in der Mitte ist ein anderer. Die App wechselt reihum A → B → C (1 Min bleibt immer A).
#   B „Klang und Raum“: Anker sind die Geräusche, der Körper als Ganzes, Aufmerksamkeit weit wie ein Raum.
#   C „Benennen“: Atem am Bauch, leises Benennen (Noting), wo sich Stimmungen im Körper zeigen, etwas Freundlichkeit.
S.update({
    # B – Hören
    "hb1": "Heute beginnen wir nicht beim Atem, sondern bei dem, was du hörst. Lass die Geräusche einfach zu dir kommen.",
    "hb2": "Du musst nichts suchen. Nahe Geräusche, ferne Geräusche, vielleicht das Summen eines Geräts oder dein eigener Atem.",
    "hb3": "Versuch, ein Geräusch zu hören, bevor du es benennst. Nur Klang: lauter, leiser, hoch, tief. Es kommt und vergeht.",
    "hb4": "Das Hören geschieht von allein. Du musst die Geräusche nicht festhalten und nichts gegen sie tun.",
    "hb5": "Wenn du merkst, dass du in Gedanken warst, ist das kein Problem. Das nächste Geräusch holt dich zurück.",
    "hb6": "Bemerk auch die Lücken. Den Moment, in dem ein Klang verklingt, und die Stille, aus der der nächste kommt.",
    "hb7": "Jetzt lass auch den Atem dazukommen. Als ein weiteres leises Geräusch, eine weitere Bewegung in diesem Raum.",
    "hb8": "Hören und atmen. Beides geschieht, ohne dass du etwas dafür tun musst.",
    # B – Körper als Ganzes
    "kb0": "Spür jetzt den Körper. Nicht Stück für Stück, sondern als Ganzes, wie einen Raum, in dem Empfindungen auftauchen.",
    "kb1": "Hier ein Kribbeln, dort Druck, irgendwo Wärme. Wie Geräusche tauchen sie auf und verändern sich.",
    "kb2": "Wo ist der Körper gerade am deutlichsten zu spüren? Bleib einen Moment dort. Dann lass die Aufmerksamkeit wieder weit werden.",
    "kb3": "Wenn etwas unangenehm ist, darf es da sein. Es ist eine Empfindung unter vielen, und auch sie verändert sich.",
    "kb4": "Der Körper atmet. Die Geräusche kommen und gehen. Und du sitzt mittendrin.",
    # B – weit
    "ob1": "Lass die Aufmerksamkeit jetzt so weit werden wie der Raum um dich herum. Geräusche, Körper, Gedanken: Alles hat darin Platz.",
    "ob2": "Gedanken kannst du behandeln wie Geräusche. Sie tauchen auf, klingen eine Weile und verklingen wieder.",
    "ob3": "Du musst nichts davon festhalten. Du bist eher wie der Raum, in dem das alles geschieht.",
    "ob4": "Wenn du dich verloren hast, hör einfach hin. Was ist gerade zu hören? Schon bist du wieder hier.",
    "ob6": "Vielleicht ist auch ein Gefühl da. Lass es da sein, wie einen Klang im Raum.",
    "ob5": "Nur hören. Nur sitzen. Nichts weiter.",
    # C – Atem am Bauch, benennen
    "hc1": "Bring die Aufmerksamkeit heute zum Bauch. Wenn du magst, leg eine Hand darauf und spür, wie er sich beim Atmen hebt und senkt.",
    "hc2": "Heben. Senken. Du kannst es innerlich ganz leise mitsprechen, ohne den Atem zu verändern.",
    "hc3": "Zwischen dem Ausatmen und dem nächsten Einatmen gibt es oft eine kleine Pause. Lass sie da sein, ohne den nächsten Atemzug herbeizuholen.",
    "hc4": "Wenn ein Gedanke dich wegzieht, benenn ihn mit einem einzigen Wort. Denken. Planen. Erinnern. Und dann zurück zum Bauch.",
    "hc5": "Das Benennen ist kein Urteil. Es ist nur ein leises Feststellen: Ah, das ist gerade da.",
    "hc6": "Ein Wort, kurz und freundlich, und dann wieder: heben, senken.",
    "hc7": "Es ist egal, wie oft du abschweifst. Jedes Zurückkommen ist ein Moment, in dem du wach bist.",
    # C – Körper und Stimmungen
    "kc0": "Weite die Aufmerksamkeit jetzt auf den ganzen Körper aus. Was am deutlichsten auftaucht, darfst du benennen.",
    "kc1": "Drücken. Kribbeln. Warm. Kühl. Ziehen. Ein Wort genügt. Dann schau, wie es sich verändert.",
    "kc2": "Achte darauf, wo sich Stimmungen im Körper zeigen. Unruhe vielleicht im Bauch, Anspannung in den Schultern, Müdigkeit hinter den Augen.",
    "kc3": "Wenn du eine Stelle findest, die eng ist, atme ein paar Mal so, als würde der Atem dorthin fließen. Ohne etwas wegmachen zu wollen.",
    "kc4": "Und jetzt wieder der ganze Körper, so, wie er hier sitzt und atmet.",
    # C – offen benennen
    "oc1": "Jetzt darfst du alles benennen, was auftaucht. Hören. Spüren. Denken. Fühlen. Und dazwischen immer wieder: atmen.",
    "oc2": "Mal ist es mehr Denken, mal mehr Spüren. Du musst nichts davon steuern. Du schaust nur, was gerade dran ist.",
    "oc3": "Wenn ein Gefühl da ist, benenn auch das. Ärger. Freude. Traurigkeit. Langeweile. Und schau, wo du es im Körper spürst.",
    "oc4": "Vielleicht kannst du dem, was auftaucht, mit etwas Freundlichkeit begegnen. So, wie du einem guten Freund zuhören würdest.",
    "oc5": "Wenn das Benennen anstrengend wird, lass es weg. Dann nur noch sitzen und bemerken.",
    "oc6": "Wünsch dir zum Schluss still etwas Gutes. Vielleicht: Möge ich ruhig sein. Möge ich freundlich mit mir sein.",
})

# Welche Sätze in welcher Länge (wie bei A: 3 Min nur Atem, ab 5 Min der ganze Bogen)
_WAHL = {
    "b": {3: (["hb1", "hb3", "hb5", "hb7"], [], []),
          5: (["hb1", "hb3", "hb5", "hb7"], ["kb0", "kb1", "kb4"], ["ob1"]),
          7: (["hb1", "hb2", "hb3", "hb5", "hb7"], ["kb0", "kb1", "kb2", "kb4"], ["ob1", "ob2", "ob4", "ob5"]),
          10: (["hb1", "hb2", "hb3", "hb4", "hb5", "hb7", "hb8"], ["kb0", "kb1", "kb2", "kb4"], ["ob1", "ob2", "ob3", "ob4", "ob5"]),
          15: (["hb1", "hb2", "hb3", "hb4", "hb5", "hb6", "hb7", "hb8"], ["kb0", "kb1", "kb2", "kb3", "kb4"], ["ob1", "ob2", "ob3", "ob6", "ob4", "ob5"]),
          20: (["hb1", "hb2", "hb3", "hb4", "hb5", "hb6", "hb7", "hb8"], ["kb0", "kb1", "kb2", "kb3", "kb4"], ["ob1", "ob2", "ob3", "ob6", "ob4", "ob5"])},
    "c": {3: (["hc1", "hc2", "hc4", "hc7"], [], []),
          5: (["hc1", "hc2", "hc4", "hc7"], ["kc0", "kc1", "kc4"], ["oc1"]),
          7: (["hc1", "hc2", "hc3", "hc4", "hc7"], ["kc0", "kc1", "kc2", "kc4"], ["oc1", "oc2", "oc4", "oc5"]),
          10: (["hc1", "hc2", "hc3", "hc4", "hc5", "hc6", "hc7"], ["kc0", "kc1", "kc2", "kc4"], ["oc1", "oc2", "oc3", "oc4", "oc5"]),
          15: (["hc1", "hc2", "hc3", "hc4", "hc5", "hc6", "hc7"], ["kc0", "kc1", "kc2", "kc3", "kc4"], ["oc1", "oc2", "oc3", "oc4", "oc5", "oc6"]),
          20: (["hc1", "hc2", "hc3", "hc4", "hc5", "hc6", "hc7"], ["kc0", "kc1", "kc2", "kc3", "kc4"], ["oc1", "oc2", "oc3", "oc4", "oc5", "oc6"])},
}
# Grundpause nach einem Satz (dehnbar) je Länge; Körper etwas kürzer
_PAUSE = {3: 15, 5: 11, 7: 13, 10: 15, 15: 20, 20: 27}


def _variante(v, minuten):
    a = TEXTE[minuten]
    i_atem = a.index(("teil", "atem"))
    i_schluss = a.index(("teil", "schluss"))
    atem, koerper, offen = _WAHL[v][minuten]
    p = _PAUSE[minuten]
    mitte = [("teil", "atem"), ("sag", atem[0]), ("still", 6)]
    for k in atem[1:]:
        mitte += [("sag", k), ("still", p, D)]
    if koerper:
        mitte += [("teil", "koerper"), ("sag", koerper[0]), ("still", 4)]
        for k in koerper[1:]:
            mitte += [("sag", k), ("still", round(p * 0.8), D)]
    if offen:
        mitte += [("teil", "offen")]
        for k in offen:
            mitte += [("sag", k), ("still", p + 5, D)]
    return a[:i_atem] + mitte + a[i_schluss:]


TEXTE_B = {m: _variante("b", m) for m in _WAHL["b"]}
TEXTE_C = {m: _variante("c", m) for m in _WAHL["c"]}
