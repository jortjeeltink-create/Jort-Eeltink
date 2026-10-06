---
name: nieuwe-game
description: Maak een nieuwe party game van een idee. Het hele team werkt eraan, van gekke ideeën tot geteste game die live met vrienden te spelen is.
argument-hint: <je idee voor een game>
---

Jort wil een nieuwe game:

$ARGUMENTS

Volg **De werkwijze voor een nieuwe game** uit `CLAUDE.md`, stap voor stap, met de agents van het team.

1. Is er geen idee opgegeven, vraag dan in één zin wat voor game Jort wil. Is het idee heel kort ("iets met kippen"), ga dan gewoon aan de slag: de gekke bedenker vult het in.
2. Is `node_modules/` er nog niet, draai dan eerst `npm install`.
3. Meld Jort na elke stap in één regel wat er gebeurd is (bijv. "🤪 De bedenker kwam met: kippen op rolschaatsen die eieren leggen als je remt").
4. Ga pas naar **Live zetten** als aan **Klaar is pas klaar als** is voldaan, of als er na 3 verbeterrondes nog maar kleine dingen over zijn.
5. Sluit af met:
   - de speellink: `https://jortjeeltink-create.github.io/Jort-Eeltink/games/<game>/`
   - in 2–3 regels hoe het spel werkt en de grappigste dingen erin
   - het cijfer van de speeltester
   - een tip voor een volgende verbetering (`/gekker <game>` of `/verbeter <game> …`)
