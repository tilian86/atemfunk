"""Texte der festen Meditation „Innehalten" (3, 5, 10, 15 Min) — fertig gemischt
mit Waldkulisse, für zu Hause oder mit Kopfhörern.

Aufbau, psychologisch begründet:
  1. Ankommen      — Kontakt spüren, Raum orientieren (Sicherheitssignal fürs Nervensystem)
  2. Atem          — verlängertes Ausatmen 4 · 6, erst mit Takt, dann frei
  3. Körper        — kurzer Scan, „weicher werden lassen", nichts erzwingen
  4. Gedanken      — bemerken, benennen, weiterziehen lassen (Defusion)
  5. Freundlichkeit — Selbstmitgefühl: anerkennen, gemeinsames Menschsein, Wunsch
  6. Schluss       — Bilanz, nächster Schritt, zurück in den Raum

Ein Eintrag ist ("sag", schlüssel), ("still", sekunden) oder ("still", sekunden, "dehnbar")
— dehnbare Stillen nehmen die Restzeit auf. ("takt", n_mit_stimme, n_gesamt) sind
Atemrunden 4 · 6 (die ersten mit „Ein." / „Und langsam aus."). ("teil", name) setzt eine
Zeitmarke, die für beide Stimmen gleich ist; „takt" und „takt_ende" steuern die Kugel.
"""

RUHIG_TAKT = [("Einatmen", 4), ("Ausatmen", 6)]
ZUEGE = {"r_ein": "Ein.", "r_aus": "Und langsam aus."}

S = {
    # Ankommen
    "a1": "Schön, dass du dir diese Zeit nimmst. Setz dich so hin, dass du eine Weile bleiben kannst. Aufrecht, aber nicht steif.",
    "a2": "Spür zuerst, wo dein Körper Kontakt hat. Die Füße auf dem Boden. Das Gewicht auf dem Sitz. Du wirst getragen, du musst dich nicht selbst halten.",
    "a3": "Lass den Blick einmal langsam durch den Raum wandern. Nach links, nach rechts. Der Körper darf wissen, wo er ist. Das ist der erste Schritt, um sich sicher zu fühlen.",
    "a4": "Wenn du magst, schließ jetzt die Augen. Oder lass sie halb offen, mit weichem Blick auf den Boden.",
    "a5": "Lass die Schultern sinken. Den Kiefer locker. Die Zunge liegt weich im Mund. Die Hände liegen einfach da.",
    # Atem
    "b1": "Wir beginnen mit dem Atem. Atme ein paarmal etwas tiefer ein, und lass das Ausatmen länger werden als das Einatmen. Ein langes Ausatmen sagt deinem Nervensystem: Es ist gerade nichts zu tun.",
    "b2": "Ich gebe dir für die ersten Runden den Takt. Vier ein, sechs aus.",
    "b3": "Jetzt lass den Atem wieder in seinem eigenen Tempo gehen. Du musst nichts mehr steuern. Nur spüren, wo er sich am deutlichsten zeigt. Am Bauch, an der Brust, oder an der Nase.",
    "b4": "Wenn die Aufmerksamkeit abwandert, ist das kein Fehler. Es ist das, was der Geist tut. Der Moment, in dem du es bemerkst, ist der Moment, in dem du übst. Dann kehrst du einfach zurück zum nächsten Atemzug.",
    # Körper
    "c1": "Lass den Atem im Hintergrund weiterlaufen und geh mit der Aufmerksamkeit durch den Körper. Nicht, um etwas zu verändern. Nur, um zu bemerken, was da ist.",
    "ck": "Die Füße, die Beine, der Bauch, die Brust. Die Hände, die Schultern, das Gesicht. Wo etwas festhält, lass es ein wenig weicher werden.",
    "c2": "Die Füße. Die Unterschenkel, die Knie, die Oberschenkel. Spür sie einfach von innen.",
    "c3": "Der Bauch, der sich mit dem Atem hebt und senkt. Der Rücken, breit und lang. Die Brust.",
    "c4": "Die Hände. Die Arme. Die Schultern. Wo etwas festhält, lass es weicher werden, so weit es von allein geht. Was nicht loslässt, darf bleiben.",
    "c5": "Das Gesicht. Die Stirn glatt. Die Augen ruhig. Der Raum zwischen den Augenbrauen weit.",
    "c6": "Und jetzt der ganze Körper auf einmal. Sitzend, atmend, getragen.",
    # Gedanken
    "d1": "Wahrscheinlich sind inzwischen Gedanken gekommen. Pläne, Erinnerungen, Bewertungen. Das ist normal. Der Verstand produziert Gedanken, so wie das Herz schlägt.",
    "d2": "Du kannst einen Gedanken bemerken und ihn leise benennen. Da ist Planen. Da ist Sorge. Da ist Erinnern. Und dann lässt du ihn weiterziehen, wie eine Wolke, und kommst zurück zum Atem.",
    "d3": "Du bist nicht deine Gedanken. Du bist die Person, die sie bemerkt. Das ist ein großer Unterschied, und er macht frei.",
    "d4": "Manche Gedanken kommen immer wieder. Auch das ist in Ordnung. Du musst sie nicht wegschieben und nicht zu Ende denken. Nur bemerken, benennen, zurückkommen. So oft wie nötig.",
    # Freundlichkeit
    "e1": "Zum Schluss ein Moment der Freundlichkeit. Mit dir selbst. Wenn du magst, leg eine Hand auf die Brust oder auf den Bauch und spür die Wärme.",
    "e2": "Vielleicht ist gerade etwas schwer in deinem Leben. Vielleicht bist du müde, oder ungeduldig mit dir. Du darfst das anerkennen, ohne es zu bewerten. Das gehört zum Menschsein. Jeder kennt das.",
    "e3": "Und dann, leise, in deinen Worten: Möge ich freundlich mit mir sein. Möge ich mir das Leben nicht schwerer machen, als es ist.",
    "e4": "Wenn du magst, weite das aus. Auf einen Menschen, der dir wichtig ist. Möge es dir gut gehen. Und auf alle, die gerade irgendwo sitzen und versuchen, ruhiger zu werden.",
    # Schluss
    "f1": "Nimm noch einmal einen bewussten Atemzug. Spür, wie es dir jetzt geht. Nicht perfekt, einfach ein wenig ruhiger, oder ein wenig klarer.",
    "f2": "Überleg kurz: Was ist als Nächstes dran? Nur der nächste Schritt, nicht der ganze Tag.",
    "f3": "Dann komm zurück in den Raum. Beweg die Finger und Zehen, roll die Schultern. Und wenn du so weit bist, öffne die Augen.",
}

TEXTE = {
    3: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 3),
        ("sag", "a2"), ("still", 5, "dehnbar"),
        ("sag", "a4"), ("still", 2),
        ("sag", "b1"), ("still", 2),
        ("sag", "b2"), ("still", 1),
        ("teil", "takt"), ("takt", 2, 2),
        ("teil", "takt_ende"),
        ("sag", "b3"), ("still", 8, "dehnbar"),
        ("sag", "ck"), ("still", 8, "dehnbar"),
        ("teil", "schluss"),
        ("sag", "f1"), ("still", 4),
        ("sag", "f3"),
    ],
    5: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 4),
        ("sag", "a2"), ("still", 6, "dehnbar"),
        ("sag", "a4"), ("still", 3),
        ("sag", "a5"), ("still", 4),
        ("sag", "b1"), ("still", 2),
        ("sag", "b2"), ("still", 1),
        ("teil", "takt"), ("takt", 2, 4),
        ("teil", "takt_ende"),
        ("sag", "b3"), ("still", 12, "dehnbar"),
        ("sag", "c1"), ("still", 3),
        ("sag", "ck"), ("still", 12, "dehnbar"),
        ("sag", "e1"), ("still", 5),
        ("sag", "e3"), ("still", 10, "dehnbar"),
        ("teil", "schluss"),
        ("sag", "f1"), ("still", 4),
        ("sag", "f3"),
    ],
    10: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 5),
        ("sag", "a2"), ("still", 8, "dehnbar"),
        ("sag", "a3"), ("still", 8, "dehnbar"),
        ("sag", "a4"), ("still", 3),
        ("sag", "a5"), ("still", 6),
        ("sag", "b1"), ("still", 2),
        ("sag", "b2"), ("still", 1),
        ("teil", "takt"), ("takt", 3, 6),
        ("teil", "takt_ende"),
        ("sag", "b3"), ("still", 15, "dehnbar"),
        ("sag", "b4"), ("still", 20, "dehnbar"),
        ("sag", "c1"), ("still", 3),
        ("sag", "c2"), ("still", 6),
        ("sag", "c3"), ("still", 6),
        ("sag", "c4"), ("still", 6),
        ("sag", "c5"), ("still", 5),
        ("sag", "c6"), ("still", 15, "dehnbar"),
        ("sag", "d1"), ("still", 4),
        ("sag", "d2"), ("still", 15, "dehnbar"),
        ("sag", "d3"), ("still", 12, "dehnbar"),
        ("sag", "e1"), ("still", 5),
        ("sag", "e2"), ("still", 5),
        ("sag", "e3"), ("still", 8),
        ("sag", "e4"), ("still", 15, "dehnbar"),
        ("teil", "schluss"),
        ("sag", "f1"), ("still", 5),
        ("sag", "f2"), ("still", 6),
        ("sag", "f3"),
    ],
    15: [
        ("teil", "ankommen"), ("still", 3),
        ("sag", "a1"), ("still", 5),
        ("sag", "a2"), ("still", 10, "dehnbar"),
        ("sag", "a3"), ("still", 10, "dehnbar"),
        ("sag", "a4"), ("still", 3),
        ("sag", "a5"), ("still", 8),
        ("sag", "b1"), ("still", 2),
        ("sag", "b2"), ("still", 1),
        ("teil", "takt"), ("takt", 3, 9),
        ("teil", "takt_ende"),
        ("sag", "b3"), ("still", 25, "dehnbar"),
        ("sag", "b4"), ("still", 35, "dehnbar"),
        ("sag", "c1"), ("still", 3),
        ("sag", "c2"), ("still", 8),
        ("sag", "c3"), ("still", 8),
        ("sag", "c4"), ("still", 8),
        ("sag", "c5"), ("still", 6),
        ("sag", "c6"), ("still", 25, "dehnbar"),
        ("sag", "d1"), ("still", 5),
        ("sag", "d2"), ("still", 20, "dehnbar"),
        ("sag", "d3"), ("still", 10),
        ("sag", "d4"), ("still", 30, "dehnbar"),
        ("sag", "e1"), ("still", 6),
        ("sag", "e2"), ("still", 8),
        ("sag", "e3"), ("still", 12),
        ("sag", "e4"), ("still", 30, "dehnbar"),
        ("teil", "schluss"),
        ("sag", "f1"), ("still", 6),
        ("sag", "f2"), ("still", 8),
        ("sag", "f3"),
    ],
}
