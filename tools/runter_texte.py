"""Texte der Meditation „Runterkommen" (5 und 10 Min) — für die Bank unterwegs.

Aufbau, jeweils mit fester Zeitmarke, damit die Kugel in der App genau mitatmet:
  1. Ankommen      — Bank spüren, Blick wandern lassen (Orientieren beruhigt)
  2. Seufzer       — doppeltes Einatmen, langes Ausatmen (4 · 1,5 · 8 s);
                     die ersten Runden zählt die Stimme mit, dann allein
  3. Langes Aus    — ruhig 4 ein · 6 aus, am Ende nur noch still
  4. Hören         — Geräusche ringsum, Atem frei
  5. Zurück        — Bank, Füße, Augen auf

Ein Eintrag ist ("sag", text) oder ("still", sekunden). Zyklen stehen als
("seufzer", n_mit_stimme, n_gesamt) bzw. ("ruhig", n_mit_stimme, n_gesamt).
"""

SEUFZER_TAKT = [("Einatmen", 4), ("Nachatmen", 1.5), ("Ausatmen", 8)]
RUHIG_TAKT = [("Einatmen", 4), ("Ausatmen", 6)]

# Kurze Ansagen im Takt (werden je Stimme einmal erzeugt)
ZUEGE = {
    "s_ein": "Einatmen durch die Nase.",
    "s_nach": "Noch ein Zug.",
    "s_aus": "Und lang aus.",
    "r_ein": "Ein.",
    "r_aus": "Und langsam aus.",
}

TEXTE = {
    5: [
        ("teil", "ankommen"),
        ("still", 3),
        ("sag", "Du sitzt. Spür, wie die Bank dich trägt. Du musst gerade nichts halten und nichts leisten."),
        ("still", 5),
        ("sag", "Lass den Blick langsam wandern, ganz gemächlich, nach links und nach rechts. "
                "Such dir etwas Ruhiges, auf dem die Augen bleiben dürfen. Ein Baum, der Himmel, der Boden vor dir."),
        ("still", 8),
        ("sag", "Wenn du magst, schließ jetzt die Augen. Offen lassen geht genauso."),
        ("still", 3),
        ("sag", "Wir beginnen mit dem doppelten Einatmen. Das macht dein Körper von selbst, "
                "nach dem Weinen oder kurz vor dem Einschlafen. So geht es: durch die Nase einatmen, "
                "oben noch einen kleinen Zug drauf, und dann ganz langsam durch den Mund ausatmen. "
                "Ich zähle die ersten Runden mit."),
        ("still", 2),
        ("teil", "seufzer"),
        ("seufzer", 3, 5),
        ("sag", "Mach allein weiter, in diesem Rhythmus. Ich sag dir, wenn es weitergeht."),
        ("seufzer", 0, 4),
        ("teil", "ruhig_intro"),
        ("sag", "Lass das doppelte Einatmen jetzt los. Atme ruhig durch die Nase, "
                "und lass das Ausatmen etwas länger sein als das Einatmen."),
        ("still", 1),
        ("teil", "ruhig"),
        ("ruhig", 2, 6),
        ("teil", "hoeren"),
        ("sag", "Lass den Atem jetzt ganz frei. Hör noch einen Moment, was um dich herum ist. "
                "Die Geräusche kommen und gehen, du musst nichts damit tun."),
        ("still", 12),
        ("sag", "Spür die Bank unter dir und die Füße auf dem Boden. "
                "Wenn du so weit bist, öffne die Augen und schau dich in Ruhe um."),
        ("rest", None),
    ],
    10: [
        ("teil", "ankommen"),
        ("still", 3),
        ("sag", "Du sitzt. Spür, wie die Bank dich trägt. Du musst gerade nichts halten und nichts leisten."),
        ("still", 6),
        ("sag", "Lass den Blick langsam wandern, ganz gemächlich, nach links und nach rechts. "
                "Such dir etwas Ruhiges, auf dem die Augen bleiben dürfen. Ein Baum, der Himmel, der Boden vor dir."),
        ("still", 10),
        ("sag", "Lass die Schultern sinken. Lös den Kiefer, die Zunge liegt locker im Mund. "
                "Die Hände liegen einfach da, wo sie liegen."),
        ("still", 8),
        ("sag", "Wenn du magst, schließ jetzt die Augen. Offen lassen geht genauso."),
        ("still", 4),
        ("sag", "Wir beginnen mit dem doppelten Einatmen. Das macht dein Körper von selbst, "
                "nach dem Weinen oder kurz vor dem Einschlafen. So geht es: durch die Nase einatmen, "
                "oben noch einen kleinen Zug drauf, und dann ganz langsam durch den Mund ausatmen. "
                "Ich zähle die ersten Runden mit."),
        ("still", 2),
        ("teil", "seufzer"),
        ("seufzer", 4, 6),
        ("sag", "Mach allein weiter, in diesem Rhythmus. Ich sag dir, wenn es weitergeht."),
        ("seufzer", 0, 5),
        ("sag", "Noch ein paar Runden. Das Ausatmen ist das Wichtige, lass es lang werden."),
        ("seufzer", 0, 4),
        ("teil", "ruhig_intro"),
        ("sag", "Lass das doppelte Einatmen jetzt los. Atme ruhig durch die Nase, "
                "und lass das Ausatmen etwas länger sein als das Einatmen."),
        ("still", 1),
        ("teil", "ruhig"),
        ("ruhig", 3, 9),
        ("sag", "Wenn die Gedanken wandern, ist das in Ordnung. Komm einfach zurück zum langen Ausatmen."),
        ("ruhig", 0, 11),
        ("teil", "hoeren"),
        ("sag", "Lass den Atem jetzt ganz frei, er findet sein Tempo allein. "
                "Hör, was um dich herum ist. Vögel, Wind, Schritte, ein Auto in der Ferne. "
                "Alles darf da sein, du musst nichts damit tun."),
        ("still", 35),
        ("sag", "Spür noch einmal, wie ruhig es in dir geworden ist. Nicht perfekt, einfach ruhiger."),
        ("still", 10),
        ("sag", "Spür die Bank unter dir und die Füße auf dem Boden. "
                "Wenn du so weit bist, öffne die Augen, schau dich in Ruhe um, und geh weiter in deinem Tempo."),
        ("rest", None),
    ],
}
