# Testrapport bombardeer (2026-10-06)

**Oordeel:** ✅ klaar om te spelen (geen blokkerende bugs meer; 1 belangrijk punt over eerlijkheid en een paar kleine)

| Test | Uitslag | Updates/s | State | Rondes |
|---|---|---|---|---|
| `node --check games/bombardeer/game.js` (en `engine/party.js`, `engine/input.js`) | ✅ geen syntaxfouten | – | – | – |
| normaal: 4 spelers, 95 s (verlengd: ronde ±65 s + aftellen) | ✅ geslaagd, 0 fouten op alle apparaten | 19,7 | 1362 B | 1 (±65 s) |
| minimum: 2 spelers, 130 s (verlengd: 3 levens elk) | ✅ geslaagd, 0 fouten | 20,0 | 915 B | 1 (±62 s) |
| druk: 3 apparaten + 5 bots = 8, 150 s (verlengd: 7 BOEMs) | ✅ geslaagd, 0 fouten | 19,9 | 2262 B | 1 (±103 s) |
| simulatie zonder browser: `update` en `bot`, 60 rondes per aantal (2, 3, 4, 5, 8) | ✅ elke ronde eindigt, nooit gelijkspel, geen NaN/undefined/Infinity | – | max 2,7 KB | 2p 61–104 s · 3p 80–103 s · 4p 61–68 s · 5p 63–70 s · 8p 96–108 s |
| oude iPhone (iOS 15) nagebootst: iPhone 13 zonder `ctx.roundRect` | ✅ 0 fouten, kroket, bovenbalk, lontbalk en VEILIG-bordjes worden getekend (engine vult `roundRect` aan) | – | – | 1 |
| weggaan en terugkomen tijdens een ronde (iPhone sluit de pagina en opent opnieuw) | ✅ na 0,03 s spook (`away: 1`), terug met hetzelfde id, 7 s "Je was even weg: je bent nu een spook 👻" | – | – | – |
| randgevallen (simulatie): iedereen stil, knop spammen, knop vasthouden, iedereen op één na weg (in intro, spel en eindpauze), iedereen weg, kip-doelwit en/of oude houder weg, sudden death, te laat gooien | ✅ eindigt altijd met de juiste winnaar of gelijkspel, geen crashes | – | – | – |
| trage Android nagebootst (Galaxy S9+, CPU 4× en 6× trager, 8 spelers) | ⚠️ 23,5 en 19,2 beelden/s (botsbal onder dezelfde omstandigheden: 33,9 en 25,6), uitschieters tot 333–367 ms | – | – | – |

Screenshots bekeken: lobby (laptop, iPhone), spel (laptop, iPhone staand, Android liggend, iPad) en einde (laptop, iPhone, Android liggend) bij 2, 4 en 8 spelers. Ook scènes: kip (start, rennen, gepakt, opgegeven), TSSSS, de BOEM-reeks, ik als spook, spook-gooi, spook-banaan, uitglijden, spelers tegen alle muren, oude iPhone en terugkomen na wegvallen.

## Eerdere bugs: zijn ze weg?

| Eerdere bug | Nu |
|---|---|
| 🔴 Oude iPhones: `c.roundRect` bestaat niet, beeld half leeg | ✅ weg. De engine vult `roundRect` aan. Nagebootst zonder `roundRect`: 0 fouten, alles getekend. |
| 🟠 Kip teleporteert de kroket naar zijn doelwit, en niemand ziet wie dat is | ✅ weg. Alleen echte aanraking telt. Ontloop je hem, dan gaat de kroket terug naar de oude houder. Het doelwit staat in de bovenbalk ("🐔 De kip zoekt Bot Bram!"), met een rood vizier, 🎯 en een stippellijn. Op je eigen scherm: rode rand en "DE KIP WIL JOU!". Simulatie bij 8 spelers: 39× doelwit gepakt, 17× pechvogel, 47× opgegeven. |
| 🟡 Kip komt altijd op 70% | ✅ weg. Nu tussen 45% en 80%, bij ±50% van de lonten (n=2: 52%, n=4: 47%, n=8: 53%). Na de kip is er altijd nog minstens 2,50 s lont. |
| 🟡 Lont wordt langer in de finale | ✅ weg. 8 spelers: 14,7 → 12,2 → 10,3 → 10,5 → 9,7 → 8,5 → 6,2 s. |
| 🟡 Houder weg in TSSSS laat een onschuldige ontploffen | ✅ weg. De nieuwe houder krijgt een volle lont; BOEM pas na 13–16 s. |
| 🟡 Wie even weg is, is voorgoed weg zonder uitleg | ✅ weg. Hij wordt spook, staat eerlijk in de uitslag en krijgt bij terugkomst uitleg. Weggaan in de eindpauze verandert de winnaar niet. |
| 🟡 Kroket en hartjes achter de bovenbalk | ✅ weg. Spelers komen niet hoger dan y = 255. Getest met 3 spelers tegen de bovenmuur: kroket, ❤️❤️ en VEILIG staan alle drie onder de balk. |
| 🟡 Scores zijn raadsels | ✅ weg. Score = seconden overleefd, met "⏱️ Getal = seconden overleefd." In 40 rondes scoorde niemand ooit ≥ de winnaar. |
| 🟡 Spook-gooi onduidelijk op de telefoon | ✅ weg. De knop heet "👻 Gooi", "🍌 Leg" of "🍌 8", en in de tegelrand staat wat de knop doet. Te laat gooien (TSSSS of lont < 1,5 s) lukt nooit: 5100 pogingen, 0 keer gelukt. |
| 🟡 Namen afgesneden tegen de zijmuren | ✅ weg (iPhone, Android liggend en laptop gecontroleerd). |
| 🟡 Namen klein op een staande telefoon | ✅ weg. 32–40 px, afhankelijk van de schermschaal (iPhone 13 ±12,5 px op het scherm). |
| Engine: weggevallen speler blijft lopen | ✅ weg. Na 1,5 s staat hij stil, en na een gesloten pagina is hij binnen 0,03 s spook. Pingpong (terugtikken binnen 1,3 s): 0 van 3905 overgaves. |

## Bugs

- 🟠 **TSSSS is een val: ±45% van alle BOEMs treft iemand die de kroket pas in de laatste seconde kreeg, en die kan dan niks meer doen.** In de fase `slow` mag de houder nog gewoon tikken (`game.js:411-421` checkt de fase niet). De ontvanger krijgt in `pass()` (`game.js:90`) `lock = 0,8 s`, en TSSSS duurt maar 1,0 s (`SLOW_T`, `game.js:20`). Hij heeft dus 0,2 s om iemand anders te vinden, en de vorige houder is ook nog VEILIG. Gemeten in de simulatie: 2 spelers 74 van 163 BOEMs (45%), 4 spelers 50 van 120 (42%), 8 spelers 129 van 280 (46%). De speeltester noemde dit ook al ("TSSSS is een val", 48%), maar het staat niet in de wijzigingen. **Reproduceren:** elke ronde met bots; kijk bij `boem` of de laatste `pas` ná het `slow`-event kwam. **Voorstel** (kies er één): (a) geef in TSSSS geen vergrendeling: in `pass()` `S.p[to].lock = S.phase === 'slow' ? 0 : LOCK;`, zodat de ontvanger nog een hele seconde heeft. Of (b) start TSSSS opnieuw voor de nieuwe houder: in `pass()` `if (S.phase === 'slow') S.boomT = SLOW_T;`. Wil de regisseur het als grap houden ("Oeps 🙃"), kies dan (a): zo blijft het grappig, maar is het niet meer kansloos.

- 🟡 **In de intro en elke pauze rennen alle bots op volle snelheid naar het midden en klonteren samen.** De nieuwe kroket valt dan in een kluitje. In `bot()` (`game.js:485-508`) is er in de fasen `intro` en `pause` geen houder en geen kip (`src` is `null`). Dan blijft alleen de kleine trek naar het midden over (`game.js:501`), en `game.js:507-508` normaliseert die naar lengte 1, dus volle snelheid. Gemeten: als de nieuwe kroket valt, staan bots gemiddeld 76 (4 spelers) of 91 (8 spelers) van hun dichtstbijzijnde buur. Tikken gebeurt al onder 90. Halverwege de lont is dat 274 en 206. Je ziet het in de BOEM-screenshots: na elke BOEM één grote klont met namen over elkaar. Speel je met bots erbij, dan gaat elke nieuwe kroket meteen na de 0,8 s vergrendeling door, en de pauze voelt dood (dat zei de speeltester ook). **Voorstel:** zonder gevaar uit elkaar gaan in plaats van naar het midden: `if (!src && !S.chicken) { const near = others.sort((a, b) => dist(me, a[1]) - dist(me, b[1]))[0]; if (near && dist(me, near[1]) < 320) [x, y] = fleeDir(me, near[1]); }`. Of laat kleine vectoren klein: `const n = Math.max(1, Math.hypot(rx, ry));` in plaats van `|| 1`.

- 🟡 **"Nog N!" en "FINALE! Nog 2 🔥" kunnen nog steeds over de BOEM-teksten heen staan.** In `game.js:571-572` wordt pas 1,3 s na het event gekeken waar het nieuwe spook is (`seen[d.id]`). Een spook vliegt in die tijd tot ±400 eenheden weg (bots vliegen direct naar een slachtoffer), en kan dan de helft van het veld wisselen. De speeltester meldde dit ook. **Voorstel:** lees de plek meteen uit: `if (name === 'uit' && d.left >= 2) { const s = seen[d.id]; later(1.3, () => { const y = s && s.y > CY ? … }) }`. Je kunt ook `y: p.y` meesturen in `party.emit('uit', …)` (`game.js:147`).

- 🟡 **Op een trage telefoon hapert het precies op de grappigste momenten.** Nagebootst op een Galaxy S9+ met CPU 6× trager en 8 spelers: 19 beelden/s (botsbal: 26), met haperingen van 250–333 ms bij het starten van de kip en in de BOEM-pauze (botsbal: hooguit 133 ms). In de gamecode gaat de meeste tijd naar `fillText` en `strokeText` (±11%): emoji en namen met een rand. Dit is een nabootsing, dus controleer het op een echte oude Android. **Voorstel (goedkoop):** (1) teken `drawKitchen` (`game.js:874-901`) één keer op een offscreen canvas en zet die elke frame neer met `c.drawImage`; (2) minder emoji-deeltjes per moment: BOEM heeft nu 8 🥟 + 12 vulling + 10 👻 + confetti (`game.js:552-558, 568`), de kip 12 🪶 (`game.js:581`). Halveren is genoeg.

- 🟡 **De lange eindtitels duwen de uitslag en de knop "Nog een ronde!" uit beeld op een liggende telefoon.** "Speler3 wint! Niemand vertrouwde deze kroket 😏" en "… is de koning van de kroketten! 👑" (`game.js:965`) worden 3–4 regels in grote letters. Op Android liggend zie je zonder scrollen alleen de winnaar. Een host met een liggende telefoon moet scrollen voor "Nog een ronde!". **Voorstel:** houd de `title` kort ("Lisa wint! 🥟👑") en zet de grap in `text`, bijv. `text: 'Niemand vertrouwde deze kroket 😏 ' + text`.

**Testopzet/engine (geen fout in de game):** in de druktest gaat het Android-apparaat (liggend) bij 70% van de testtijd weg. Dat was vóór het einde van de ronde, dus van die run is er geen eindscreenshot op Android liggend. Die van de 4-spelerstest is wel bekeken.

## Wat goed werkt

- **Alle speltests geslaagd** met 2, 4 en 8 spelers: 0 fouten op laptop, iPhone, Android liggend en iPad, ±20 updates/s, en de state blijft klein (0,9–2,3 KB, max 2,7 KB in de simulatie).
- **Een ronde eindigt altijd**, in 1–1¾ minuut: 300 gesimuleerde rondes en alle randgevallen. Iedereen op één na weg: die wint, ook in de intro. Iedereen weg: "Niemand over! Gelijkspel". Sudden death (nagebootst) zet de lont op 3 s, en er komt dan geen kip meer.
- **Gouden regels:** effecten en geluid alleen via `emit` en `onEvent`. `render` verandert de state niet. De module-variabelen van de kunstenaar (`seen`, `lastS`, `pasQ`, `awaySince`) worden alleen gelezen of zijn van het apparaat zelf. De `setTimeout`s in `onEvent` lopen allemaal binnen 1,3 s af, ruim vóór het eindscherm (BOEM → einde duurt 2,5 s). `pasQ` wordt netjes geleegd bij kip en spook-gooi. Geen `Math.random()` in `render` en geen `party.me` in `update` of `bot`. `smooth` voor spelers en kip; die springt goed bij een nieuwe kip of respawn. De state is pure JSON.
- **Duidelijk wie jij bent en wat er gebeurt:** gele naam met ▲, witte rand, "▼ JIJ" in de eerste 5 s, "JIJ HEBT HEM! Geef door!" knippert, de lontbalk met 💥, en de kroket zwelt op en wordt rood. Je eigen status staat in de tegelrand, en de knoptekst past zich aan ("Sprint", "👻 Gooi", "🍌 Leg", "🍌 5").
- **De kip is nu eerlijk en leesbaar:** fladderen met ❗, "HIJ KOMT VOOR BOT BRAM!", vizier en stippellijn, "GEPAKT! 🎯", "Pech, in de weg! 🙃" of "Pff, ik geef het op 🐔" → "TERUG NAAR JOU! 🙃".
- **Alle 5 gekozen gekke ideeën zitten erin en werken samen:** kroket met wisselende vulling, 🐔 kip, 🍌 banaan, 👻 spook (gooi + spook-banaan) en de TSSSS-BOEM. De BOEM-teksten komen na elkaar en blijven binnen het veld.
- **Indeling op elk scherm:** op een staande iPhone staan joystick en knop onder het veld, en op Android liggend in de zijbalken. Niets valt over het spel heen. Het eindscherm scrollt bij 8 spelers.
