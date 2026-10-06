---
name: overhoor
description: Laat je overhoren over een vak of onderwerp, met vragen uit je eigen notities.
argument-hint: <vak of onderwerp>
---

Onderwerp: $ARGUMENTS

1. Zoek in `60-oefenen/` een passend oefenbestand. Is er geen, of is het ouder dan de nieuwste notitie over het onderwerp, delegeer dan eerst aan `overhoorder` om het te maken of aan te vullen.
2. Overhoor Jort **zelf**, als gesprek (niet via een agent):
   - Stel één vraag tegelijk en wacht op het antwoord. Begin met de vragen onder **Nog lastig**.
   - Geef na elk antwoord korte feedback: goed, bijna (wat ontbreekt er?), of fout (het juiste antwoord, waarom, en de `[[link]]` naar de notitie).
   - Laat het antwoord nooit zien voordat Jort heeft geantwoord. Bij "weet ik niet": eerst een hint, daarna pas het antwoord.
   - Standaard 10 vragen, of tot Jort wil stoppen.
3. Geef na afloop de score, wat goed ging en wat nog lastig is.
4. Delegeer aan `overhoorder` om de resultaten te verwerken. Geef per vraag mee: de vraag, Jorts antwoord en goed/bijna/fout. Commit en push.
