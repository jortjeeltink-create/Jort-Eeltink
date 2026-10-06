# Schoolwerk Jort

Opleiding: Tio, schooljaar 2026–2027. Specialisatie: Digital Business & Generative AI.
Het volledige overzicht van vakken en opdrachten (week 1 t/m 11) staat in `docs/studieoverzicht.md`. Lees dat eerst.

## Opdracht maken
Zegt Jort "maak opdracht X"? Volg dan `.claude/skills/maak-opdracht/SKILL.md`. Hij krijgt het eindproduct: een PowerPoint, de uitgewerkte tekst, een spreektekst per dia en een spiekbrief.
Jort gebruikt op school alleen Microsoft: lever alles op als **Word (.docx)** en **PowerPoint (.pptx)**, nooit als losse .md-bestanden.
- PowerPoint: `node tools/maak-deck.js <slides.json>`
- Word: `node tools/md-naar-word.js <in.md> <uit.docx> [--voorblad "Titel|Ondertitel"]`

Draai eerst `npm install`.

## Regels bij het maken van opdrachten
- Schrijf in duidelijk Nederlands, met korte zinnen. Gebruik geen moeilijke of overdreven AI-achtige woorden, zoals "cruciaal", "naadloos", "in het huidige digitale landschap" of "een wereld van mogelijkheden".
- Verzin geen bronnen, cijfers, bedrijfsbezoeken of persoonlijke ervaringen. Een bron gebruik je alleen als je hem echt hebt gecontroleerd. Bronnen staan in APA 7.
- Waar iets van Jort zelf nodig is (een eigen ervaring, een foto of een bezoek), zet je `[VUL IN: ...]` met wat er moet komen.
- Houd je aan de woordlimiet uit de opdracht.
- Sla werk op in `werk/<vak>/week-<nr>-<onderwerp>/`. Gebruik als vakmap `mabu`, `dddm`, `communication`, `managing` of `marketing`.
- Zeg eerlijk wat niet door AI gemaakt kan worden, zoals een podcast opnemen, een vlog, een bezoek, een DataCamp-module of het sollicitatiegesprek. Maak dan wel de voorbereiding: een script, een vragenlijst of een spiekbrief.
