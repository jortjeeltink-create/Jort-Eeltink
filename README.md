# Jort-Eeltink
Voor school

## Opdrachtteam (app)
`app/opdrachtteam.html` is een app waarin je een opdracht kiest of plakt. Acht AI-agents werken hem dan samen uit:
- **Denker**: maakt het plan en de spiekbrief.
- **Creatief**: bedenkt ideeën en een sterke opening.
- **Rekenaar**: doet het rekenwerk.
- **Schrijver**: schrijft de opdracht uit.
- **Taal**: verbetert spelling en zinnen.
- **Jort-check**: checkt of het klinkt alsof jij het schreef.
- **Controleur**: checkt alle eisen. Bij fouten gaat het werk terug naar de Schrijver.
- **PowerPoint**: maakt de dia's met spreektekst.

Je krijgt alles in Word en PowerPoint: de opdracht (Word, met voorblad), de presentatie (PowerPoint), wat je moet zeggen (Word) en wat je moet weten (Word).
De app draait als Claude-artifact op je eigen Claude-account. Pas je `docs/studieoverzicht.md` aan? Draai dan `python3 app/bouw.py`.

## AI-agents voor schoolwerk
In `.claude/agents/` staan agents die je in Claude Code kunt gebruiken, voor alle vakken:

| Agent | Waarvoor |
|---|---|
| `maker` | Maakt je schoolopdrachten (teksten, analyses, posts, scripts, brieven) volgens `docs/studieoverzicht.md` |
| `uitleg-tutor` | Legt stof stap voor stap uit en helpt met hints |
| `overhoorder` | Overhoort je voor een toets |
| `schrijfcoach` | Geeft feedback op je verslagen en opstellen |
| `planner` | Maakt een studieplanning |

**Opdracht laten maken:** typ `/maak-opdracht MABU week 2` of gewoon "maak MABU week 2 voor me". Je krijgt een map in `werk/` met:
- `presentatie.pptx`, met de spreektekst in de notities;
- `opdracht.docx`, de uitgewerkte tekst met voorblad;
- `spreektekst.docx`, wat je per dia zegt;
- `spiekbrief.docx`, wat je moet weten, plus vragen en antwoorden.

**Andere agents:** vraag het gewoon in Claude Code, bijvoorbeeld:
- "Laat de maker een samenvatting maken van hoofdstuk 3 geschiedenis"
- "Overhoorder: overhoor me op mijn Franse woordjes"
- "@planner ik heb volgende week toetsen voor wiskunde en biologie"
