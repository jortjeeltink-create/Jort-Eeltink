// Maakt een PowerPoint uit een JSON-bestand en controleert of alle tekst past.
// Gebruik: node tools/maak-deck.js werk/mabu/week-02-pestel/slides.json
// De .pptx komt naast het JSON-bestand (naam: "bestand" uit de JSON, of presentatie.pptx).
//
// JSON: { "titel", "thema": "digitaal|zakelijk|groen|energiek", "taal": "nl|en", "vak", "week", "slides": [...] }
// Slidetypes en velden: zie tools/deck-layout.js. Elke slide heeft "notities" met de spreektekst.
// Waarschuwingen (tekst die niet past, te veel punten, geen spreektekst) worden getoond; los ze op in de JSON.

const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const { maakIndeling, indelingNaarPptx } = require("./deck-layout");

const bestand = process.argv[2];
if (!bestand) {
  console.error("Gebruik: node tools/maak-deck.js pad/naar/slides.json");
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(bestand, "utf8"));
const info = { vak: spec.vak || "", week: spec.week || "", auteur: spec.auteur || "Jort Eeltink" };
const indeling = maakIndeling(spec, info);
const uit = path.join(path.dirname(bestand), spec.bestand || "presentatie.pptx");

indelingNaarPptx(indeling, PptxGenJS, info).writeFile({ fileName: uit }).then(() => {
  console.log(`Klaar: ${uit}`);
  if (indeling.waarschuwingen.length) {
    console.log(`\n${indeling.waarschuwingen.length} waarschuwing(en):`);
    indeling.waarschuwingen.forEach((w) => console.log(`  Dia ${w.dia}: ${w.tekst}`));
    process.exitCode = 2;
  } else console.log("Alle tekst past.");
});
