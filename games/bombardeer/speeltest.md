# 🎉 Speeltest: Bombardeer! 🥟💣

**Kort:** een hete-aardappel-tikspel met een kroket die ontploft, een kip die er met de bom vandoor gaat, bananen en wraakzuchtige spoken. Het is chaotisch en flauw, en dat hoort zo. Twee dingen houden het nu nog onder de 8. Ten eerste wordt de bom vooral heen en weer getikt tussen twee mensen ("pingpong"), waardoor wie ontploft vaak toeval is. Ten tweede heeft wie er als eerste uit ligt na één gooi een minuut lang niks meer te doen.

## Wat we zagen

**Echte speltest** (`--players 2 --bots 4 --seconds 60 --out test-speel`): ✅ geen fouten, 19,7 updates per seconde op de iPhone, state 1,5 KB. In 60 s was er nog geen ronde klaar. Dat klopt wel: een ronde met 6 spelers duurt ±88 s. Op de telefoon is alles goed te lezen: de grote "Bot Bea heeft hem!"-balk, de lontbalk met 💥, de gloeiende ring om de houder en de kroket die boven zijn hoofd opzwelt.

**Extra metingen** (eigen simulatie van de echte `update` en `bot`, 150 rondes per aantal, plus losse screenshots van kip, TSSSS, BOEM, spook en eindscherm op een iPhone):

| Spelers | Rondeduur | Overgaves per lont | Eerste uit na | Tijd als spook (gem. / max) |
|---|---|---|---|---|
| 2 (3 levens) | ±86 s | 14 | n.v.t. | n.v.t. |
| 4 | ±60 s | 13 | 17 s | 22 s / 46 s |
| 6 | ±88 s | 11 | 17 s | 37 s / 76 s |
| 8 | ±110 s | 9–10 | 17 s | 47 s / 98 s |

- ✅ Rondes duren 1–2 minuten en eindigen altijd met een winnaar. Sudden death was nooit nodig.
- ✅ Winsten zijn eerlijk verdeeld over de bots, en elke lont wordt minstens één keer doorgegeven.
- ⚠️ **Pingpong:** 51% (6 spelers) tot 73% (2 spelers) van alle overgaves is een **terugtik** binnen 1,3 s. De houder is sneller (410 tegen 380), dus na de 0,8 s vergrendeling tik je degene die het jou net gaf gewoon terug. Bij **90%** van de BOEMs wisselde de bom in de laatste 1,5 s nog van eigenaar. Wie ontploft, hangt dan vooral af van de timing.
- ⚠️ **Spook als scheidsrechter:** als een spook gooit in de TSSSS-seconde (na 0,25 s), ontploft de ontvanger in **100%** van de gevallen. Hij is 0,8 s vergrendeld en heeft nog maar 0,75 s. In de finale kiest het laatste spook dat op de knop drukt dus de winnaar.
- ℹ️ De kip komt bij **elke** lont van 8 s of langer, en altijd op 70%. Vijf keer per ronde "HIJ KOMT!" wordt voorspelbaar.
- ℹ️ Wie zich in een hoek verstopt, wint iets vaker (24% in plaats van 17% bij 6 spelers). Daar heb je geen last van, want mensen zien dat wel.

## De vier vrienden

**🙋 Sanne (gamet nooit, telefoon):** snapt het in 5 seconden. "Kroket = bom, ren iemand aan" kent iedereen van het schoolplein, en de knipperende rode tekst "JIJ HEBT HEM! Geef door!" helpt. Ze is wel de makkelijkste prooi en ligt er na ±17 s uit. Dan staat er onderin "Druk op de knop om de kroket te GOOIEN!", maar haar knop heet nog steeds **"Sprint"**. Ze twijfelt, gooit, en kijkt daarna een minuut lang naar "Veel plezier met toekijken." Dat is grappig geschreven, maar het voelt ook echt zo. 😐

**😤 Daan (fanatiek):** begint enthousiast. Een sprint uitlokken en dan zelf sprinten werkt echt, en de kip om iemand anders heen sturen voelt slim. Dan merkt hij dat Mo hem elke keer na precies 0,8 s terugtikt, en dat de laatste seconde een muntje opgooien is. In de finale tegen Lisa wordt hij in de TSSSS-seconde door een spook bekogeld: "DAAN NEE!" BOEM. Daan: "Dat is toch geen skill?!" Hij wil wel meteen revanche, dus helemaal kwijt zijn we hem niet.

**😈 Mo (de trol):** heeft het naar zijn zin. Terugtikken zodra het weer mag ("HIER, JIJ!" → "NIET MIJ!" → "HIER, JIJ!"), als spook pal naast de koploper hangen en op het laatste moment gooien, en als houder over een banaan op de groep afglijden. Kan Mo het spel breken? Nee. Weggaan met de bom in zijn handen wordt netjes opgevangen, en verstoppen helpt nauwelijks omdat een nieuwe kroket altijd valt op wie hem het minst had. Mo is hier dus de wraakengel, niet de saboteur.

**😂 Lisa (lacht om alles):** ligt dubbel. Haar top 5:
1. De BOEM met vulling: "Sokken. Alweer. 🧦" (twee keer achter elkaar sokken was nog grappiger), "Brief van oma: 'Eet je groenten' 💌", "AUW MIJN KROKET".
2. De kip die er met de bom vandoor gaat terwijl iedereen gillend wegrent.
3. Uitglijden over een banaan en tollend precies tegen de houder aan.
4. "SPOOK-GOOI! KOEN NEE!"
5. Het eindscherm: "Bot Bo ontplofte als eerste. Het ging lekker. 💥"

## Cijfers

| | Cijfer | Waarom |
|---|---|---|
| Snap ik het meteen? | **8** | Hete aardappel kent iedereen, de bovenbalk is duidelijk. Min: de knop heet "Sprint" als je spook bent, en de vergrendeling zie je niet. |
| Lachmomenten | **8** | Kroket-vulling, kip, banaan, spook-gooi, TSSSS en de eindteksten: ruim 3 echte lachmomenten. Bij de BOEM liggen drie teksten wel precies op elkaar. |
| Spanning tot het eind | **7** | Lontbalk, sneller tikken, rode TSSSS-flits: dat spant echt. Maar door het pingpongen is wie ontploft vaak toeval, en dat haalt de "net op tijd!"-spanning weg. |
| Eerlijkheid | **6** | Nieuwe bom naar wie hem het minst had en meer levens in kleine groepen zijn goed. Terugtikken en de spook-gooi in de laatste seconde maken de finale een loterij. |
| Gevoel | **7** | Bewegen reageert meteen, de sprint met whoosh en de BOEM met schudden, flits en confetti voelen lekker. De "slowmotion" is geen echte slowmotion: alles beweegt gewoon door. |
| Willen we nog een rondje? | **7** | Rondes zijn kort (1–2 min) en "Nog een ronde!" is groot. Wie er als eerste uit lag, heeft wel net een minuut zitten wachten. |
| **Eindcijfer** | **7** | Een lekker chaotische partygame met goede grappen. Met de 3 punten hieronder wordt het makkelijk een 8. |

## Wat al heel goed is

- Het **kroket-thema** werkt. Een opzwellende kroket die rood wordt, met sokken of een brief van oma erin, is precies flauw genoeg.
- **Leesbaar op een telefoon:** de vierkante wereld vult het scherm en de houder valt meteen op door de ring en de kroket.
- **Eerlijk verdeeld:** een nieuwe kroket valt op wie hem het minst had, dus verstoppen loont niet.
- **Kleine groepen krijgen meer levens**, dus een duel met 2 spelers is niet na 15 s klaar.
- **Rondelengte** zit bij elk aantal spelers netjes tussen 1 en 2 minuten.

## De 3 verbeterpunten

### 1. Niet terugtikken: wie de kroket net doorgaf, is 2 seconden veilig 🛡️ (bouwer, regel)
In `pass()` krijgt de vorige houder `lock = 2.0` in plaats van 0,8. De nieuwe houder houdt 0,8 s en mag daarna wel meteen iemand **anders** tikken. Teken de veilige speler half doorzichtig met een klein "😮‍💨 VEILIG"-bordje (of hergebruik het knipperen van het schild), zodat iedereen ziet wie je niet kunt tikken.
*Gemeten:* terugtikken daalt van 51–73% naar 0–5%. Er blijven ±20 overgaves per minuut (één per 3 s), dus het blijft druk. Een BOEM na een wissel in de laatste 1,5 s daalt van 90% naar ±70%. Het wordt een echte achtervolging, waarin Daan met sprinten en uitwijken kan laten zien wat hij kan.

### 2. Spoken blijven meedoen: elke 8 s een spook-banaan, en geen gooi meer in de laatste seconde 👻🍌 (bouwer, regel)
- Een spook kan met de knop **elke 8 s een 🍌 laten vallen** op de plek waar hij zweeft (max. 1 spook-banaan per spook op het veld). Uitgeglijden werkt zoals nu. De eenmalige GOOI blijft, bijvoorbeeld op de tweede knop of als eerste druk.
- De spook-gooi werkt **niet meer als de lont onder 1,5 s is of tijdens TSSSS**. De hint toont dan "Te laat! 👻".

Zo heeft Sanne de hele ronde iets te doen (nu gemiddeld 37–47 s als spook, tot 98 s bij 8 spelers), kan Mo blijven trollen, en kiest het laatste spook niet meer de winnaar (nu 100%). Bonus: de knop heet voor een spook nog "Sprint". Zet het label in `render` op "👻 Gooi" of "🍌 Leg", bijvoorbeeld via de `.pc-btn` in de DOM, of geef de engine een kleine `setButtons`.

### 3. De kip roept wie hij moet hebben, en de BOEM-teksten komen na elkaar 🐔🎯 (kunstenaar, gevoel)
- Bij het `kip`-event wordt de tekst "🐔 HIJ KOMT VOOR **SANNE**!" (met `d.target`), en zolang `S.chicken` rent staat er een stuiterende 🎯 boven het doelwit. Op het toestel van het doelwit komt daarbij `vibrate(150)` en een rode schermrand. Dan weet de hele bank wie er moet gillen.
- Bij `boem` liggen "AUW MIJN KROKET", de vulling-grap en "👻 SPOOK!" nu precies op elkaar. Laat ze **na elkaar** verschijnen (0 s, +0,4 s, +0,8 s) en op verschillende hoogtes, zodat je "Sokken. Alweer." ook echt kunt lezen. Dat is de beste grap van het spel.

## Kleinere ideeën (voor later)

- **Kip minder voorspelbaar** (bouwer): 50% kans per lont en op een willekeurig moment tussen 70% en 30%, in plaats van elke lont precies op 70%.
- **Echte slowmotion in TSSSS** (bouwer): iedereen beweegt die seconde op 40% snelheid. Dan zie je de houder in slowmotion naar iemand duiken. Dat is beter om naar te kijken en minder toeval.
- **Eindscherm-score** (bouwer): "1010 / 83 / 67" zegt niemand iets. Toon "overleefd: 83 s" of "👑".

## Zouden we dit op een feestje spelen?

**Ja.** Na twee rondes is iedereen hees van "NIET MIJ!" en "KOEN NEE!", al moet iemand Daan na de derde pingpong-finale wel even een kroket geven om te kalmeren. 🥟
