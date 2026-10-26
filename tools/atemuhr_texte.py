"""Texte der Atemuhr (1, 3, 5, 7, 10 Min) — die geführte Stimme zu den Dauer-Karten oben auf der Startseite.

3, 5 und 10 Min stehen so in TEXTE.md; 1 und 7 Min fehlten dort und sind am 26.10.2026 per Whisper aus den
alten Aufnahmen (audio/atem-N.mp3, Edge) zurückgeholt – Wortlaut unverändert, nur neu gesprochen.
„laaang“ (5 Min) ist „lang“, so wie es die alte Aufnahme gesagt hat.

Die Stillen sind die der alten Aufnahmen (gemessen), alle dehnbar – der Bau gleicht damit die andere
Sprechdauer aus. Die Kugel läuft mit Stimme immer „Ruhig“ 4·6 (index.html), die Tonspur gibt keinen Plan vor.
Einträge wie in sitzen_texte.py: ("sag", schlüssel), ("still", s) oder ("still", s, "dehnbar").
"""

S = {
    # 1 Minute
    "1_1": "Eine Minute nur für dich. Schließ die Augen. Atme tief ein – und lass den Atem lang und langsam wieder los.",
    "1_2": "Weiter so. Einatmen – und lang ausatmen. Sonst gibt es gerade nichts zu tun.",
    "1_3": "Noch ein letzter tiefer Atemzug – und komm langsam zurück. Gut so.",
    # 3 Minuten – Kurz durchatmen
    "3_1": "Willkommen. Setz dich bequem hin, die Füße auf dem Boden, die Hände locker. Wenn du magst, schließ die Augen.",
    "3_2": "Atme einmal tief ein – und lass den Atem lang und langsam wieder los.",
    "3_3": "Und noch einmal: tief einatmen – und ganz langsam ausatmen.",
    "3_4": "Jetzt lass deinen Atem in seinen eigenen Rhythmus finden. Du musst nichts verändern. Nur spüren, wie die Luft ein- und ausströmt.",
    "3_5": "Wenn du magst, lass die Ausatmung ein kleines bisschen länger werden als die Einatmung. Das beruhigt den Körper ganz von selbst.",
    "3_6": "Wenn Gedanken kommen, ist das völlig in Ordnung. Bemerke sie kurz – und kehre dann zum Atem zurück.",
    "3_7": "Noch ein paar ruhige Atemzüge. Einatmen. Und lang ausatmen.",
    "3_8": "Spüre zum Abschluss noch einmal deinen ganzen Körper. Bewege langsam Finger und Zehen – und öffne die Augen, wenn du so weit bist. Gut gemacht.",
    # 5 Minuten – Zur Ruhe kommen
    "5_1": "Willkommen. Nimm dir einen Moment, um gut anzukommen. Setz dich aufrecht, aber entspannt hin. Die Schultern dürfen sinken. Schließ die Augen, wenn sich das gut anfühlt.",
    "5_2": "Atme tief ein durch die Nase – und lass den Atem mit einem langen Ausatmen wieder gehen. Als würdest du etwas ablegen, das du nicht mehr tragen musst.",
    "5_3": "Noch einmal: einatmen – und lang ausatmen.",
    "5_4": "Jetzt lass den Atem ganz natürlich fließen und richte deine Aufmerksamkeit auf die Stelle, wo du ihn am deutlichsten spürst. Vielleicht an den Nasenflügeln. Vielleicht im Brustkorb. Vielleicht in der Bauchdecke, die sich hebt und senkt.",
    "5_5": "Bleib einfach dort. Atemzug für Atemzug. Einatmen – der Bauch wird weit. Ausatmen – alles wird weich.",
    "5_6": "Wenn du abgeschweift bist: kein Problem. Genau das ist die Übung. Bemerken – und freundlich zurückkommen zum Atem.",
    "5_7": "Lass die Ausatmung jetzt bewusst etwas länger werden. Zähle innerlich mit, wenn dir das hilft: einatmen, zwei, drei, vier – ausatmen, zwei, drei, vier, fünf, sechs.",
    "5_8": "Und jetzt lass auch das Zählen los. Nur noch atmen. Nur noch da sein.",
    "5_9": "Nimm zum Abschluss noch einen tiefen Atemzug. Spüre deinen Körper auf dem Stuhl, deine Füße auf dem Boden. Bewege sanft die Hände – und öffne langsam die Augen. Nimm diese Ruhe mit in deinen Tag.",
    # 7 Minuten
    "7_1": "Willkommen. Sieben Minuten, in denen du nichts leisten musst. Setz dich bequem hin und schließ die Augen.",
    "7_2": "Atme zweimal tief ein – und lass den Atem jeweils lang und hörbar wieder gehen.",
    "7_3": "Und jetzt lass den Atem ganz von allein fließen. Du beobachtest nur.",
    "7_4": "Spüre, wo du den Atem am deutlichsten wahrnimmst. An der Nase, im Brustkorb oder im Bauch. Bleib dort.",
    "7_5": "Wenn Gedanken kommen, ist das in Ordnung. Bemerke sie – und kehre freundlich zum Atem zurück.",
    "7_6": "Lass die Ausatmung etwas länger werden als die Einatmung. Das beruhigt den Körper von selbst.",
    "7_7": "Mit jedem Ausatmen ein bisschen weicher. Ein bisschen mehr hier.",
    "7_8": "Jetzt lass auch meine Worte los. Nur du und dein Atem.",
    "7_9": "Komm langsam zurück. Spüre den Boden, den Raum, deinen Körper. Bewege Finger und Zehen – und öffne die Augen, wenn du so weit bist.",
    # 10 Minuten – Ganz bei dir
    "10_1": "Willkommen zu deiner Atemmeditation. Nimm dir Zeit, eine gute Haltung zu finden: aufrecht, stabil, entspannt. Die Hände liegen locker auf den Oberschenkeln. Schließ die Augen – oder lass den Blick weich auf einen Punkt vor dir sinken.",
    "10_2": "Beginne mit drei tiefen Atemzügen. Einatmen durch die Nase – und lange, hörbar ausatmen durch den Mund.",
    "10_3": "Noch einmal tief einatmen – und alles loslassen.",
    "10_4": "Und ein drittes Mal: einatmen – ausatmen. Der Körper darf schwer werden.",
    "10_5": "Wandere jetzt kurz durch deinen Körper. Entspanne die Stirn. Die Augen. Den Kiefer. Lass die Schultern sinken. Den Bauch weich werden.",
    "10_6": "Und nun lass den Atem ganz von allein kommen und gehen. Du beobachtest nur. Wie eine Welle, die anrollt – und sich wieder zurückzieht.",
    "10_7": "Spüre die kleine Pause am Ende jeder Ausatmung. Diesen stillen Moment, bevor der nächste Atemzug von selbst beginnt.",
    "10_8": "Wenn Gedanken auftauchen – Pläne, Erinnerungen, To-dos – dann ist das kein Fehler. Das macht der Kopf so. Bemerke es, lächle innerlich kurz – und komm zurück zum Atem.",
    "10_9": "Vertiefe jetzt sanft den Rhythmus: Einatmen, ungefähr vier Sekunden. Ausatmen, ungefähr sechs Sekunden. Die Kugel auf deinem Bildschirm atmet genau in diesem Takt – falls die Augen offen sind, kannst du ihr folgen.",
    "10_10": "Mit jeder Ausatmung ein bisschen ruhiger. Ein bisschen tiefer bei dir.",
    "10_11": "Lass jetzt auch diese Anleitung los. Nur du und dein Atem. Ich bin still.",
    "10_12": "Kehre langsam zurück. Spüre deinen Körper, den Kontakt zum Boden, die Geräusche um dich herum.",
    "10_13": "Atme noch einmal tief ein – und aus. Bewege Finger und Zehen, streck dich, wenn du magst. Und öffne in deinem Tempo die Augen. Du hast dir gerade zehn Minuten geschenkt. Das zählt.",
}

D = "dehnbar"
VORLAUF = 4.2      # Platz für den Anfangsgong der App, wie in den alten Aufnahmen

# Stille vor jedem Absatz ab dem zweiten (Sekunden, aus den alten Aufnahmen gemessen)
_PAUSEN = {
    1: [8.1, 21.7],
    3: [7.3, 9.4, 9.5, 16.1, 18.3, 22.7, 22.7],
    5: [9.8, 12.0, 12.0, 21.1, 25.6, 29.1, 34.7, 40.4],
    7: [12.2, 16.9, 29.5, 41.2, 46.8, 52.7, 64.2, 81.6],
    10: [13.2, 15.6, 15.7, 18.2, 25.7, 38.2, 44.5, 50.8, 57.0, 63.3, 94.6, 15.7],
}

TEXTE = {}
for _min, _pausen in _PAUSEN.items():
    TEXTE[_min] = [("still", VORLAUF), ("sag", f"{_min}_1")]
    for _n, _p in enumerate(_pausen, start=2):
        TEXTE[_min] += [("still", _p, D), ("sag", f"{_min}_{_n}")]
