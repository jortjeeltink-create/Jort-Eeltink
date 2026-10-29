---
type: bron
onderwerp: MVO in de generatieve-AI-branche (planet, people, succesverhalen, greenwashing, SDG's)
vak: mapping-the-business
tags: [bron, vak/mapping-the-business]
aangemaakt: 2026-10-29
---
# MVO in de generatieve-AI-branche

Onderzoek voor het brancheonderzoek **Digital Business & Generative AI** van [[mapping-the-business]], lesweek 4 (podcast van 3–5 minuten over ontwikkelingen, uitdagingen en succesverhalen). Vervolg met de blik vooruit: [[ai-trends-toekomst]].

## Samenvatting
Generatieve AI is een branche met twee gezichten. Aan de **planet**-kant kost AI veel stroom en water. Datacenters gebruiken nu ongeveer 1,5% van alle elektriciteit ter wereld, en dat verbruik verdubbelt waarschijnlijk vóór 2030. In Nederland leidde dat tot verzet: Meta zag in 2022 af van een megadatacenter in Zeewolde, en het kabinet wilde in 2022 nieuwe hyperscale datacenters alleen nog op twee plekken aan de rand van het land toestaan. Techbedrijven investeren in kernenergie en zuinigere modellen, maar hun totale uitstoot stijgt toch.

Aan de **people**-kant zijn er vier grote zorgen. Algoritmes kunnen discrimineren (de toeslagenaffaire is de Nederlandse waarschuwing). Data-labelers in lagelonenlanden doen zwaar werk voor weinig geld. Makers zien hun werk zonder toestemming gebruikt worden. En banen veranderen, vooral voor starters.

Er zijn ook **succesverhalen**: AlphaFold leverde in 2024 een Nobelprijs op, AI helpt bij borstkankerscreening en overstromingswaarschuwingen, en Nederland bouwt met GPT-NL een eigen, transparant taalmodel.

**Greenwashing** speelt ook. Techbedrijven melden met "100% groene stroom" een veel lagere uitstoot dan hun datacenters op het lokale stroomnet veroorzaken, en een Duitse rechter verbood Apple om de Apple Watch "CO₂-neutraal" te noemen.

De drie SDG's die het meest bij de branche passen: **SDG 7** (energie), **SDG 8** (werk) en **SDG 9** (innovatie en infrastructuur).

## Belangrijkste punten

### 1. Planet: energie en water

**Stroomverbruik van datacenters (wereld)**
- Datacenters verbruikten in 2024 ongeveer **415 TWh** stroom, zo'n **1,5%** van al het elektriciteitsverbruik op aarde [1][2].
- Het Internationaal Energieagentschap (IEA) verwacht dat dit tot 2030 ongeveer **verdubbelt naar 945 TWh**. Dat is iets meer dan wat heel Japan nu per jaar gebruikt [1][2]. Bron: het IEA-rapport *Energy and AI* (april 2025), zoals beschreven door Nature/Scientific American en Down To Earth.
- Het verbruik groeide de afgelopen vijf jaar al met ongeveer **12% per jaar** [2].
- AI-servers waren in 2024 goed voor **24%** van de stroom van servers en **15%** van al het datacenterverbruik [1]. AI is volgens het IEA de grootste aanjager van de groei [2].
- De VS en China zijn samen goed voor bijna **80%** van de verwachte groei tot 2030 [1]. In de VS zijn datacenters verantwoordelijk voor bijna de helft van de groei van de stroomvraag [2].
- Schaal: een gewoon datacenter gebruikt 10–25 MW. Een hyperscale datacenter voor AI gebruikt **100 MW of meer**, zoveel stroom per jaar als **100.000 huishoudens** [2].
- Stroommix van datacenters nu: kolen ongeveer 30%, hernieuwbaar 27%, aardgas 26%, kernenergie 15% [2]. Hernieuwbare bronnen leveren naar verwachting bijna de helft van de extra vraag [2].
- Ongeveer **20%** van de geplande datacenters kan vertraging oplopen omdat het stroomnet ze niet op tijd kan aansluiten [1].
- Kritiek: Alex de Vries noemt de groei een mogelijk "serious risk for our ability to achieve our climate goals" [1].

**Waterverbruik**
- Datacenters gebruiken water om servers te koelen. Onderzoekers Li, Yang, Islam en Ren schatten dat de wereldwijde vraag naar AI in 2027 goed is voor **4,2–6,6 miljard m³** wateronttrekking. Dat is meer dan 4 tot 6 keer de jaarlijkse wateronttrekking van Denemarken, of de helft van die van het Verenigd Koninkrijk [3].
- Nederlands voorbeeld: het Microsoft-datacenter in **Middenmeer** (Noord-Holland) gebruikte in 2021 ongeveer **84 miljoen liter drinkwater**. Vooraf was 12–20 miljoen liter per jaar beloofd. Microsoft zei dat het hoge verbruik door de bouwfase kwam en dat het alleen met water koelt als het buiten warmer is dan 25 °C [4]. Het nieuws kwam uit onderzoek van het Noordhollands Dagblad [4].

**Datacenters in Nederland: Zeewolde en het hyperscale-beleid**
- Meta (Facebook) wilde in **Zeewolde** een datacenter van **166 hectare** bouwen, met evenveel stroomverbruik als alle Amsterdamse huishoudens samen [5]. DutchNews vergeleek de energievraag met die van een stad van 460.000 inwoners [7].
- Nederland had in 2022 drie hyperscale datacenters: Microsoft en Google in de Wieringermeer en Google in de Eemshaven. Samen leveren ze ongeveer 750 banen op. Minister De Jonge noemde de economische waarde "relatief beperkt" [5].
- Bij de gemeenteraadsverkiezingen van maart 2022 kregen tegenstanders een meerderheid, waarna Meta het plan stilzette [7][8]. Begin juli 2022 meldde DutchNews dat Meta definitief stopte: het project was "not the right investment". Ook weigerde het kabinet een deel van de grond te verkopen [6][7].
- In september 2023 vernietigde de Raad van State het bestemmingsplan, zodat er ook met een ander bedrijf geen datacenter kan komen [8].
- Het kabinet stemde in juni 2022 in met een ontwerpbesluit: nieuwe hyperscale datacenters mogen alleen nog in een deel van Het Hogeland (Groningen) en op Agriport A7/B1 in Hollands Kroon (Noord-Holland) [6]. Minister De Jonge: "Nederland is te klein en de schaarste is te groot om slordig om te gaan met onze ruimte of met onze energie." [6]
- Of dit ontwerpbesluit later definitief is ingevoerd, en wat de huidige regels zijn, kon ik niet bevestigen. #vraag

**Wat bedrijven doen**
- **Kernenergie.** Microsoft sloot een stroomcontract van **20 jaar** met Constellation om een reactor van Three Mile Island (VS) te herstarten als Crane Clean Energy Center (ongeveer **835 MW**, verwacht in **2028**) [9]. Google tekende voor maximaal **500 MW** aan kleine modulaire kernreactoren (SMR's) van Kairos Power. De eerste moet in 2030 draaien, de rest volgt tot 2035 [10].
- **Zuinigere modellen.** Google zegt dat een gemiddelde (mediane) tekstprompt in Gemini **0,24 Wh** stroom en **0,26 ml** water kost: "equivalent to watching TV for less than nine seconds". Het energieverbruik per prompt zou in twaalf maanden **33 keer** zijn gedaald [11]. Let op: Google schrijft zelf dat deze cijfers "have not been verified by an independent third-party" [11].
- **Groene stroom.** Microsoft zegt dat het in boekjaar 2025 evenveel hernieuwbare stroom heeft ingekocht als het wereldwijd verbruikte (100%), en meer water heeft aangevuld dan het onttrok [38].
- **Rapportageplicht in de EU.** Volgens de Europese Energie-efficiëntierichtlijn (artikel 12) moeten datacenters met minstens **500 kW** IT-vermogen elk jaar hun energieverbruik, waterverbruik en restwarmte melden in een Europese database. Het publiek ziet alleen samengevoegde cijfers per land en voor de hele EU [12].

### 2. People: bias, arbeid, auteursrecht en banen

**Bias en discriminatie**
- **Toeslagenaffaire (waarschuwing over algoritmes).** De Belastingdienst gebruikte vanaf 2013 een risicomodel voor de kinderopvangtoeslag waarin meetelde of iemand de Nederlandse nationaliteit had. Aanvragers zonder Nederlandse nationaliteit kregen een hogere risicoscore. Het systeem leerde zichzelf bij zonder echte menselijke controle, en ambtenaren kregen niet te zien waarom iemand als risico werd aangemerkt. Tienduizenden ouders, vooral met lage inkomens, werden ten onrechte als fraudeur behandeld [14]. Amnesty: "The black box system resulted in a black hole of accountability" [14].
- De Autoriteit Persoonsgegevens gaf de Belastingdienst in december 2021 een boete van **€ 2,75 miljoen** voor het onrechtmatig en discriminerend verwerken van de dubbele nationaliteit. In mei 2018 stonden nog **1,4 miljoen** mensen met een dubbele nationaliteit in de systemen [13]. AP-voorzitter Aleid Wolfsen: "Dat is bij 'Toeslagen' vreselijk misgegaan, met alle gevolgen van dien." [13]
- **Bias in taalmodellen.** Een studie in *Nature* (2024) liet zien dat taalmodellen (o.a. GPT-2, GPT-3.5, GPT-4, RoBERTa en T5) mensen die Afro-Amerikaans Engels schrijven verborgen negatief beoordelen, ook als ras nooit genoemd wordt [15][16]. In proefsituaties gaven de modellen deze sprekers vaker minder aanzienlijk werk, vaker een veroordeling en vaker de doodstraf [15]. Training met menselijke feedback verborg de vooroordelen vooral, in plaats van ze weg te nemen [15]. Citaat: "Here, we demonstrate that language models embody covert racism in the form of dialect prejudice" [15].

**Arbeidsomstandigheden van data-labelers (Kenia)**
- TIME onthulde in januari 2023: "OpenAI used outsourced Kenyan laborers earning less than $2 per hour" [17]. Werknemers van het bedrijf Sama lazen en labelden tienduizenden teksten over seksueel misbruik, haat en geweld, om een filter te trainen dat ChatGPT minder giftig maakt [17].
- De werknemers verdienden ongeveer **$1,32–$2 per uur**. In de contracten van OpenAI met Sama stond een tarief van **$12,50 per uur** [17]. Sama zegt dat dat bedrag ook alle andere kosten dekte [17].
- Drie werknemers moesten volgens eigen zeggen **150–250 teksten per dienst van negen uur** labelen (Sama zegt: 70). Alle vier geïnterviewde werknemers zeiden er psychische schade aan over te houden [17]. Een van hen: "That was torture." [17]

**Auteursrecht van makers**
- Auteurs klaagden AI-bedrijf Anthropic aan. In juni 2025 oordeelde een Amerikaanse rechter dat **trainen op boeken "fair use"** (toegestaan) was. Het opslaan van meer dan **7 miljoen illegaal gedownloade boeken** was dat volgens hem niet [19].
- Anthropic schikte voor **$1,5 miljard**, ongeveer **$3.000 per boek** voor zo'n **500.000 boeken** [18]. De advocaten van de auteurs noemden het "the largest copyright recovery in history" [18]. De rechtbank keurde de schikking in september 2025 voorlopig goed [19] en in juli 2026 definitief [20].
- Let op: dit gaat over Amerikaans recht. Het laat zien dat het gebruik van werk van makers geld en reputatie kan kosten, maar het is geen regel voor Nederland.

**Impact op banen**
- Volgens de *Future of Jobs Report 2025* van het World Economic Forum ontstaan tot 2030 wereldwijd **170 miljoen** nieuwe banen en verdwijnen er **92 miljoen**: netto **+78 miljoen** [21][22]. Ongeveer **39%** van de huidige vaardigheden verandert [22]. **41%** van de werkgevers wil personeel inkrimpen waar AI taken overneemt, en **77%** wil personeel bijscholen [21]. Banen die krimpen zijn onder meer kassamedewerker, administratief medewerker en grafisch ontwerper [21].
- Het IMF schat dat bijna **40%** van alle banen wereldwijd met AI te maken krijgt, en in rijke landen ongeveer **60%**. In rijke landen kan ongeveer de helft van die banen juist profiteren [23]. IMF-topvrouw Georgieva: "In most scenarios, AI will likely worsen overall inequality." [23]
- Starters lijken als eerste geraakt. In de VS ligt de werkgelegenheid van 22- tot 25-jarigen in beroepen waar AI veel kan overnemen **19%** lager dan wanneer die was meegegroeid met leeftijdsgenoten in beroepen met weinig AI-blootstelling [24]. De onderzoekers noemen dit een vroeg signaal, geen bewezen oorzaak [24].

### 3. Succesverhalen: AI die maatschappelijk helpt
- **AlphaFold en de Nobelprijs scheikunde 2024.** Demis Hassabis en John Jumper (Google DeepMind) kregen de helft van de prijs voor het voorspellen van eiwitstructuren met AlphaFold2. David Baker kreeg de andere helft voor het ontwerpen van nieuwe eiwitten [25][26]. AlphaFold2 (2020) voorspelde de structuur van vrijwel alle **200 miljoen** bekende eiwitten en is gebruikt door meer dan **2 miljoen** onderzoekers in **190 landen** [25][26]. Toepassingen zijn onder meer onderzoek naar antibioticaresistentie en enzymen die plastic afbreken [25][26].
- **Zorg: borstkankerscreening.** In de MASAI-studie (105.934 vrouwen) vond screening met AI-ondersteuning **29% meer** kankers (6,4 tegen 5,0 per 1.000), zonder meer vals alarm. Er waren **44,2% minder** beoordelingen van beelden door radiologen nodig [27]. "The findings suggest that AI contributes to the early detection of clinically relevant breast cancer." [27]
- **Klimaat: overstromingen voorspellen.** Google voorspelt met AI overstromingen tot **zeven dagen** vooruit in meer dan **80 landen**, ook bij rivieren zonder meetstations. Volgens het bijbehorende *Nature*-artikel zijn de voorspellingen vier tot vijf dagen vooruit even betrouwbaar als het bestaande wereldwijde systeem (GloFAS) op de dag zelf, of betrouwbaarder [28]. Bijna **1,5 miljard** mensen (19% van de wereldbevolking) lopen ernstig overstromingsrisico [28].
- **Nederland: GPT-NL.** TNO, SURF en het NFI bouwen sinds eind 2023 een eigen Nederlands taalmodel, met **€ 13,5 miljoen** van het ministerie van Economische Zaken [29][33][34]. Doel: transparant, met minder afhankelijkheid van Amerikaanse big tech [29][31]. Het model wordt alleen getraind op data waarvoor toestemming is, en de eigenaren van die data worden betaald [34]. Nederlandse media stellen oude nieuwsartikelen beschikbaar en krijgen een vergoeding als het model commercieel wordt [31]. Selmar Smit (TNO): "Als overheid kun je het niet maken om te leunen op de modellen van big tech." [29]
  - **Status (oktober 2026):** sinds eind februari 2026 testen vijf "launching customers" het model, onder wie TNO, het NFI, het ministerie van BZK (o.a. een assistent voor Overheid.nl) en ICTU (chatbot Gem, die bijna dertig gemeenten gebruiken) [30]. TNO schreef in juli 2026: "organisations can now start using it in practice" [32]. De broncode is open source; de modelgewichten zijn alleen beschikbaar onder een gecontroleerde licentie [33]. Particulieren kunnen het model niet gebruiken [31]. Of er al een brede marktlancering met prijzen is geweest, kon ik niet bevestigen. #vraag

### 4. Greenwashing in de techsector
**Hoofdvoorbeeld: "100% groene stroom" tegenover de werkelijke uitstoot**
- Techbedrijven rekenen hun uitstoot vaak "marktgebaseerd". Ze kopen certificaten voor groene stroom (RECs), die ook kunnen horen bij stroom die ergens anders ter wereld is opgewekt. Dan lijkt een datacenter op een kolenrijk stroomnet toch schoon. De "locatiegebaseerde" methode telt de uitstoot van het stroomnet waar het datacenter echt staat [36].
- Een analyse van The Guardian (2024-09-15) kwam uit op een werkelijke uitstoot van de eigen datacenters van Google, Microsoft, Meta en Apple over 2020–2022 die waarschijnlijk **7,62 keer (662%) hoger** is dan officieel gemeld [35][36]. Voorbeeld Meta 2022: officieel **273 ton** CO₂, locatiegebaseerd **3,8 miljoen ton** [36].
- De eigen duurzaamheidsrapporten laten de uitstoot stijgen:
  - **Microsoft** wil in 2030 "carbon negative" zijn. In boekjaar 2024 lag de totale uitstoot (scope 1, 2 en 3) toch **23,4% hoger** dan in 2020, vooral door AI en de groei van de cloud [37]. In boekjaar 2025 steeg de uitstoot nog eens **25%** ten opzichte van het jaar ervoor. Dat kwam deels doordat Microsoft stopte met het kopen van losse groene-stroomcertificaten [38]. Microsoft geeft toe: "sustainability solutions are not scaling fast enough to meet demand." [38]
  - **Google** heeft als doel netto nul uitstoot in 2030 [40]. Toch steeg de uitstoot van **7,6 miljoen ton (2019) naar 11,5 miljoen ton (2024): +51%**. De grootste groei zat in de toeleveringsketen (scope 3), die 73% van de voetafdruk uitmaakt [39].
- **Waarom dit greenwashing-kritiek oplevert:** de claim "100% hernieuwbaar" is boekhoudkundig juist, maar geeft een te rooskleurig beeld van de echte uitstoot. Microsoft stopte zelf met losse certificaten, en de gemelde uitstoot steeg daardoor. Dat laat zien hoeveel die certificaten het beeld bepaalden [38].

**Extra voorbeeld dat door een rechter is getoetst: Apple Watch "CO₂-neutraal"**
- Het Landgericht Frankfurt oordeelde in augustus 2025 dat Apple de Apple Watch niet als CO₂-neutraal mag aanprijzen, omdat dat misleidend is. De compensatie liep via eucalyptusplantages in Paraguay, waarvan grote delen maar tot 2029 gepacht zijn. Volgens de rechter "reicht der Hinweis auf Kompensationsprojekte nicht aus" [41]. Het vonnis was op dat moment nog niet definitief [41].

### 5. De drie meest relevante SDG's
Een studie in *Nature Communications* (2020) concludeert dat AI kan helpen bij **134** van de 169 SDG-subdoelen (79%), maar **59** subdoelen (35%) kan tegenwerken [42].

| SDG | Officiële titel (VN) | Waarom relevant voor generatieve AI |
|---|---|---|
| **SDG 7: Betaalbare en duurzame energie** | "Ensure access to affordable, reliable, sustainable and modern energy for all" [43a] | AI-datacenters verdubbelen hun stroomverbruik tot 2030 [1]. Subdoel 7.2 (meer hernieuwbare energie) en 7.3 (de verbetering van energie-efficiëntie verdubbelen) gaan over de keuze tussen kolen, gas, wind of kernenergie, en over zuinigere modellen [43a]. |
| **SDG 8: Waardig werk en economische groei** | "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all" [43b] | AI verhoogt de productiviteit (subdoel 8.2), maar verschuift ook banen [21][23]. Subdoel 8.8 gaat over arbeidsrechten en veilig werk, ook voor mensen met onzeker werk, zoals de data-labelers in Kenia [17][43b]. |
| **SDG 9: Industrie, innovatie en infrastructuur** | "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation" [43c] | AI is innovatie, en datacenters zijn de infrastructuur. Subdoel 9.4 vraagt om duurzame infrastructuur, 9.5 om meer onderzoek en 9.c om toegang tot ICT voor iedereen [43c]. AlphaFold en GPT-NL zijn voorbeelden bij 9.5 [25][29]. |

Goede alternatieven: **SDG 13 (klimaatactie)**, vanwege de stijgende uitstoot van Google en Microsoft [37][39], en **SDG 10 (minder ongelijkheid)**, vanwege bias en de IMF-waarschuwing over ongelijkheid [15][23].

## Betrouwbaarheid
- **Sterk onderbouwd** (primaire of wetenschappelijke bron, of twee onafhankelijke bronnen): de IEA-cijfers 415 TWh en 945 TWh [1][2], de toeslagenaffaire [13][14], de Nature-studie over dialect-bias [15][16], het TIME-onderzoek [17], de Anthropic-schikking [18][19][20], de WEF-banencijfers [21][22], AlphaFold [25][26], MASAI [27], het hyperscale-beleid van 2022 [5][6] en Microsofts eigen uitstootcijfers [37].
- **Secundair:** de websites van IEA, WEF en The Guardian konden niet direct geopend worden (blokkade). De IEA-cijfers komen daarom via Nature/Scientific American en Down To Earth, de Guardian-analyse via eceee en Impakter. Klein verschil: Down To Earth zegt dat hernieuwbare bronnen "bijna de helft" van de extra vraag dekken, Scientific American dat twee derde van de geplande nieuwe capaciteit hernieuwbaar is. Dat zijn verschillende maten, dus beide kunnen kloppen [1][2].
- **Bedrijfsclaims:** de Gemini-cijfers van Google [11], de groene-stroomclaim van Microsoft [38] en de overstromingscijfers [28] komen van de bedrijven zelf. Google schrijft zelf dat de Gemini-cijfers niet onafhankelijk zijn gecontroleerd [11].
- **Schattingen:** het waterverbruik voor 2027 [3] en de Guardian-factor 7,62 [35][36] zijn schattingen met aannames, geen metingen. Bij Meta noemt Impakter een factor van "19.000 keer", maar dat klopt niet met de eigen getallen (3,8 miljoen / 273 is ongeveer 13.900; eigen berekening). Gebruik daarom de getallen (273 ton tegen 3,8 miljoen ton) en niet een factor [36].
- **Middenmeer:** de 84 miljoen liter komt uit lokale journalistiek. Microsoft geeft een andere verklaring (bouwfase) [4].
- **Banen:** het WEF-rapport is een enquête onder werkgevers (verwachtingen, geen metingen). Het Stanford-onderzoek [24] is een working paper zonder peer review. "Blootgesteld aan AI" (IMF) betekent niet "verdwijnt" [23].
- **Open vragen:** de huidige status van de Nederlandse hyperscale-regels en de brede marktlancering van GPT-NL. Beide zijn gemarkeerd met #vraag.

## Aanknopingspunten voor de podcast (lesweek 4)
- **Openingshaak:** één hyperscale AI-datacenter gebruikt evenveel stroom als 100.000 huishoudens [2], en Zeewolde zou evenveel stroom hebben gebruikt als alle Amsterdamse huishoudens [5].
- **Uitdaging:** de groei van AI tegenover klimaatdoelen. Google +51% [39], Microsoft +23,4% [37].
- **Nederlandse les:** de toeslagenaffaire laat zien wat er gebeurt als algoritmes zonder controle beslissen [14].
- **Succesverhaal:** AlphaFold [25] of MASAI [27], met GPT-NL als Nederlands, transparant alternatief [30].

## Bronnen
1. Chen, S. (2025, 10 april). *Data centers will use twice as much energy by 2030—driven by AI*. Scientific American (overgenomen uit Nature). Geraadpleegd op 29 oktober 2026, van https://www.scientificamerican.com/article/ai-will-drive-doubling-of-data-center-energy-demand-by-2030/
2. Krishnamurthy, R. (2025, 10 april). *Energy demand for data centres to double by 2030, AI biggest driver: IEA*. Down To Earth. Geraadpleegd op 29 oktober 2026, van https://www.downtoearth.org.in/energy/energy-demand-for-data-centres-to-double-by-2030-ai-biggest-driver-iea
3. Li, P., Yang, J., Islam, M. A., & Ren, S. (2025). *Making AI less "thirsty": Uncovering and addressing the secret water footprint of AI models* (arXiv:2304.03271v5) [Preprint]. arXiv. Geraadpleegd op 29 oktober 2026, van https://arxiv.org/abs/2304.03271
4. Aquatech. (2022, 7 september). *Microsoft data centre uses too much water*. Geraadpleegd op 29 oktober 2026, van https://www.aquatechtrade.com/news/industrial-water/microsoft-data-centre-uses-too-much-water
5. Tweede Kamer der Staten-Generaal. (2022, 23 juni). *Uitgelicht: Datacenters in Nederland*. Geraadpleegd op 29 oktober 2026, van https://www.tweedekamer.nl/debat_en_vergadering/uitgelicht/datacenters-nederland
6. Rijksoverheid. (2022, 10 juni). *Kabinet beperkt mogelijkheid tot vestiging hyperscale datacentra* [Nieuwsbericht]. Geraadpleegd op 29 oktober 2026, van https://www.rijksoverheid.nl/actueel/nieuws/2022/06/10/kabinet-beperkt-mogelijkheid-tot-vestiging-hyperscale-datacentra
7. DutchNews.nl. (2022, 1 juli). *'Not a good match': Facebook parent drops Zeewolde data centre plan*. Geraadpleegd op 29 oktober 2026, van https://www.dutchnews.nl/news/2022/07/not-a-good-match-facebook-parent-drops-zeewolde-data-centre-plan/
8. NL Times. (2023, 21 september). *Court strikes down Meta's data center plans in Zeewolde*. Geraadpleegd op 29 oktober 2026, van https://nltimes.nl/2023/09/21/court-strikes-metas-data-center-plans-zeewolde
9. Constellation Energy. (2024, 20 september). *Constellation to launch Crane Clean Energy Center, restoring jobs and carbon-free power to the grid* [Persbericht]. Geraadpleegd op 29 oktober 2026, van https://www.constellationenergy.com/news/2024/Constellation-to-Launch-Crane-Clean-Energy-Center-Restoring-Jobs-and-Carbon-Free-Power-to-The-Grid.html
10. Terrell, M. (2024, 14 oktober). *New nuclear clean energy agreement with Kairos Power*. Google The Keyword. Geraadpleegd op 29 oktober 2026, van https://blog.google/outreach-initiatives/sustainability/google-kairos-power-nuclear-energy-agreement/
11. Vahdat, A., & Dean, J. (2025, 21 augustus). [Blogpost over het energie-, water- en CO₂-gebruik van Gemini-prompts]. Google Cloud Blog. Geraadpleegd op 29 oktober 2026, van https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference
12. Energimyndigheten. (z.d.). *Data centre energy performance reporting*. Swedish Energy Agency. Geraadpleegd op 29 oktober 2026, van https://www.energimyndigheten.se/en/climate/climate/data-centre-energy-performance-reporting/
13. NOS. (2021, 7 december). *Boete voor Belastingdienst van 2,7 miljoen voor discriminatie toeslagenouders*. Geraadpleegd op 29 oktober 2026, van https://nos.nl/artikel/2408587-boete-voor-belastingdienst-van-2-7-miljoen-voor-discriminatie-toeslagenouders
14. Amnesty International. (2021, 25 oktober). *Dutch childcare benefit scandal an urgent wake-up call to ban racist algorithms*. Geraadpleegd op 29 oktober 2026, van https://www.amnesty.org/en/latest/news/2021/10/xenophobic-machines-dutch-child-benefit-scandal/
15. Hofmann, V., Kalluri, P. R., Jurafsky, D., & King, S. (2024). AI generates covertly racist decisions about people based on their dialect. *Nature, 633*(8028), 147–154. https://doi.org/10.1038/s41586-024-07856-5 (geraadpleegd op 29 oktober 2026 via https://pmc.ncbi.nlm.nih.gov/articles/PMC11374696/)
16. Miller, K. (2024, 3 september). *Covert racism in AI: How language models are reinforcing outdated stereotypes*. Stanford HAI. Geraadpleegd op 29 oktober 2026, van https://hai.stanford.edu/news/covert-racism-ai-how-language-models-are-reinforcing-outdated-stereotypes
17. Perrigo, B. (2023, 18 januari). *Exclusive: OpenAI used Kenyan workers on less than $2 per hour to make ChatGPT less toxic*. TIME. Geraadpleegd op 29 oktober 2026, van https://time.com/6247678/openai-chatgpt-kenya-workers/
18. Brittain, B., & Scarcella, M. (2025, 8 september). [Reuters-artikel over de schikking van $1,5 miljard tussen Anthropic en auteurs]. Insurance Journal. Geraadpleegd op 29 oktober 2026, van https://www.insurancejournal.com/news/national/2025/09/08/838176.htm
19. Brittain, B. (2025, 26 september). *Judge preliminarily approves $1.5B Anthropic copyright settlement*. Insurance Journal (Reuters). Geraadpleegd op 29 oktober 2026, van https://www.insurancejournal.com/news/national/2025/09/26/840753.htm
20. Hansen, D. (2026, 21 juli). *Bartz v. Anthropic settlement receives final approval*. Authors Alliance. Geraadpleegd op 29 oktober 2026, van https://www.authorsalliance.org/2026/07/21/bartz-v-anthropic-settlement-receives-final-approval/
21. World Economic Forum. (2025, 14 januari). *Future of Jobs Report 2025: 78 million new jobs by 2030 but urgent upskilling needed to prepare workforces* [Persbericht]. Eco-Business. Geraadpleegd op 29 oktober 2026, van https://www.eco-business.com/press-releases/future-of-jobs-report-2025-78-million-new-jobs-by-2030-but-urgent-upskilling-needed-to-prepare-workforces
22. Europese Commissie, Digital Skills and Jobs Platform. (2026, 16 februari). *Future of Jobs Report 2025*. Geraadpleegd op 29 oktober 2026, van https://digital-skills-jobs.europa.eu/en/latest/research/future-jobs-report-2025
23. Georgieva, K. (2024, 14 januari). *AI will transform the global economy. Let's make sure it benefits humanity*. IMF Blog. Geraadpleegd op 29 oktober 2026, van https://www.imf.org/en/Blogs/Articles/2024/01/14/ai-will-transform-the-global-economy-lets-make-sure-it-benefits-humanity
24. Brynjolfsson, E., Chandar, B., & Chen, R. (2026). *Canaries in the coal mine? Six facts about the recent employment effects of artificial intelligence* [Working paper, herziene versie van 12 augustus 2026]. Stanford Digital Economy Lab. Geraadpleegd op 29 oktober 2026, van https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine
25. Universiteit Utrecht. (2024, 9 oktober). *Nobel Prize in Chemistry 2024 for AlphaFold2 and protein design*. Geraadpleegd op 29 oktober 2026, van https://www.uu.nl/en/news/nobel-prize-in-chemistry-2024-for-alphafold2-and-protein-design
26. Franzen, C. (2024, 9 oktober). *AI wins another Nobel, this time in chemistry: Google DeepMinders Hassabis and Jumper awarded for AlphaFold*. VentureBeat. Geraadpleegd op 29 oktober 2026, van https://venturebeat.com/ai/ai-wins-another-nobel-this-time-in-chemistry-google-deepminders-hassabis-and-jumper-awarded-for-alphafold
27. Hernström, V., Josefsson, V., Sartor, H., Schmidt, D., Larsson, A.-M., Hofvind, S., Andersson, I., Rosso, A., Hagberg, O., & Lång, K. (2025). Screening performance and characteristics of breast cancer detected in the Mammography Screening with Artificial Intelligence trial (MASAI). *The Lancet Digital Health, 7*(3), e175–e183. https://doi.org/10.1016/S2589-7500(24)00267-X (geraadpleegd op 29 oktober 2026 via https://pubmed.ncbi.nlm.nih.gov/39904652/)
28. Matias, Y., & Nearing, G. (2024, 20 maart). *Using AI to expand global access to reliable flood forecasts*. Google Research Blog. Geraadpleegd op 29 oktober 2026, van https://research.google/blog/using-ai-to-expand-global-access-to-reliable-flood-forecasts/
29. Redactie Binnenlands Bestuur. (2023, 2 november). *Overheden kunnen straks oefenen met transparant AI*. Binnenlands Bestuur. Geraadpleegd op 29 oktober 2026, van https://www.binnenlandsbestuur.nl/digitaal/overheden-kunnen-straks-oefenen-met-transparant-ai
30. Van Trigt, M. (2026, 2 maart). *Vijf organisaties testen GPT-NL in eigen context*. Binnenlands Bestuur. Geraadpleegd op 29 oktober 2026, van https://www.binnenlandsbestuur.nl/digitaal/vijf-organisaties-testen-gpt-nl-in-eigen-context
31. ANP. (2026, 27 februari). *Overheidsinstanties gaan proefdraaien met Nederlands AI-model*. Accountant.nl. Geraadpleegd op 29 oktober 2026, van https://www.accountant.nl/nieuws/2026/2/overheidsinstanties-gaan-proefdraaien-met-nederlands-ai-model/
32. TNO. (2026, 14 juli). *Time setter story: Saskia Lensink about GPT-NL*. Geraadpleegd op 29 oktober 2026, van https://www.tno.nl/en/newsroom/insights/2026/07/time-setter-story-saskia-lensink-gpt-nl/
33. TNO. (z.d.). *GPT-NL* [Projectpagina]. Geraadpleegd op 29 oktober 2026, van https://tno.nl/en/digital/artificial-intelligence/gpt-nl
34. Digital Government. (2026, 10 april). *GPT-NL preparing for next phase*. Ministerie van Binnenlandse Zaken en Koninkrijksrelaties. Geraadpleegd op 29 oktober 2026, van https://www.nldigitalgovernment.nl/news/gpt-nl-preparing-for-next-phase/
35. eceee. (2024). *Data center emissions probably 662% higher than big tech claims. Can it keep up the ruse?* [Samenvatting van een analyse van The Guardian, 15 september 2024]. European Council for an Energy Efficient Economy. Geraadpleegd op 29 oktober 2026, van https://www.eceee.org/all-news/news/data-center-emissions-probably-662-higher-than-big-tech-claims-can-it-keep-up-the-ruse/
36. Camillo, A. (2024, 20 september). *Apple, Google, Meta and Microsoft's data centre emissions may be 7.62 times higher than reported*. Impakter. Geraadpleegd op 29 oktober 2026, van https://impakter.com/apple-google-meta-and-microsofts-data-centre-emissions-may-be-7-62-times-higher-than-reported/
37. Smith, B., & Nakagawa, M. (2025, 29 mei). *Our 2025 Environmental Sustainability Report*. Microsoft On the Issues. Geraadpleegd op 29 oktober 2026, van https://blogs.microsoft.com/on-the-issues/2025/05/29/environmental-sustainability-report/
38. Moon, M. (2026, 10 juli). *Microsoft's AI drive saw its carbon emissions grow by 25 percent in 2025*. Engadget. Geraadpleegd op 29 oktober 2026, van https://engadget.com/2212136/microsoft-ai-drive-carbon-emissions-grow-25-percent-2025
39. Kobie, N. (2025, 2 juli). *Google emissions have surged 51% in five years – but it's making solid progress in data center efficiency*. ITPro. Geraadpleegd op 29 oktober 2026, van https://www.itpro.com/infrastructure/data-centres/google-emissions-increase-data-center-reduction
40. Balkan Green Energy News. (2025, 28 augustus; bijgewerkt 2026, 2 juni). *Google reveals Gemini AI's energy and water consumption*. Geraadpleegd op 29 oktober 2026, van https://balkangreenenergynews.com/google-reveals-gemini-ais-energy-and-water-consumption/
41. ZDFheute. (2025, 26 augustus). *Gericht untersagt Apple-Watch-Werbung: Nicht CO2-neutral*. Geraadpleegd op 29 oktober 2026, van https://www.zdfheute.de/wirtschaft/unternehmen/apple-watch-werbung-greenwashing-klage-deutsche-umwelthilfe-100.html
42. Vinuesa, R., Azizpour, H., Leite, I., Balaam, M., Dignum, V., Domisch, S., Felländer, A., Langhans, S. D., Tegmark, M., & Fuso Nerini, F. (2020). The role of artificial intelligence in achieving the Sustainable Development Goals. *Nature Communications, 11*, Artikel 233. https://doi.org/10.1038/s41467-019-14108-y (geraadpleegd op 29 oktober 2026 via https://pmc.ncbi.nlm.nih.gov/articles/PMC6957485/)
43. United Nations. (z.d.). (a) *Goal 7*, (b) *Goal 8*, (c) *Goal 9*. Department of Economic and Social Affairs, Sustainable Development. Geraadpleegd op 29 oktober 2026, van https://sdgs.un.org/goals/goal7, https://sdgs.un.org/goals/goal8 en https://sdgs.un.org/goals/goal9

## Gerelateerd
- [[mapping-the-business]]
- [[ai-trends-toekomst]]
