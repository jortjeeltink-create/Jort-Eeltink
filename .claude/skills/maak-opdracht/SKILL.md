---
name: maak-opdracht
description: Maakt een schoolopdracht van Jort helemaal af, in Word en PowerPoint, met de uitgewerkte tekst, een spreektekst per dia en een spiekbrief met wat hij moet weten. Gebruik dit als Jort zegt "maak opdracht ...", "maak MABU week 2" of "maak deze opdracht voor me".
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

Jort werkt op school alleen met Microsoft Word en PowerPoint. Lever dus alleen `.docx` en `.pptx` op.

| Bestand | Inhoud |
|---|---|
| `opdracht.docx` | Het inleverbare product helemaal uitgeschreven, met een voorblad: de tekst, analyse, post, brief of het script. Houd je aan het woordaantal, en zet de APA-bronnenlijst onderaan. |
| `presentatie.pptx` | De PowerPoint (zie stap 4). |
| `spreektekst.docx` | Per dia precies wat Jort zegt, in spreektaal, met de tijd per dia. Samen past het binnen de presentatieduur (ongeveer 130 woorden per minuut). |
| `spiekbrief.docx` | Wat Jort moet weten: de kernboodschap in 3 zinnen, de belangrijkste begrippen met uitleg in een tabel, 5 vragen die de klas of docent kan stellen met een kort antwoord, en een checklist van wat hij nog zelf moet doen (foto's, opnemen, uploaden). |

Hoe je de Word-bestanden maakt:
1. Schrijf eerst Markdown in een tijdelijk bestand, bijvoorbeeld `opdracht.md`.
2. Zet het om naar Word: `node tools/md-naar-word.js opdracht.md opdracht.docx --voorblad "Titel|Vak · week N"`. Alleen de opdracht krijgt een voorblad.
3. Verwijder daarna de `.md`-bestanden. Laat `slides.json` staan, zodat de PowerPoint later opnieuw gebouwd kan worden.
4. `[VUL IN: ...]` en `[BRON ZOEKEN: ...]` worden in Word geel gemarkeerd.

## 4. PowerPoint
- Schrijf `slides.json` en bouw de presentatie met `node tools/maak-deck.js werk/.../slides.json`. Draai eerst `npm install` als `node_modules` ontbreekt.
- Bovenin `tools/maak-deck.js` staan de slidetypes. Wissel ze af: begin met `titel` en eindig met `bronnen` en `afsluiting`. Gebruik `kaarten` voor PESTEL of Porter, `matrix` voor SWOT of Power-Interest, `tijdlijn` voor een tijdlijn, `getal` voor een opvallend cijfer en `stelling` voor een vraag aan de klas.
- Thema's: `digitaal` (standaard), `zakelijk`, `groen` (MVO en duurzaamheid) en `energiek` (marketing).
- Zet weinig tekst op een dia, maximaal 5 korte punten. Het verhaal staat in `notities`: daar komt de spreektekst van die dia, zodat Jort die ook in PowerPoint ziet.
- Plan ongeveer 1 dia per minuut spreektijd, plus de titel-, bronnen- en afsluitdia.
- Eigen foto's van Jort komen als `afbeelding`-dia. Bestaat het bestand nog niet, dan verschijnt er een vak met de naam van de foto die erin moet.

## 5. Controle
- Render de dia's en de Word-bestanden en bekijk ze: `soffice --headless --convert-to pdf <bestand>`, daarna `pdftoppm -jpeg -r 70`. Ontbreekt Impress of Writer, installeer dan eerst `libreoffice-impress` en `libreoffice-writer`.
- Let op tekst die buiten een vak loopt, overlap en lege dia's. Los dat op in `slides.json` en bouw opnieuw.
- Controleer de taal: korte zinnen, duidelijk Nederlands, geen AI-woorden (zie `CLAUDE.md`). Tel de woorden van de opdracht, zonder de bronnenlijst.

## 6. Opleveren
- Commit en push.
- Stuur `opdracht.docx` en `presentatie.pptx` naar Jort met SendUserFile.
- Geef in de chat een kort overzicht:
  - wat je hebt gemaakt;
  - de kernboodschap die hij moet vertellen;
  - wat hij nog zelf moet doen.
