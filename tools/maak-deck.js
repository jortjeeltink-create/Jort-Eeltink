// Maakt een PowerPoint uit een JSON-bestand.
// Gebruik: node tools/maak-deck.js werk/mabu/week-02-pestel/slides.json
// De .pptx komt naast het JSON-bestand te staan (naam: "bestand" uit de JSON, of presentatie.pptx).
//
// Slidetypes (veld "type"):
//   titel      { titel, ondertitel }
//   punten     { titel, punten: [..], kern? }             opsomming links, kernboodschap rechts
//   kaarten    { titel, kaarten: [{ kop, tekst }] }       2 t/m 6 kaarten in een raster
//   tijdlijn   { titel, stappen: [{ jaar, tekst }] }      3 t/m 6 stappen
//   matrix     { titel, assen?: [x, y], vakken: [{ kop, punten }] x4 }   SWOT, Power-Interest
//   getal      { titel, getal, label, tekst, bron? }      groot cijfer
//   stelling   { tekst, door? }                           grote uitspraak of vraag
//   afbeelding { titel, afbeelding, tekst? }              pad relatief aan het JSON-bestand
//   bronnen    { bronnen: [..] }                          APA-lijst
//   afsluiting { titel, punten? }
// Elke slide mag "notities" hebben: de spreektekst. Die komt in de sprekersnotities.

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const THEMAS = {
  digitaal: { donker: "141B34", licht: "FFFFFF", zacht: "EEF1FB", accent: "6C5CE7", accent2: "00B894", tekst: "1E2433", grijs: "5B6275" },
  zakelijk: { donker: "1E2761", licht: "FFFFFF", zacht: "EEF2FA", accent: "F2A541", accent2: "3E7CB1", tekst: "1E2433", grijs: "5B6275" },
  groen:    { donker: "1F3B2D", licht: "FFFFFF", zacht: "EEF5EF", accent: "97BC62", accent2: "E07A5F", tekst: "1F2A24", grijs: "56645B" },
  energiek: { donker: "2F3C7E", licht: "FFFFFF", zacht: "FFF1F1", accent: "F96167", accent2: "F2C14E", tekst: "222222", grijs: "5E5E6E" },
};

const bestand = process.argv[2];
if (!bestand) {
  console.error("Gebruik: node tools/maak-deck.js pad/naar/slides.json");
  process.exit(1);
}
const map = path.dirname(bestand);
const spec = JSON.parse(fs.readFileSync(bestand, "utf8"));
const K = THEMAS[spec.thema] || THEMAS.digitaal;
const KOP = "Cambria";
const BODY = "Calibri";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 inch
pres.title = spec.titel || "Presentatie";
pres.author = spec.auteur || "Jort Eeltink";
pres.theme = { headFontFace: KOP, bodyFontFace: BODY };

const voet = spec.voettekst || "";
const voetObjecten = (kleur) => [
  { text: { text: voet, options: { x: 0.5, y: 5.2, w: 7, h: 0.3, fontSize: 10, color: kleur, fontFace: BODY, margin: 0 } } },
];

pres.defineSlideMaster({
  title: "DONKER",
  background: { color: K.donker },
  objects: [
    { placeholder: { options: { name: "titel", type: "title", x: 0.5, y: 1.7, w: 9, h: 1.3, fontFace: KOP, fontSize: 40, bold: true, color: K.licht, valign: "bottom", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "LICHT",
  background: { color: K.licht },
  objects: [
    { placeholder: { options: { name: "titel", type: "title", x: 0.5, y: 0.35, w: 9, h: 0.8, fontFace: KOP, fontSize: 30, bold: true, color: K.donker, valign: "middle", align: "left", margin: 0 }, text: "" } },
    ...voetObjecten(K.grijs),
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: K.grijs, fontFace: BODY },
});

const tb = (extra) => Object.assign({ isTextBox: true, fontFace: BODY, color: K.tekst, margin: 0 }, extra);
const lijst = (items, extra = {}) =>
  items.map((t, i) => ({ text: t, options: Object.assign({ bullet: { indent: 18 }, breakLine: i < items.length - 1, paraSpaceAfter: 8 }, extra) }));
const kaart = (slide, x, y, w, h, kleur = K.zacht) =>
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: kleur }, rectRadius: 0.12, line: { color: kleur } });
const bolletje = (slide, x, y, d, tekst, kleur = K.accent) => {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: kleur }, line: { color: kleur } });
  slide.addText(String(tekst), tb({ x, y, w: d, h: d, align: "center", valign: "middle", fontSize: Math.round(d * 28), bold: true, color: K.licht }));
};

const makers = {
  titel(s, d) {
    const slide = pres.addSlide({ masterName: "DONKER" });
    slide.addText(d.titel, { placeholder: "titel" });
    if (d.ondertitel) slide.addText(d.ondertitel, tb({ x: 0.5, y: 3.15, w: 9, h: 0.6, fontSize: 18, color: K.zacht }));
    bolletje(slide, 0.5, 0.6, 0.6, "", K.accent);
    slide.addShape(pres.shapes.OVAL, { x: 0.95, y: 0.6, w: 0.6, h: 0.6, fill: { color: K.accent2, transparency: 20 }, line: { color: K.accent2, transparency: 20 } });
    slide.addText([spec.auteur || "Jort Eeltink", spec.vak ? `  ·  ${spec.vak}` : ""].join(""), tb({ x: 0.5, y: 4.7, w: 9, h: 0.4, fontSize: 12, color: K.zacht }));
    return slide;
  },
  punten(s, d) {
    const slide = pres.addSlide({ masterName: "LICHT" });
    slide.addText(d.titel, { placeholder: "titel" });
    const breed = d.kern ? 5.4 : 9;
    slide.addText(lijst(d.punten), tb({ x: 0.5, y: 1.35, w: breed, h: 3.6, fontSize: 16, valign: "top" }));
    if (d.kern) {
      kaart(slide, 6.2, 1.35, 3.3, 3.5, K.donker);
      slide.addText("Kern", tb({ x: 6.5, y: 1.6, w: 2.7, h: 0.4, fontSize: 12, bold: true, color: K.accent2 }));
      slide.addText(d.kern, tb({ x: 6.5, y: 2.05, w: 2.7, h: 2.6, fontSize: 18, bold: true, color: K.licht, valign: "top", fontFace: KOP }));
    }
    return slide;
  },
  kaarten(s, d) {
    const slide = pres.addSlide({ masterName: "LICHT" });
    slide.addText(d.titel, { placeholder: "titel" });
    const n = d.kaarten.length;
    const kol = n <= 3 ? n : n === 4 ? 2 : 3;
    const rij = Math.ceil(n / kol);
    const gap = 0.3, x0 = 0.5, y0 = 1.35, W = 9, H = 3.6;
    const w = (W - gap * (kol - 1)) / kol, h = (H - gap * (rij - 1)) / rij;
    d.kaarten.forEach((k, i) => {
      const x = x0 + (i % kol) * (w + gap), y = y0 + Math.floor(i / kol) * (h + gap);
      kaart(slide, x, y, w, h);
      bolletje(slide, x + 0.2, y + 0.2, 0.42, k.letter || i + 1, i % 2 ? K.accent2 : K.accent);
      slide.addText(k.kop, tb({ x: x + 0.75, y: y + 0.2, w: w - 0.95, h: 0.42, fontSize: 15, bold: true, color: K.donker, valign: "middle" }));
      slide.addText(k.tekst, tb({ x: x + 0.2, y: y + 0.75, w: w - 0.4, h: h - 0.9, fontSize: rij > 1 ? 12 : 14, valign: "top" }));
    });
    return slide;
  },
  tijdlijn(s, d) {
    const slide = pres.addSlide({ masterName: "LICHT" });
    slide.addText(d.titel, { placeholder: "titel" });
    const n = d.stappen.length, x0 = 0.5, W = 9, w = W / n, ylijn = 2.75;
    slide.addShape(pres.shapes.LINE, { x: x0 + w / 2, y: ylijn, w: W - w, h: 0, line: { color: K.grijs, width: 2 } });
    d.stappen.forEach((st, i) => {
      const cx = x0 + i * w + w / 2;
      slide.addText(st.jaar, tb({ x: cx - w / 2, y: 1.85, w, h: 0.5, fontSize: 20, bold: true, color: K.accent, align: "center", fontFace: KOP }));
      slide.addShape(pres.shapes.OVAL, { x: cx - 0.13, y: ylijn - 0.13, w: 0.26, h: 0.26, fill: { color: i % 2 ? K.accent2 : K.accent }, line: { color: K.licht, width: 2 } });
      slide.addText(st.tekst, tb({ x: cx - w / 2 + 0.08, y: 3.1, w: w - 0.16, h: 1.9, fontSize: 13, align: "center", valign: "top" }));
    });
    return slide;
  },
  matrix(s, d) {
    const slide = pres.addSlide({ masterName: "LICHT" });
    slide.addText(d.titel, { placeholder: "titel" });
    const as = !!d.assen, x0 = as ? 0.9 : 0.5, y0 = 1.3, W = 9.5 - x0, H = 3.7, gap = 0.2;
    const w = (W - gap) / 2, h = (H - gap) / 2;
    const kleuren = [K.zacht, K.zacht, K.zacht, K.zacht];
    d.vakken.forEach((v, i) => {
      const x = x0 + (i % 2) * (w + gap), y = y0 + Math.floor(i / 2) * (h + gap);
      kaart(slide, x, y, w, h, kleuren[i]);
      slide.addText(v.kop, tb({ x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.35, fontSize: 14, bold: true, color: i % 2 ? K.accent2 : K.accent }));
      slide.addText(lijst(v.punten, { paraSpaceAfter: 3 }), tb({ x: x + 0.2, y: y + 0.5, w: w - 0.4, h: h - 0.6, fontSize: 12, valign: "top" }));
    });
    if (as) {
      slide.addText(`${d.assen[0]} →`, tb({ x: x0, y: 5.02, w: W, h: 0.2, fontSize: 10, color: K.grijs, align: "center" }));
      slide.addText(`${d.assen[1]} →`, tb({ x: -0.75, y: y0 + H / 2 - 0.15, w: 2.2, h: 0.3, fontSize: 10, color: K.grijs, rotate: 270, align: "center" }));
    }
    return slide;
  },
  getal(s, d) {
    const slide = pres.addSlide({ masterName: "LICHT" });
    slide.addText(d.titel, { placeholder: "titel" });
    kaart(slide, 0.5, 1.35, 4.2, 3.5, K.donker);
    const grootte = String(d.getal).length <= 4 ? 60 : String(d.getal).length <= 7 ? 44 : 32;
    slide.addText(d.getal, tb({ x: 0.7, y: 1.7, w: 3.8, h: 1.6, fontSize: grootte, bold: true, color: K.accent2, align: "center", valign: "middle", fontFace: KOP }));
    slide.addText(d.label, tb({ x: 0.7, y: 3.35, w: 3.8, h: 1.1, fontSize: 15, color: K.licht, align: "center", valign: "top" }));
    slide.addText(d.tekst, tb({ x: 5.1, y: 1.35, w: 4.4, h: 3.1, fontSize: 16, valign: "top" }));
    if (d.bron) slide.addText(d.bron, tb({ x: 5.1, y: 4.5, w: 4.4, h: 0.4, fontSize: 10, color: K.grijs, italic: true }));
    return slide;
  },
  stelling(s, d) {
    const slide = pres.addSlide({ masterName: "DONKER" });
    slide.addText("“", tb({ x: 0.5, y: 0.4, w: 1.5, h: 1.3, fontSize: 96, color: K.accent, fontFace: KOP }));
    slide.addText(d.tekst, tb({ x: 0.9, y: 1.4, w: 8.2, h: 2.6, fontSize: 28, bold: true, color: K.licht, fontFace: KOP, valign: "middle" }));
    if (d.door) slide.addText(d.door, tb({ x: 0.9, y: 4.2, w: 8.2, h: 0.4, fontSize: 14, color: K.accent2 }));
    return slide;
  },
  afbeelding(s, d) {
    const slide = pres.addSlide({ masterName: "LICHT" });
    slide.addText(d.titel, { placeholder: "titel" });
    const pad = path.resolve(map, d.afbeelding);
    const breed = d.tekst ? 5.6 : 9;
    if (fs.existsSync(pad)) slide.addImage({ path: pad, x: 0.5, y: 1.3, w: breed, h: 3.7, sizing: { type: "contain", w: breed, h: 3.7 } });
    else {
      kaart(slide, 0.5, 1.3, breed, 3.7);
      slide.addText(`[Afbeelding: ${d.afbeelding}]`, tb({ x: 0.5, y: 1.3, w: breed, h: 3.7, fontSize: 14, color: K.grijs, align: "center", valign: "middle" }));
    }
    if (d.tekst) slide.addText(d.tekst, tb({ x: 6.4, y: 1.3, w: 3.1, h: 3.7, fontSize: 15, valign: "top" }));
    return slide;
  },
  bronnen(s, d) {
    const slide = pres.addSlide({ masterName: "LICHT" });
    slide.addText(d.titel || "Bronnen", { placeholder: "titel" });
    slide.addText(d.bronnen.map((b, i) => ({ text: b, options: { breakLine: i < d.bronnen.length - 1, paraSpaceAfter: 6, indentLevel: 0 } })),
      tb({ x: 0.5, y: 1.3, w: 9, h: 3.7, fontSize: 11, valign: "top", fit: "shrink" }));
    return slide;
  },
  afsluiting(s, d) {
    const slide = pres.addSlide({ masterName: "DONKER" });
    slide.addText(d.titel, { placeholder: "titel" });
    if (d.punten) slide.addText(lijst(d.punten), tb({ x: 0.5, y: 3.2, w: 9, h: 1.8, fontSize: 16, color: K.zacht, valign: "top" }));
    return slide;
  },
};

spec.slides.forEach((d, i) => {
  const maker = makers[d.type];
  if (!maker) throw new Error(`Slide ${i + 1}: onbekend type "${d.type}"`);
  const slide = maker(spec, d);
  if (d.notities) slide.addNotes(d.notities);
});

const uit = path.join(map, spec.bestand || "presentatie.pptx");
pres.writeFile({ fileName: uit }).then(() => console.log(`Klaar: ${uit}`));
