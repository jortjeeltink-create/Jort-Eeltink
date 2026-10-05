---
name: maak-opdracht
description: Maakt een schoolopdracht van Jort helemaal af, met een PowerPoint, de uitgewerkte tekst, een spreektekst per dia en een spiekbrief met wat hij moet weten. Gebruik dit als Jort zegt "maak opdracht ...", "maak MABU week 2" of "maak deze opdracht voor me".
---

# Opdracht helemaal maken

Jort wil dat de opdracht helemaal af is: een mooie PowerPoint, de uitgewerkte tekst, precies wat hij moet zeggen en wat hij moet weten. Lever dus geen tips of half werk. Lever het eindproduct.

## 1. Opdracht opzoeken
- Zoek de opdracht op in `docs/studieoverzicht.md`. Noteer de eisen: woordaantal, vorm, verplichte onderdelen en de presentatieduur.
- Heeft Jort een opdrachtbeschrijving, PowerPoint of rubric meegestuurd? Dan gaat die voor.
- Vraag alleen iets als het echt niet anders kan, bijvoorbeeld als hij nog een bedrijf moet kiezen. Kies anders zelf iets logisch en zeg welke keuze je hebt gemaakt.

## 2. Onderzoek
- Zoek actuele, betrouwbare bronnen met WebSearch en WebFetch. Controleer elk feit en elk cijfer dat je gebruikt.
- Verzin nooit een bron, cijfer, citaat, bezoek of ervaring. Is iets niet te vinden, laat het dan weg of zet `[VUL IN: ...]`.

## 3. Bestanden maken
Maak de map `werk/<vak>/week-<nr>-<onderwerp>/`. Gebruik als vakmap `mabu`, `dddm`, `communication`, `managing` of `marketing`. Zet daar deze bestanden in:

| Bestand | Inhoud |
|---|---|
| `opdracht.md` | Het inleverbare product helemaal uitgeschreven: de tekst, analyse, post, brief of het script. Houd je aan het woordaantal, en zet de APA-bronnenlijst onderaan. |
| `slides.json` → `presentatie.pptx` | De PowerPoint (zie stap 4). |
| `spreektekst.md` | Per dia precies wat Jort zegt, in spreektaal, met de tijd per dia. Samen past het binnen de presentatieduur (ongeveer 130 woorden per minuut). |
| `spiekbrief.md` | Wat Jort moet weten: de kernboodschap in 3 zinnen, de belangrijkste begrippen met uitleg, 5 vragen die de klas of docent kan stellen met een kort antwoord, en een checklist van wat hij nog zelf moet doen (foto's, opnemen, uploaden). |

## 4. PowerPoint
- Schrijf `slides.json` en bouw de presentatie met `node tools/maak-deck.js werk/.../slides.json`. Draai eerst `npm install` als `node_modules` ontbreekt.
- Bovenin `tools/maak-deck.js` staan de slidetypes. Wissel ze af: begin met `titel` en eindig met `bronnen` en `afsluiting`. Gebruik `kaarten` voor PESTEL of Porter, `matrix` voor SWOT of Power-Interest, `tijdlijn` voor een tijdlijn, `getal` voor een opvallend cijfer en `stelling` voor een vraag aan de klas.
- Thema's: `digitaal` (standaard), `zakelijk`, `groen` (MVO en duurzaamheid) en `energiek` (marketing).
- Zet weinig tekst op een dia, maximaal 5 korte punten. Het verhaal staat in `notities`: daar komt de spreektekst van die dia, zodat Jort die ook in PowerPoint ziet.
- Plan ongeveer 1 dia per minuut spreektijd, plus de titel-, bronnen- en afsluitdia.
- Eigen foto's van Jort komen als `afbeelding`-dia. Bestaat het bestand nog niet, dan verschijnt er een vak met de naam van de foto die erin moet.

## 5. Controle
- Render de dia's en bekijk ze: `soffice --headless --convert-to pdf presentatie.pptx`, daarna `pdftoppm -jpeg -r 70`. Als Impress ontbreekt, installeer je eerst `libreoffice-impress`.
- Let op tekst die buiten een vak loopt, overlap en lege dia's. Los dat op in `slides.json` en bouw opnieuw.
- Controleer de taal: korte zinnen, duidelijk Nederlands, geen AI-woorden (zie `CLAUDE.md`). Tel de woorden van `opdracht.md`.

## 6. Opleveren
- Commit en push.
- Stuur de `presentatie.pptx` naar Jort met SendUserFile.
- Geef in de chat een kort overzicht:
  - wat je hebt gemaakt;
  - de kernboodschap die hij moet vertellen;
  - wat hij nog zelf moet doen.
