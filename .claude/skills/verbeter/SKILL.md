---
name: verbeter
description: Verbeter een bestaande game, zoals een bug, een nieuwe feature of een balansprobleem, of iets wat vrienden zeiden na het spelen.
argument-hint: <game> <wat er beter moet>
---

Verbetering: $ARGUMENTS

1. Zoek de game in `games/`. Is niet duidelijk welke game bedoeld wordt, kijk dan in `games/games.json` en vraag het als er meerdere kunnen.
2. Zet de wens met datum onderaan `games/<game>/prompt.md` onder `## Wensen`.
3. Kies wie het werk doet:
   - **bug of iets wat niet werkt** → `bouwer` (vraag eerst de `tester` om het te reproduceren als het vaag is);
   - **nieuwe regel, feature of balans** → `ontwerper` (ontwerp bijwerken) → `bouwer`;
   - **mooier, duidelijker, meer geluid** → `kunstenaar`;
   - **grappiger** → `gekke-bedenker` → `ontwerper` → `bouwer`.
4. Daarna altijd `tester`. Bij 🔴 of 🟠 terug naar de bouwer, maximaal 3 rondes.
5. Commit en push naar `main` (`game: <wat>`), en vertel Jort in een paar regels wat er veranderd is, met de speellink.
