# 🎉 Speeltest 2: Bombardeer! 🥟💣

**Kort:** de drie grote klachten van test 1 zijn opgelost. Terugtikken komt niet meer voor, spoken hebben de hele ronde iets te doen en kiezen niet meer de winnaar, en de kip roept wie hij moet hebben. Dat laatste is meteen het grootste lachmoment van het spel. Wat overblijft: in de **finale** (en in een potje met 2 spelers) is het een **metronoom**. VEILIG loopt af, tik, VEILIG loopt af, tik. Verder staat de pauze tussen twee kroketten nog leeg, en valt "FINALE!" soms precies over de vulling-grap heen. Van een 7 naar een **8**.

## Wat we zagen

**Echte speltest** (`--players 2 --bots 4 --seconds 60 --out test-speel`): ✅ geen fouten, 19,8 updates per seconde op de iPhone, state 1,7 KB. Na 60 s was er nog geen ronde klaar, en dat klopt: een ronde met 6 spelers duurt ±80 s. Een tweede run van 170 s (zelfde map) haalde **2 rondes**, weer zonder fouten (state max 1,9 KB). Daarnaast heb ik zelf screenshots gemaakt op een iPhone van VEILIG, de kip, TSSSS, de BOEM-reeks (na 0,6 s en 1,3 s), de spookknop en het eindscherm.

**Extra metingen** (eigen simulatie van de echte `update` en `bot`, 100–150 rondes per aantal spelers):

| | Test 1 | Nu |
|---|---|---|
| Terugtik binnen 1,3 s | 51–73% van de overgaves | **0%** ✅ |
| Ontvanger van spook-gooi ontploft | 100% (als de gooi in TSSSS viel) | **4–6%** ✅ |
| Finale beslist door een spook-gooi | vaak | **1–7%** ✅ |
| Kip | elke lont, altijd op 70% | **±50%** van de lonten, op een willekeurig moment ✅ |
| Spook-banaan | bestond niet | ±6 per spook per minuut, 0,3–2,7 keer uitglijden per ronde ✅ |
| Rondeduur 2 / 4 / 6 / 8 spelers | 86 / 60 / 88 / 110 s | **83 / 64 / 80 / 102 s** ✅ |
| Eerste speler eruit | 17 s | 17–21 s |
| BOEM na een wissel in de laatste 2,5 s (lont + TSSSS) | 90% | 90% |

- ✅ Elke ronde eindigt met een winnaar. Sudden death was nooit nodig, en de winsten zijn eerlijk verdeeld over de bots.
- ✅ **De kip is eerlijk en spannend:** hij pakt zijn doelwit in 41–47% van de keren en een pechvogel die in de weg staat in 12–26%. In 41–65% ontsnapt het doelwit, en dan gaat de kroket "TERUG NAAR JOU!" naar de oude houder.
- ⚠️ **Metronoom in de finale:** met 2 spelers over duurt een beurt met de kroket gemiddeld **2,02 s**, precies de VEILIG-tijd. In 82–94% van de gevallen wordt er binnen 0,6 s na het einde van VEILIG getikt. De houder is sneller (410 tegen 380) en kan gewoon naast de veilige speler blijven hangen. Wie ontploft, hangt dus vooral af van hoeveel keer twee seconden er in de lont passen. In een potje met 2 spelers gaat de hele ronde zo.
- ⚠️ **TSSSS is een val:** 48% van de BOEMs treft iemand die de kroket pas in de TSSSS-seconde kreeg. De vergrendeling van 0,8 s is bijna net zo lang als TSSSS (1 s), dus die speler kan niks meer doen.
- ⚠️ **Dode pauze:** in de 3 s "Volgende kroket over…" heeft niemand iets te doen. De bots kruipen dan allemaal in het midden bij elkaar, en 70% van de nieuwe kroketten wordt na precies 0,8 s doorgegeven. Mensen kruipen minder dicht op elkaar, maar die 3 s zijn ook voor hen leeg.
- ⚠️ **Teksten over elkaar:** "FINALE! Nog 2 🔥" en "Nog 5!" moeten op de andere helft van het veld komen dan de BOEM. Maar de code kijkt pas 1,3 s later waar het nieuwe spook is, en dat is dan al weggevlogen. In de echte speltest (`2-spel-speler2-iphone.png`) staat "FINALE! Nog 2" dwars over "Een eend! Zomaar. 🦆" heen.

## De vier vrienden

**🙋 Sanne (gamet nooit, telefoon):** snapt het weer in 5 seconden. De groene VEILIG-bubbel met bordje begrijpt ze zonder uitleg: "groen, die hoef ik niet". Ze ligt er na ±17 s uit, maar nu heet haar knop meteen **"👻 Gooi"** en zegt de balk "Knop / spatie = kroket GOOIEN! (1×)". Ze gooit, en Bot Bea roept "NEE!". Daarna wordt het "🍌 6… 🍌 Leg" en laat ze bananen vallen, met een scheetje. Haar eerste spook-banaan laat Daan onderuitgaan ("SPOOKBANAAN! 👻"), en háár telefoon speelt het muntjesgeluid. Van "Veel plezier met toekijken" naar bananenkoningin: dat is een groot verschil. Kleine minnen: "spatie" zegt niks op een telefoon, en wie de gooi bewaart voor het goede moment, kan intussen geen bananen leggen.

**😤 Daan (fanatiek):** is blij. Mo kan niet meer terugtikken, en Daan moet echt jagen op wie níet groen is. Daarbij gebruikt hij de groep als schild en jaagt hij iemand in een hoek. De spook-gooi in de laatste seconde is weg ("eindelijk"). De kip kan hij ontlopen als hij snel reageert, want de kip is trager dan jij. Dan de finale tegen Lisa: tik… twee tellen… tik… twee tellen… tik. "We tellen gewoon tot twee, dit is geen tikkertje meer!" Hij krijgt de kroket in de TSSSS-seconde en kan niks meer. BOEM. "Revanche. NU." Dat is goed nieuws: hij wil wel meteen nog een keer.

**😈 Mo (de trol):** heeft een nieuw speeltje. Als spook hangt hij boven de vluchtroute van de koploper en laat hij daar een banaan vallen. In een finale met 8 spelers liggen er gemiddeld **7 bananen** op het veld: een mijnenveld van spoken. Op het laatste moment de winnaar kiezen lukt niet meer ("Te laat om te gooien! 👻"), en dat is precies goed. Kan Mo het spel breken? Nee. Als hij weggaat met de kroket, krijgt een ander een verse kroket met een volle lont. Verstoppen helpt niet, want de houder komt hem halen. Wel kan hij als VEILIGE speler iemand tegen de houder aan duwen. Dat is gemeen, maar eerlijk trollen.

**😂 Lisa (lacht om alles):** haar nieuwe top 5:
1. **"🐔 HIJ KOMT VOOR SANNE!"**, met een rood vizier, een stippellijn en een rode rand op Sannes scherm. De hele bank gilt "SANNE RENNEN!". En als de kip het opgeeft: "Pff, ik geef het op 🐔" en dan "TERUG NAAR JOU! 🙃" voor de oude houder.
2. De BOEM-reeks, die je nu kunt lezen: "AUW MIJN KROKET", dan "Sokken. Alweer. 🧦", dan "👻 SPOOK!", dan "Nog 4!".
3. Spoken die met een scheetgeluid een banaan leggen ("🍌 hihi").
4. "SPOOK-GOOI!", met een boogje en dan "DAAN NEE!".
5. In de TSSSS-seconde nog net doorgeven: "Oeps 🙃". Zielig voor de ander, dus extra grappig.

Minpunt: soms valt "FINALE! Nog 2 🔥" precies over de eend heen, en dan kun je allebei niet lezen.

## Cijfers

| | Test 1 | Nu | Waarom |
|---|---|---|---|
| Snap ik het meteen? | 8 | **8** | De knop heet nu goed ("👻 Gooi", "🍌 Leg", "🍌 5") en VEILIG zie je meteen. VEILIG is wel een extra regel, en de uitleg heeft nu 6 regels. |
| Lachmomenten | 8 | **9** | De kip met een naam is goud. Daarbij komen "TERUG NAAR JOU!", de scheet-bananen en een BOEM-reeks die je kunt lezen. Ruim 5 echte lachmomenten. |
| Spanning tot het eind | 7 | **8** | Echte achtervolgingen zolang er 3 of meer spelers zijn, en de laatste seconde is van de spelers en niet van de spoken. De finale tikt wel op de maat. |
| Eerlijkheid | 6 | **7** | Geen terugtikken, de kip eerlijk aangekondigd, spoken geen scheidsrechter meer. Wel is de finale vooral tellen, en 48% van de BOEMs treft iemand die in TSSSS geen kans meer had. |
| Gevoel | 7 | **8** | De VEILIG-bubbel springt erin, de kroket valt op zijn nieuwe houder, de kip fladdert eerst met een ❗, en de bananen vallen voordat ze glad zijn. Mooi. Het is nog steeds geen echte slowmotion, en bij een kluitje spelers lopen de namen door elkaar. |
| Willen we nog een rondje? | 7 | **8** | Rondes van 1–1,5 minuut, niemand zit stil (spoken leggen bananen), en het eindscherm toont seconden overleefd in plaats van rare getallen. |
| **Eindcijfer** | 7 | **8** | Een echt leuke partygame. Met de finale als echte achtervolging wordt het een 9. |

## Wat al heel goed is

- **VEILIG werkt:** 0% terugtikken, en je ziet in één oogopslag wie je niet kunt tikken.
- **De kip is de ster:** aangekondigd, te ontlopen, en met twee grappige afloop-momenten ("GEPAKT! 🎯" of "TERUG NAAR JOU! 🙃").
- **Spoken spelen mee** met één gooi en daarna elke 8 s een banaan, en ze kiezen niet meer de winnaar.
- **Leesbaar op een telefoon:** de bovenbalk zegt altijd wat er gebeurt ("De kip zoekt Bot Bram!", "JIJ HEBT HEM!"), en je eigen status staat in de tegelrand.
- **Rondelengte** blijft bij elk aantal spelers tussen 1 en 1¾ minuut.

## De 3 verbeterpunten

### 1. Hete handjes: wie de kroket krijgt, jongleert hem eerst even 🔥🤲 (bouwer regel, kunstenaar gevoel)
Wie de kroket door een **gewone tik** krijgt, loopt de eerste **0,5 s op 15% snelheid**. Dat valt binnen de vergrendeling van 0,8 s die er al is. Niet na een spook-gooi of de kip, anders worden spoken weer scheidsrechter. In `update`: `if (id === S.holder && p.hot > 0) sp *= 0.15`, met `p.hot = 0.5` in `pass()` bij een tik. De kunstenaar laat de kroket boven de houder van hand naar hand stuiteren, met "AU! HEET! HEET!" en een paar 💨-wolkjes.
*Gemeten:* in een duel daalt het aandeel tikken binnen 2,6 s van **82% naar 48%** (2 spelers) en van 86% naar 72% (finale bij 6 spelers). Een redding in TSSSS daalt van 48% naar 33–36%. Er blijven 16–19 overgaves per minuut, en de rondeduur verandert niet. Wie net doorgaf, krijgt zo een echte voorsprong, en dan wordt de finale een sprint-duel waarin Daan kan laten zien wat hij kan, in plaats van tellen tot twee.

### 2. De volgende kroket kiest al in de pauze zijn slachtoffer 🎯🥟 (bouwer, regel)
Kies bij de BOEM al wie de volgende kroket krijgt (zelfde regel: wie hem het minst had) en zet dat in `S.next`. In de pauze zegt de bovenbalk "🎯 Volgende kroket: SANNE! (3…)" en hangt er een stuiterende 🎯 boven Sanne. Bots vluchten in de pauze van `S.next` weg. Zo wordt de dode pauze een moment waarop iedereen gillend van Sanne wegrent voordat ze de kroket heeft ("WAAROM RENNEN JULLIE?!").
*Gemeten:* een nieuwe kroket die na precies 0,8 s al weer weg is, daalt van **70% naar 2–9%**. Bij de landing staat de dichtstbijzijnde speler ±500 ver weg in plaats van 64. De rondeduur blijft gelijk (80 s bij 6 spelers).

### 3. De finale een eigen moment geven, zonder teksten over elkaar 🔥🆚 (kunstenaar, gevoel)
- **Fix:** in het `uit`-event wordt `seen[d.id]` pas 1,3 s later gelezen, en dan is het spook al weggevlogen. Bewaar de BOEM-plek meteen bij het event, zodat "Nog N!" en "FINALE!" altijd op de andere helft komen dan "AUW MIJN KROKET" en de vulling-grap.
- **Finale-moment:** zolang er nog 2 over zijn, staat in de bovenbalk "🔥 DAAN 🆚 LISA 🔥", met de naam van de houder knipperend in rood. Spoken worden in de finale nog wat doorzichtiger (0,3 in plaats van 0,45). Zo blijven de twee finalisten tussen 6 spoken en 7 bananen goed te zien. Bij de winnende BOEM klinkt een extra `go` en komt er dubbele confetti.

## Kleinere ideeën (voor later)

- **Knoptekst op een telefoon** (bouwer): "Knop / spatie = …" alleen op een laptop. Op een telefoon is "Druk op 👻 Gooi!" genoeg.
- **Bananen sparen** (bouwer): laat een spook ook een banaan leggen als de gooi nog niet gebruikt is, bijvoorbeeld met kort drukken voor een banaan en lang drukken voor de gooi. Dan hoeft Sanne niet te kiezen tussen wachten en meedoen.
- **Echte slowmotion in TSSSS** (bouwer): iedereen beweegt die seconde op 40% snelheid. Dat is mooier om naar te kijken en het maakt de TSSSS-val minder hard.

## Zouden we dit op een feestje spelen?

**Ja, zeker.** Na drie rondes roept de hele bank "SANNE RENNEN!" zodra er een kip verschijnt, en Mo heeft zijn roeping gevonden als bananenspook. Alleen Daan zit in de finale nog hardop "één, twee… tik" te tellen. 🥟🐔
