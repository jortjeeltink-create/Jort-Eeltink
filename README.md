# Jort-Eeltink
Voor school

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
- `opdracht.md`, de uitgewerkte tekst;
- `spreektekst.md`, wat je per dia zegt;
- `spiekbrief.md`, wat je moet weten, plus vragen en antwoorden.

**Andere agents:** vraag het gewoon in Claude Code, bijvoorbeeld:
- "Laat de maker een samenvatting maken van hoofdstuk 3 geschiedenis"
- "Overhoorder: overhoor me op mijn Franse woordjes"
- "@planner ik heb volgende week toetsen voor wiskunde en biologie"
