# 🎲 Ontwerp: Bombardeer! 💣

## 1. In één zin

Ren rond met je joystick: wie de kroket-bom heeft, moet hem door aanraken aan iemand anders geven voordat hij ontploft; wie hem vasthoudt bij de BOEM ligt eruit, en de laatste die overblijft wint.

## 2. Spelers en duur

- 2–8 spelers (bots tellen mee). Bots vullen aan in de lobby.
- Rondeduur: ±60–100 s. Harde bovengrens ±150 s (zie "Sudden death").
- Aantal levens hangt af van het aantal spelers, zodat kleine groepjes niet na 10 seconden klaar zijn:
  - 2 spelers: 3 levens (❤️❤️❤️)
  - 3 spelers: 2 levens
  - 4–8 spelers: 1 leven

## 3. Besturing

```js
controls: { joystick: true, buttons: ['Sprint'] }
```

- **Joystick** (WASD/pijltjes op laptop): rennen.
- **Knop "Sprint"** (spatie): korte supersnelle spurt (0,35 s, 2,4× snelheid), daarna 2 s wachten. Iedereen gebruikt hem: de houder om iemand te pakken, de rest om te ontsnappen.
- **Spook** (uitgeschakeld): dezelfde knop doet dan "GOOI" (zie regels).
- Tikken gaat automatisch bij aanraking: je hoeft niet te mikken met een knop. Dat werkt goed met één duim.
- Werkt op een staande telefoon: ja, joystick links en knop rechts onder de duimen.

## 4. Wereld

`world: { w: 1200, h: 1200 }`, vierkant.

- Vierkant vult een staande telefoon op de breedte, en past ook op een laptop en op een liggende telefoon. Spelers (straal 40) en bom blijven groot genoeg.
- Het veld is de hele wereld: een kroket-keuken/feesttafel-vloer (geruite vloer) met een muur eromheen. Spelers botsen tegen de rand (blijven binnen 0..1200).
- Bovenin (y 0–110, over het veld heen getekend): ronde-info, "wie heeft hem" en de lont-balk. Speler-namen en ❤️ boven de hoofden.
- De bom hangt als grote 🥟 boven de houder en zwelt op.
- Spelers beginnen verdeeld op een cirkel rond het midden (straal 380).

## 5. Regels, stap voor stap

**Begin**
1. Aftellen 3-2-1-GO (engine). Iedereen staat op de cirkel en kan meteen rennen.
2. De eerste bom (🥟) valt 2 s na GO op een willekeurige speler ("Kroket in aantocht…", 2 s tijd om te verspreiden).

**Tikken**
3. De houder rent iets sneller (410 vs 380 u/s). Raakt hij een andere levende speler (afstand < 90), dan **gaat de bom over**: `pas`-event, zwevende tekst ("HIER, JIJ!", "NIET MIJ!", "Oeps 🙃").
4. Na een overgave is de nieuwe houder 0,8 s "vergrendeld": hij kan niet meteen terugtikken (anders pingpong). Wie net de bom kwijt is, kan hem de eerste 0,8 s ook niet terugkrijgen.
5. **De lont loopt gewoon door bij elke overgave.** Hij wordt niet gereset. Dat is het hete-aardappel-gevoel.

**Ontploffing**
6. Lont op nul: 1 s slowmotion-spanning (kroket is knalrood, trilt, `tick` wordt snel), dan BOEM. De houder verliest een leven. Heeft hij er nog een: hij verschijnt na 1,5 s opnieuw met 1,5 s schild (knipperen). Heeft hij er geen: hij wordt **spook 👻**.
7. Uit de kroket komt iets raars (running gag): taart, eend, sokken, brief van oma, confetti. Dat is alleen zichtbaar (emoji-spetters + tekst), geen effect op het spel.
8. 3 s pauze ("Volgende kroket!"), dan valt een nieuwe bom. Hij valt op de levende speler die de bom **het minst vaak heeft gehad** (gelijk? random). Lont voor elke nieuwe bom: `14 − 1,2 × aantal ontploffingen`, minimaal 6 s, ±1,5 s random. Bij ≤3 spelers start de lont op 18 s. Spelers weten dus nooit precies hoe lang.

**Einde**
9. Zodra nog maar 1 speler levend is: ronde klaar, die speler wint.
10. **Sudden death:** na 150 s duurt elke lont maar 3 s, en het veld krimpt niet. Dit zorgt dat het altijd ophoudt.

**Wat gebeurt er als iemand wegvalt (verbinding weg)?**
- `onLeave`: speler wordt verwijderd. Had hij de bom, dan gaat die naar een willekeurige levende speler met 0,8 s vergrendeling. Blijft er 1 speler over: die wint.
- Kijkers die later binnenkomen kijken mee tot de volgende ronde (geen `onJoin`).

**Spook (comeback voor uitgeschakelden)**
- Een spook zweeft vrij rond (joystick), kan niet getikt worden en kan niks aanraken. Het ziet er halfdoorzichtig uit.
- Elk spook heeft **één GOOI** per ronde (knop). Zolang de bom bij een speler zit: de bom springt naar de **levende speler die het dichtst bij het spook staat** (niet de houder zelf). De nieuwe houder krijgt 0,8 s vergrendeling. Dat is tactisch (spook stuurt de bom naar een rivaal), grappig ("KOEN NEE!") en houdt iedereen betrokken.
- Een knop-hint "👻 GOOI!" (1×) staat bij het spook in beeld. Na gebruik: "Je hebt gegooid. Veel plezier met toekijken."

## 6. Gekozen gekke ideeën

Running gag: **🥟 De bom is een kroket** die opzwelt en iets geks bevat.

1. **🥟 Kroket-bom + inhoud-gag** (running gag). Kroket zwelt van 100% naar 160% en wordt van geel naar rood. Bij BOEM vliegt er per ontploffing iets anders uit. Gratis lachmoment en bepaalt het thema.
2. **🐔 De bom wordt een kip** (twist). Eén keer per lont, wanneer de lont tussen 70% en 40% zit (alleen als de lont >= 8 s was): de kroket springt van de houder af, wordt een 🐔 en rent 3 s (300 u/s) naar een willekeurige andere levende speler, kakelend (`quack`). Iedereen die hij aanraakt na 0,5 s (iedereen levend) krijgt de bom, dus ook de oorspronkelijke houder kan hem terugkrijgen. Daarna weer normaal. Maakt dat niemand zich zeker voelt en geeft gillen en rennen.
3. **🍌 Glijbanaan**. Elke ±7 s ligt er een banaan op een willekeurige plek (max 2 tegelijk). Stap erop: je glijdt 1 s zonder controle in de richting van een willekeurige andere speler. Tik je onderweg iemand als houder, dan geeft dat gewoon bom. Slapstick; zorgt dat vluchten of jagen niet te voorspelbaar is.
4. **👻 Spook met een gooi** (zie boven). Hoofdreden voor comeback en geen wachttijd.
5. **🐌 Slowmotion-ontploffing**. De laatste seconde loopt de lont 3× trager, tikt de bom snel, schermtrilling bouwt op, dan BOEM. Het perfecte lachmoment.

**Niet gedaan** (te veel of wordt rommelig): Omkeer-bom, Blinde bom (leesbaarheid op een telefoon), Wisselbeurt, Twee bommen (past niet bij hete aardappel), Kont-magneet, Pannendeksel, Sokkenschild, Tijd-snoepje, Scheetwolk (misschien in een latere versie als `prrt` er vrolijk bij hoort), Disco-modus, Vulkaan-hik, Alles-zeep, Neppe-bom-knop, Plak-sticker, Wc-papier, Raket (de spook-gooi doet al het comeback-werk). Maximaal één power-up op het veld (banaan) en één twist (kip): rustig en leesbaar.

## 7. Balans en comeback

- **Gedeelde lont**: bom doorgeven helpt niet voor altijd. Iedereen is een keer aan de beurt.
- **Eerlijk verdelen**: een nieuwe bom gaat naar wie hem het minst heeft gehad. Wie zich verstopt, krijgt hem alsnog.
- **Houder iets sneller**, maar iedereen heeft een Sprint: vluchten blijft mogelijk, tikken blijft mogelijk.
- **Geen pingpong**: 0,8 s vergrendeling na elke overgave.
- **Weinig spelers = meer levens**, zodat een 2-spelersduel meerdere knallen heeft.
- **Spook-gooi**: uitgeschakelden blijven meespelen en kunnen de kampioen laten schrikken. Het kan ook het resultaat omdraaien (leidt de bom naar de snelste speler die op de rand van winst staat).
- **Kip en banaan** verstoren een duidelijk "meest ervaren rijder wint": geluk en chaos winnen van skill.
- **Sudden death** na 150 s houdt de ronde kort.

## 8. State

```json
{
  "p": {
    "<id>": { "x": 600, "y": 600, "vx": 0, "vy": 0,
      "lives": 1, "sprint": 0, "cd": 0, "lock": 0, "shield": 0,
      "slip": 0, "sx": 0, "sy": 0,
      "ghost": false, "threw": false, "held": 0, "died": 0 }
  },
  "holder": "<id of null>",
  "fuse": 11.3, "fuseMax": 14,
  "chicken": null,
  "bananas": [{ "x": 300, "y": 800 }],
  "phase": "play",
  "pause": 0,
  "boomT": 0,
  "booms": 0,
  "filling": "taart",
  "bananaT": 7,
  "elapsed": 0,
  "order": ["<id die eerst eruit lag>"]
}
```

- `chicken`: `null` of `{ x, y, tx, t, target, used }` terwijl hij rent. `holder` is dan `null`.
- `phase`: `"intro"` (2 s voor eerste bom), `"play"`, `"slow"` (laatste seconde), `"pause"` (3 s na ontploffing).
- `filling`: de naam van de vulling voor de volgende BOEM (vooraf gekozen, zodat de kroket er mogelijk iets van laat zien, bijv. een sok-hoekje).
- Geschat < 2 KB met 8 spelers.

## 9. Events (`party.emit`)

| Event | Data | Effect |
|---|---|---|
| `bom` | `{ x, y, id }` (bom valt op speler) | `pop`, kleine spetters, tekst "Kroket in aantocht! 🥟" |
| `pas` | `{ x, y, from, to }` | `pop`, `floatText` "HIER, JIJ!" / "NIET MIJ!" / "Oeps 🙃", kleine vonken. `to === party.me` krijgt `vibrate(80)`. |
| `sprint` | `{ x, y }` | `whoosh`, witte deeltjes |
| `tik` | `{ fuse }` | `tick`, steeds sneller en hoger onder 4 s (per halve seconde). Alleen host stuurt, elk apparaat speelt zelf; de lont-pitch gaat omhoog |
| `slow` | `{ x, y, id }` | Start slowmotion: `whoosh`, kleine `shake(4)`, zwevende tekst "TSSSS…" boven de houder |
| `boem` | `{ x, y, id, filling, out }` | `boom`, `shake(20)`, `flash('#fff')`, `confetti()`, deeltjes met `emoji` van de vulling (🎂, 🦆, 🧦, 💌, 🎉) en 🥟 stukjes. `floatText` "AUW MIJN KROKET" / "[naam] is nu een taart 🎂". `id === party.me` krijgt `vibrate(300)`. |
| `kip` | `{ x, y, target }` | `quack`, veren-deeltjes (🪶), tekst "HIJ KOMT! 🐔" in groot |
| `kipgrab` | `{ x, y, id }` | `toet`, `shake(6)`, tekst "KAKEL!" |
| `banaan` | `{ x, y }` | banaan verschijnt: `pop` |
| `slip` | `{ x, y, id }` | `boing`, tekst "UITGEGLEDEN!", 🍌-deeltjes. `id === party.me` krijgt `vibrate(120)` |
| `spook` | `{ x, y, id }` | speler wordt spook: `lose`-achtig, tekst "👻 SPOOK!" |
| `gooi` | `{ from, to, x, y }` | `whoosh` + `toet`, tekst "SPOOK-GOOI!" |
| `uit` | `{ id, left }` | tekst met aantal overlevenden ("Nog 3!") |
| `sudden` | `{}` | `go`, `flash('#ff4d6d')`, banner "SUDDEN DEATH!" |

## 10. Bot

`bot(state, id)` geeft `{ x, y, buttons: [sprint/gooi] }`.

- **Houder**: ren naar de dichtstbijzijnde levende speler die niet beschermd is (shield/lock). Sprint als afstand < 170 en `cd === 0` (met 70% kans per tick-venster, dus niet perfect). Mik op de speler met de meeste lont-druk niet nodig.
- **Niet-houder**: vlucht van de houder (richting weg + lichte trek naar het midden zodat hij niet in de hoek vast zit). Sprint als de houder < 140 afstand heeft en `cd === 0`. Vlucht ook van de kip als die rent. Geen vaste patronen: voeg een random zwenk toe (±0,4 rad, wisselt elke ~0,7 s).
- **Muur-ontwijking**: bij < 80 van de rand een duw naar het midden.
- **Bananen**: bots ontwijken ze (blijf > 90 weg), behalve als de bot zelf houder is en iemand dichtbij is (50% kans om er toch op te gaan voor de grap).
- **Spook**: zweef rustig rond; als de lont < 4 s en `threw === false`: gooi (`buttons[0] = true` voor één update). Dit zorgt dat bots het spook-gedrag ook laten zien in de playtest.
- Bots krijgen een reactietijd van ±0,15 s zodat ze niet superhuman zijn.

## 11. Eindscherm

- `winners`: `[id van de laatste levende speler]`. Alleen bij verbroken verbinding mag er leeg zijn ("gelijkspel", niemand over); dan alle laatste-levend-spelers.
- `scores`: per speler `leven × 100 + overleefde seconden` (de laatste speler krijgt het hoogst). Eenvoudig: `score = (placeFromLast)*100 + lives*10 + seconds/10`, maar de bouwer mag het simpeler maken zolang de winnaar bovenaan staat.
- `title` voorbeelden:
  - "Lisa wint! 🥟👑" met text "Lisa is de koning van de kroketten."
  - "Daan wint, want niemand vertrouwde hem 😏"
- `text` (kies er één, bijv. op basis van meest bom gehad / eerste uit):
  - "Lisa heeft de nerveuze handjes van een sloop-aannemer 👑"
  - "Daan ontplofte vaker dan een vuurwerkfabriek 🎆" (speler met meeste ontploffingen)
  - "Sanne ontplofte als eerste. Het ging lekker. 💥"
  - "Koen is nu een taart 🎂"
- Ook leuk: "Meest bom vastgehouden: Mark 🥟".

## 12. Bouwvolgorde

1. **Kern**: veld, rennen met joystick, één bom die bij aanraking overgaat (0,8 s lock), lont, BOEM, leven eraf, laatste wint, `party.end`. Basisbot (houder jaagt, rest vlucht).
2. Levens per spelersaantal, nieuwe bom na pauze (minste-keer-gehad), lont-verkorting, sudden death.
3. Sprint-knop (duw en vlucht) + cooldown-indicator.
4. Spook-gooi (spook-modus, één gooi, dichtstbijzijnde speler).
5. Events en juice: tikken, slowmotion, kroket-inhoud, `shake`, `confetti`, trillen.
6. 🐔 Kip.
7. 🍌 Banaan.
8. Eindscherm-teksten en bot-verfijning. Test met `npm run playtest -- bombardeer` en een 8-bots-run (`?autohost=1&bots=7`).

Als er tijd tekortkomt: laat kip of banaan vallen, nooit de kern, het spook of de slowmotion-BOEM.

## Wijzigingen na test 1

Na het testrapport en de speeltest (cijfer 7). Getallen staan als constanten bovenin `game.js`.

- **VEILIG na doorgeven (geen pingpong):** wie de kroket net doorgaf, is 2 s `safe` en kan hem niet terugkrijgen. Dat geldt voor tikken, de spook-gooi en de kip. De nieuwe houder kan 0,8 s niet tikken (`lock`). Boven een veilige speler staat een "VEILIG"-bordje. Terugtikken binnen 1,3 s gebeurt in de simulatie niet meer (was 51–73%).
- **Kip eerlijk:** de kip komt bij ongeveer de helft van de lonten van ≥ 8 s, op een willekeurig moment tussen 45% en 80% (`S.ckAt`, vastgelegd bij de start van de lont). Hij fladdert eerst 0,6 s op de plek en rent dan (320 u/s) naar zijn doelwit `S.chicken.target`. Dat doelwit staat in de state, dus de bovenbalk zegt "🐔 De kip zoekt NAAM!" (of "DE KIP WIL JOU!"). Alleen bij **echte aanraking** krijgt iemand de kroket: het doelwit, of een pechvogel die in de weg staat. Ontloop je hem 3,8 s, dan geeft hij het op ("Pff, ik geef het op 🐔") en gaat de kroket **terug naar de oude houder** (event `kipop`). Na de kip is er altijd nog minstens 2,5 s lont over.
- **Lont in de finale:** de lontduur hangt af van het aantal spelers **bij de start**: ≤ 4 spelers 18 s, anders 14 s, en elke BOEM eraf 1,2 s. In de finale wordt de lont dus korter, niet langer. (Bij 4 spelers blijft de ronde zo ±64 s.)
- **Spoken blijven meedoen:** de spookknop doet eerst de **gooi** (1× per ronde). Daarna, of zolang gooien niet kan, legt hij elke 8 s een **spook-banaan** waar het spook zweeft (max 1 per spook, een nieuwe vervangt de oude). Elke banaan "valt" eerst 0,8 s en is dan pas glad. De gooi werkt **niet** als de lont onder 1,5 s is of tijdens TSSSS ("Te laat om te gooien! 👻"). De touch-knop heet voor een spook "👻 Gooi", "🍌 Leg" of "🍌 5" (aftellen) via `party.setButtonLabel`, en weer "Sprint" als je meedoet.
- **Wegvallen:** een speler die wegvalt, wordt spook (`away: 1`) in plaats van verwijderd. Had hij de kroket, dan krijgt een willekeurige levende speler een **nieuwe kroket met een volle lont** (ook in de TSSSS-seconde, dus niemand ontploft daardoor). Komt hij terug, dan zweeft hij als spook rond en ziet hij 7 s "Je was even weg: je bent nu een spook 👻". Weggaan tijdens de eindpauze verandert de winnaar niet.
- **Scores:** iedereen krijgt het aantal **seconden dat hij overleefde**, de winnaar de hele rondeduur. In `text` staat "⏱️ Getal = seconden overleefd."
- **Bovenrand:** spelers komen niet hoger dan y = 255. Tussen de bovenbalk en de vloer zit nu een rand met keukentegels. Daar zweeft de kroket overheen, en daar staat je eigen status (spook-hint, "Even opscharrelen"). Kroket, hartjes en het VEILIG-bordje blijven altijd onder de bovenbalk zichtbaar.
- **Bots:** vluchten slimmer: ze kiezen uit 16 richtingen de beste en lopen niet meer vast in hoeken. Spook-bots zweven naar een slachtoffer, gooien als de lont tussen 1,5 en 4 s is en leggen bananen bij levende spelers.
- **Nieuwe events:** `kipop { kx, ky, x, y, id, back, target }`, `spookbanaan { x, y, id }`, `weg { x, y, id }`. `kip` heeft nu `{ x, y, target, from, again }`, `kipgrab` heeft ook `target` (true als het doelwit gepakt is) en `slip` heeft ook `by` (het spook van de banaan).
