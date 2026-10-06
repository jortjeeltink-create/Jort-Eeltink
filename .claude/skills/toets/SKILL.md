---
name: toets
description: Zet een toets of deadline in de agenda en maak een leerplanning en oefenvragen.
argument-hint: <vak> <datum> <stof>, bijv. "biologie 14 oktober H3 en H4"
---

Nieuwe toets of deadline: $ARGUMENTS

1. Haal vak, datum en stof uit de input. Ontbreekt het vak of de datum, vraag daar dan naar. De stof mag later.
2. Bestaat het vak-overzicht `10-vakken/<vak>/<vak>.md` nog niet, laat `ordenaar` het eerst aanmaken.
3. Laat daarna **tegelijk** werken:
   - `planner`: zet het in de agenda en maak een leerplanning tot de datum.
   - `overhoorder`: maak oefenmateriaal over deze stof uit de bestaande notities. Alleen bij een toets, niet bij een inleverdeadline.
4. Meldt de overhoorder dat er stof ontbreekt in het brein, zeg dat dan tegen Jort, met de tip om aantekeningen of een samenvatting toe te voegen met `/vang`.
5. Laat zien: de datum met aftelling, de leerplanning in het kort, en waar de oefenvragen staan. Commit en push.
