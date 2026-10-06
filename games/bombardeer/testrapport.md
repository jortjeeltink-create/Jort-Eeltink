# Testrapport bombardeer (2026-10-06)

**Oordeel:** ❌ eerst fixen (1 blokkerende bug op oudere iPhones; de rest werkt goed)

| Test | Uitslag | Updates/s | State | Rondes |
|---|---|---|---|---|
| `node --check games/bombardeer/game.js` | ✅ geen syntaxfouten | – | – | – |
| normaal: 4 spelers, 80 s (verlengd van 40 s: een ronde met 4 spelers duurt ±60 s + 3 s aftellen) | ✅ geslaagd, 0 fouten op alle apparaten | 19,7 | 1148 B | 1 (±60 s) |
| minimum: 2 spelers, 80 s (verlengd van 30 s: 3 levens elk, ±60–100 s) | ✅ geslaagd, 0 fouten | 19,9 | 816 B | 1 (±60 s) |
| druk: 3 apparaten + 5 bots = 8, 130 s (verlengd van 40 s: 7 ontploffingen, ±110 s) | ✅ geslaagd, 0 fouten | 19,7 | 1951 B | 1 (±92 s) |
| simulatie zonder browser: `update`/`bot` 60× per spelersaantal (2, 3, 4, 5, 8) | ✅ elke ronde eindigt, geen NaN/undefined/Infinity in de state | – | max 2,2 KB | 2p 61–103 s · 3p 79–104 s · 4p 57–63 s · 5p 71–79 s · 8p 106–115 s |
| randgevallen (simulatie): iedereen idle, knop spammen, knop vasthouden, iedereen-op-één-na weg, iedereen weg, kip-doelwit weg | ✅ eindigt altijd, juiste winnaar / gelijkspel | – | – | – |
| oude Safari (iOS 15) nagebootst: iPhone 13 zonder `ctx.roundRect` | ❌ `TypeError: c.roundRect is not a function`, beeld half leeg | – | – | – |

Screenshots bekeken: lobby (laptop, iPhone), spel (laptop, iPhone staand, Android liggend, iPad) en einde (laptop, iPhone, Android liggend), bij 2, 4 en 8 spelers.

## Bugs

- 🔴 **Oudere iPhones (iOS 15) en Chrome < 99: kroket, bovenbalk, kip en een deel van de spelers worden niet getekend.** `game.js:516-517` (`drawBomb`) gebruikt `c.roundRect(...)`. Dat bestaat pas vanaf Safari 16 en Chrome 99. Een iPhone 6s, 7 of SE (1e generatie) kan niet verder dan iOS 15. Zodra iemand de kroket heeft (bijna altijd), stopt `render` met een fout. Wat daarna had moeten komen, verschijnt dan niet: de bovenbalk ("JIJ HEBT HEM!" en de lontbalk), de kroket zelf (je ziet alleen een gele vlek), de kip, de spook-hint en alle spelers die in de volgorde ná de houder komen (dat kan jijzelf zijn). Zo is het spel op zo'n telefoon niet te spelen. **Reproduceren:** Playwright met iPhone 13 en `addInitScript(() => delete CanvasRenderingContext2D.prototype.roundRect)`, `?autohost=1&bots=3&autopilot=1` en starten. In `__party.stats.errors` staat dan `TypeError: c.roundRect is not a function`. **Fix:** teken de kroket als ovaal. Dat past ook beter bij een kroket: `c.beginPath(); c.ellipse(0, 0, r * 0.95, r * 0.6, 0, 0, Math.PI * 2); c.fill(); c.stroke();`. Het glimlijntje kan met `c.ellipse(-r * 0.15, -r * 0.27, r * 0.45, r * 0.12, 0, 0, Math.PI * 2)`. Wil je toch afgeronde hoeken, gebruik dan `if (c.roundRect) … else ellipse`.

- 🟠 **De kip "teleporteert" de kroket naar zijn doelwit, ook als dat doelwit hem ontlopen heeft. Niemand ziet wie het doelwit is.** In `game.js:261` gaat na 3 s de bom altijd naar `ch.target`, waar die speler ook staat. De kip loopt 300 u/s (`game.js:19`) en is dus trager dan iedereen (380, houder 410, plus sprint). Wegrennen haalt niets uit en voelt daarom oneerlijk: "ik was hem toch kwijt?!". De bovenbalk zegt alleen "🐔 De kip heeft hem!" (`game.js:484`), niet wie hij zoekt. In de simulatie eindigt ±1 op de 3 kip-momenten zo (2 spelers 42 van 123, 8 spelers 72 van 208). **Voorstel:** als de tijd op is, krijgt de levende speler die het **dichtst bij de kip** staat de bom ("de kip gaat zitten"). Toon ook het doelwit, bijvoorbeeld "🐔 zoekt NAAM!" in de bovenbalk of een 🎯 boven die speler. Een andere optie: maak de kip sneller (±420) zodat hij echt kan pakken en wegrennen spannend wordt.

- 🟡 **De kip komt altijd op precies hetzelfde moment.** `game.js:243` start de kip zodra `ratio < 0.7`, dus altijd op 70%, en bij elke lont van minstens 8 s. In de simulatie had 100 van de 100 kippen een ratio van 0,70, en elke bom kreeg een kip. Spelers leren snel "bij 70% komt de kip", en dan verrast hij niet meer. Het ontwerp zegt "ergens tussen 70% en 40%". **Voorstel:** zet in `giveBomb` `S.ckAt = rand(0.4, 0.7)` en check `ratio < S.ckAt`. Overweeg ook om niet elke bom een kip te geven (bijvoorbeeld 60% kans).

- 🟡 **In de finale wordt de lont langer in plaats van korter.** `game.js:55` gebruikt `living(S).length <= 3`, dus het aantal spelers dat nu nog leeft en niet het aantal bij de start. Bij 8 spelers: 9,2 s met 4 levend en dan 13,2 s met 3 levend. Bij 4 spelers: 12,9 s en dan 17,1 s. Daardoor wordt het spannendste deel van de ronde trager. **Voorstel:** sla in `setup` `small: players.length <= 3` op en gebruik `S.small ? FUSE_SMALL : FUSE_BASE`.

- 🟡 **Gaat de houder weg in de slowmotion-seconde, dan ontploft een onschuldige speler.** Dat gebeurt via `onLeave` (`game.js:292-296`) en daarna `game.js:234-238`: de bom gaat naar een willekeurige speler die 0,8 s vergrendeld is, terwijl er nog ≤1 s tot BOEM is. Gemeten in de simulatie: de overgave gebeurt meteen, en BOEM volgt 1,0 s later. Een vriend die op het laatste moment "boos de app dichtdoet" laat zo een ander ontploffen. **Voorstel:** gaat de houder weg in fase `slow` (of bij een lont < 2 s), geef dan geen nieuwe houder. Zet in plaats daarvan `S.phase = 'pause'; S.pause = PAUSE` (deze BOEM gaat niet door), of zet de lont van de nieuwe houder op 3 s.

- 🟡 **Wie even weg is, is voorgoed weg en krijgt geen uitleg.** `onLeave` doet `delete S.p[id]` (`game.js:293`). Een telefoon die >10 s op slot gaat of van app wisselt, valt zo uit de ronde. Komt de speler terug, dan rekent de engine hem nog tot de ronde, dus de banner "Je kijkt mee" verschijnt niet. Hij heeft dan geen poppetje, geen spook en geen tekst. **Voorstel:** verwijder hem niet, maar maak hem spook: `p.ghost = true; p.threw = true; p.out = Math.round(S.elapsed); if (S.holder === id) S.holder = null;`. Komt hij terug, dan zweeft hij gewoon als spook rond en staat hij eerlijk in de uitslag.

- 🟡 **Kroket en hartjes verdwijnen achter de bovenbalk als iemand tegen de bovenmuur staat.** De kroket staat op `by = py - R - 62 - …` (`game.js:460`) en de hartjes van niet-houders op `py - R - 22` (`game.js:450`). Bij `py = 150` (de bovenmuur) valt dat binnen y 0–110, en de bovenbalk wordt pas daarna getekend (`game.js:477`). Nagebootst op een laptop met de houder tegen de bovenmuur: de kroket is niet te zien, alleen de ring, en de hartjes van de andere speler ook niet. **Voorstel:** `by = Math.max(by, HUD_H + sz * 0.6)`, of teken de kroket onder of naast de speler als `py < 260`. Doe hetzelfde voor de hartjes.

- 🟡 **De scores op het eindscherm zijn raadsels.** Je ziet "1010 / 55 / 37 / 17" (`game.js:531`: spook = seconde van uitvallen, winnaar = 1000 + levens×10). De volgorde klopt, maar niemand snapt wat 55 betekent. **Voorstel:** geef iedereen het aantal seconden dat hij overleefde, de winnaar de totale rondeduur (`Math.round(S.elapsed)`). Of geef punten op plaats: de eerste die eruit ligt krijgt 0, de winnaar n−1.

- 🟡 **De spook-gooi is onduidelijk op de telefoon.** De knop heet nog steeds "Sprint" (`game.js:121`) en de tekst onderin zegt alleen "Druk op de knop om de kroket te GOOIEN!" (`game.js:501`). Het ontwerp vraagt om een hint "👻 GOOI!" **bij het spook zelf**. **Voorstel:** maak de tekst "👻 Druk op Sprint (spatie) = GOOI!" en zet een klein "GOOI!"-label boven je eigen spook zolang `threw === false` en er een houder is.

- 🟡 **Namen worden afgesneden tegen de zijmuren.** In de 8-spelers-screenshot (Android liggend, laptop) staan "Bot Bra" en "Bot Bo" tegen de rechtermuur (`game.js:449`). **Voorstel:** begrens de x van het label: `const lw = c.measureText(label).width / 2 + 6; const lx = clamp(px, lw, W - lw);`.

- 🟡 **Namen zijn klein op een staande telefoon.** Op een iPhone 13 wordt 28 px in de wereld ±9 px op het scherm (schaal 0,31), op een iPhone SE ±7 px. Het is leesbaar dankzij de rand, maar krap. **Voorstel:** maak namen 32–34 px (`game.js:447`).

**Testopzet/engine (geen fout in de game):**
- In de test met 4 spelers sloot Speler4 (iPad) zijn browser na ±56 s en **won** toch de ronde, ±5 s later ("Speler4 wint!"). De host merkt pas na een paar seconden (tot 10 s) dat een verbinding weg is. Tot dat moment blijft de laatste besturing van die speler gewoon actief. Dat komt door de verbindingsdetectie in `engine/party.js`, niet door bombardeer.
- In `rapport.json` staat bij sommige apparaten alleen de fase `playing`, terwijl er wel een ronde is afgerond. De playtest kijkt maar elke ±0,4 s naar de fase. De eindscreenshots bestaan wel.

## Wat goed werkt

- **Alle speltests geslaagd** met 2, 4 en 8 spelers: 0 fouten op laptop, iPhone, Android liggend en iPad, ±20 updates/s, en de state blijft klein (0,8–2 KB).
- **Een ronde eindigt altijd:** 300 gesimuleerde rondes, ook als iedereen stilstaat, knoppen spamt of vasthoudt. Iedereen op één na weg → die ene wint. Iedereen weg → "Gelijkspel". Een kip-doelwit dat weggaat krijgt netjes een nieuw doelwit. Rondes duren 1–2 minuten (8 spelers ±110 s, 4 spelers ±60 s, 2 spelers 60–100 s).
- **Gouden regels:** geluid en effecten alleen via `emit` en `onEvent`. `render` verandert niets aan de state en gebruikt geen `Math.random()`. `party.smooth` wordt gebruikt voor spelers en de kip. `party.me` komt niet voor in `update` of `bot`. De state is pure JSON. Overal staan checks op weggevallen spelers. De `bot` werkt goed: houders jagen, de rest vlucht, ontwijkt bananen en muren, en spoken gooien.
- **Duidelijk wie jij bent:** witte rand, gele naam met ▲ en een sprint-cooldownring. "JIJ HEBT HEM! Geef door!" knippert rood, en de lontbalk met 💥 en de opzwellende, rood wordende kroket zijn goed te lezen.
- **Indeling op elk scherm:** op een staande iPhone staan de joystick en Sprint onder het veld, dus niets overlapt. Op een liggende Android staan ze in de zijbalken. Op een laptop staat de engine-HUD in de marges. Het eindscherm is leesbaar, en bij 8 spelers scrollt het.
- **Alle 5 gekozen gekke ideeën zitten erin:** kroket-bom met wisselende vulling (taart, eend, sokken, brief van oma, confetti), 🐔 kip, 🍌 banaan, 👻 spook-gooi en een slowmotion-BOEM met "TSSSS…". De anti-pingpongvergrendeling werkt. Het aantal levens hangt af van de groepsgrootte. Een nieuwe bom gaat eerlijk naar wie hem het minst had (bij 2 spelers om en om). Sudden death na 150 s is een goed vangnet, al komt een ronde daar in de praktijk niet aan.
