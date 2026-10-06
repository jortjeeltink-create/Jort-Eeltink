// Dia-indeling voor PowerPoints van Jort. Eén indeling, drie uitvoeren:
//   maakIndeling(spec, info)        -> { slides, waarschuwingen }  (meet ook of tekst past)
//   indelingNaarPptx(ind, PptxGenJS) -> pptxgenjs-presentatie
//   indelingNaarHtml(ind)           -> HTML-preview per dia (zelfde posities en lettergroottes)
// Gebruikt door tools/maak-deck.js (Node) en door de Opdrachtteam-app (browser).
//
// spec: { titel, thema, taal: "nl" | "en", slides: [...] }   info: { vak, week, auteur }
// Slidetypes: titel, punten, kaarten, tijdlijn, matrix, getal, stelling, afbeelding, bronnen, afsluiting.

var DECK_THEMAS = {
  digitaal: { donker: "141B34", licht: "FFFFFF", zacht: "EEF1FB", accent: "6C5CE7", accent2: "00B894", tekst: "1E2433", grijs: "5B6275" },
  zakelijk: { donker: "1E2761", licht: "FFFFFF", zacht: "EEF2FA", accent: "F2A541", accent2: "3E7CB1", tekst: "1E2433", grijs: "5B6275" },
  groen: { donker: "1F3B2D", licht: "FFFFFF", zacht: "EEF5EF", accent: "97BC62", accent2: "E07A5F", tekst: "1F2A24", grijs: "56645B" },
  energiek: { donker: "2F3C7E", licht: "FFFFFF", zacht: "FFF1F1", accent: "F96167", accent2: "F2C14E", tekst: "222222", grijs: "5E5E6E" },
};
var DECK_LABELS = {
  nl: { kern: "Kern", bronnen: "Bronnen", foto: "Foto invoegen", week: "week", vragen: "Vragen?", dia: "Dia" },
  en: { kern: "Key point", bronnen: "References", foto: "Insert photo", week: "week", vragen: "Questions?", dia: "Slide" },
};
var DECK_FONT = { kop: "Cambria", body: "Calibri" };

function maakIndeling(spec, info) {
  info = info || {};
  var K = DECK_THEMAS[spec.thema] || DECK_THEMAS.digitaal;
  var L = DECK_LABELS[spec.taal] || DECK_LABELS.nl;
  var waarschuwingen = [];
  var str = function (v) { return v == null ? "" : String(v) };

  // Schat hoeveel ruimte tekst nodig heeft (Calibri ~0,5 em per teken, Cambria ~0,56 em)
  function nodig(it, size) {
    var em = (it.face === "kop" ? 0.62 : 0.5) * (it.bold ? (it.face === "kop" ? 1.12 : 1.06) : 1);
    var paras = it.runs ? it.runs : [{ t: str(it.tekst) }];
    var regels = 0, extra = 0;
    paras.forEach(function (p) {
      var breed = it.w - (p.bullet ? 0.3 : 0);
      var perRegel = Math.max(4, Math.floor(breed * 72 / (size * em)));
      str(p.t).split("\n").forEach(function (r) {
        var woorden = r.split(/\s+/), n = 1, lijn = 0;
        woorden.forEach(function (w) { var l = w.length + (lijn ? 1 : 0); if (lijn + l > perRegel && lijn) { n++; lijn = w.length } else lijn += l });
        regels += n;
      });
      extra += (it.ruimte || 0);
    });
    return regels * size * 1.2 / 72 + extra / 72;
  }
  // Maak de letter kleiner tot het past; lukt dat niet, dan een waarschuwing
  function pas(it, dia, wat) {
    if (it.rotate) return it;
    var min = it.min || 12;
    while (nodig(it, it.size) > it.h && it.size > min) it.size -= 1;
    if (nodig(it, it.size) > it.h * 1.02) waarschuwingen.push({ dia: dia, tekst: wat + " past niet, ook niet op " + it.size + " pt. Maak de tekst korter." });
    return it;
  }

  var slides = (spec.slides || []).map(function (d, i) {
    var nr = i + 1, items = [], donker = ["titel", "stelling", "afsluiting"].indexOf(d.type) >= 0;
    var T = function (o) { o.k = "text"; o.size = o.size || 16; items.push(pas(o, nr, o.wat || "Tekst")); return o };
    var R = function (x, y, w, h, kleur, rond) { items.push({ k: "rect", x: x, y: y, w: w, h: h, kleur: kleur || K.zacht, rond: rond !== false }) };
    var O = function (x, y, d2, kleur, transp) { items.push({ k: "oval", x: x, y: y, w: d2, h: d2, kleur: kleur, transp: transp || 0 }) };
    var titel = function (t) { T({ x: 0.5, y: 0.35, w: 9, h: 0.8, tekst: str(t), size: 28, min: 20, bold: true, face: "kop", kleur: K.donker, valign: "middle", wat: "De titel" }) };
    var lijst = function (arr) { return (arr || []).map(function (t) { return { t: str(t), bullet: true } }) };
    var zelfde = function (n) { return n <= 3 ? n : n === 4 ? 2 : 3 };

    switch (d.type) {
      case "titel":
        T({ x: 0.5, y: 1.5, w: 9, h: 1.5, tekst: str(d.titel), size: 40, min: 26, bold: true, face: "kop", kleur: K.licht, valign: "bottom", wat: "De titel" });
        if (d.ondertitel) T({ x: 0.5, y: 3.15, w: 9, h: 0.9, tekst: str(d.ondertitel), size: 18, min: 14, kleur: K.zacht, wat: "De ondertitel" });
        T({ x: 0.5, y: 4.6, w: 9, h: 0.4, tekst: info.auteur || "Jort Eeltink", size: 14, kleur: K.zacht });
        break;
      case "punten":
        titel(d.titel);
        var b = d.kern ? 5.4 : 9;
        T({ x: 0.5, y: 1.35, w: b, h: 3.6, runs: lijst(d.punten), ruimte: 8, size: 18, min: 13, valign: "top", wat: "De opsomming" });
        if (d.kern) {
          R(6.2, 1.35, 3.3, 3.5, K.donker);
          T({ x: 6.5, y: 1.65, w: 2.7, h: 2.9, tekst: str(d.kern), size: 22, min: 14, bold: true, face: "kop", kleur: K.licht, valign: "middle", wat: "De kern" });
        }
        break;
      case "kaarten":
        titel(d.titel);
        var ks = (d.kaarten || []).slice(0, 6), n = ks.length || 1, kol = zelfde(n), rij = Math.ceil(n / kol), g = 0.3;
        var w = (9 - g * (kol - 1)) / kol, h = (3.6 - g * (rij - 1)) / rij;
        if ((d.kaarten || []).length > 6) waarschuwingen.push({ dia: nr, tekst: "Meer dan 6 kaarten; alleen de eerste 6 staan erop." });
        ks.forEach(function (k, j) {
          var x = 0.5 + (j % kol) * (w + g), y = 1.35 + Math.floor(j / kol) * (h + g);
          R(x, y, w, h);
          T({ x: x + 0.25, y: y + 0.2, w: w - 0.5, h: 0.45, tekst: str(k.kop), size: 16, min: 11, bold: true, kleur: j % 2 ? K.accent2 : K.accent, valign: "middle", wat: "Kop van kaart " + (j + 1) });
          T({ x: x + 0.25, y: y + 0.75, w: w - 0.5, h: h - 0.9, tekst: str(k.tekst), size: rij > 1 ? 13 : 15, min: 11, valign: "top", wat: "Tekst van kaart " + (j + 1) });
        });
        break;
      case "tijdlijn":
        titel(d.titel);
        var st = (d.stappen || []).slice(0, 6), m = st.length || 1, sw = 9 / m, yl = 2.75;
        items.push({ k: "line", x: 0.5 + sw / 2, y: yl, w: 9 - sw, kleur: K.grijs });
        st.forEach(function (p, j) {
          var cx = 0.5 + j * sw + sw / 2;
          T({ x: cx - sw / 2, y: 1.85, w: sw, h: 0.5, tekst: str(p.jaar), size: 20, min: 12, bold: true, face: "kop", kleur: K.accent, align: "center", wat: "Jaartal " + (j + 1) });
          O(cx - 0.13, yl - 0.13, 0.26, j % 2 ? K.accent2 : K.accent);
          T({ x: cx - sw / 2 + 0.08, y: 3.1, w: sw - 0.16, h: 1.9, tekst: str(p.tekst), size: 14, min: 11, align: "center", valign: "top", wat: "Stap " + (j + 1) });
        });
        break;
      case "matrix":
        titel(d.titel);
        var as = Array.isArray(d.assen) && d.assen.length === 2, x0 = as ? 0.9 : 0.5, y0 = 1.3, W = 9.5 - x0, H = 3.65, gg = 0.2;
        var mw = (W - gg) / 2, mh = (H - gg) / 2;
        (d.vakken || []).slice(0, 4).forEach(function (v, j) {
          var x = x0 + (j % 2) * (mw + gg), y = y0 + Math.floor(j / 2) * (mh + gg);
          R(x, y, mw, mh);
          T({ x: x + 0.2, y: y + 0.12, w: mw - 0.4, h: 0.35, tekst: str(v.kop), size: 14, min: 11, bold: true, kleur: j % 2 ? K.accent2 : K.accent, wat: "Kop van vak " + (j + 1) });
          T({ x: x + 0.2, y: y + 0.5, w: mw - 0.4, h: mh - 0.6, runs: lijst(v.punten), ruimte: 3, size: 13, min: 10, valign: "top", wat: "Tekst in vak " + (j + 1) });
        });
        if (as) {
          T({ x: x0, y: 5.0, w: W, h: 0.22, tekst: str(d.assen[0]) + " →", size: 10, kleur: K.grijs, align: "center" });
          T({ x: -0.75, y: y0 + H / 2 - 0.15, w: 2.2, h: 0.3, tekst: str(d.assen[1]) + " →", size: 10, kleur: K.grijs, align: "center", rotate: 270 });
        }
        break;
      case "getal":
        titel(d.titel);
        R(0.5, 1.35, 4.2, 3.5, K.donker);
        T({ x: 0.7, y: 1.6, w: 3.8, h: 1.7, tekst: str(d.getal), size: 60, min: 28, bold: true, face: "kop", kleur: K.accent2, align: "center", valign: "middle", wat: "Het getal" });
        T({ x: 0.7, y: 3.35, w: 3.8, h: 1.25, tekst: str(d.label), size: 16, min: 12, kleur: K.licht, align: "center", valign: "top", wat: "Het label bij het getal" });
        T({ x: 5.1, y: 1.35, w: 4.4, h: d.bron ? 3.0 : 3.5, tekst: str(d.tekst), size: 18, min: 13, valign: "top", wat: "De tekst" });
        if (d.bron) T({ x: 5.1, y: 4.45, w: 4.4, h: 0.45, tekst: str(d.bron), size: 10, min: 8, kleur: K.grijs, italic: true, wat: "De bron" });
        break;
      case "stelling":
        T({ x: 0.9, y: 1.4, w: 8.2, h: 2.6, tekst: str(d.tekst || d.titel), size: 30, min: 20, bold: true, face: "kop", kleur: K.licht, valign: "middle", wat: "De stelling" });
        if (d.door) T({ x: 0.9, y: 4.2, w: 8.2, h: 0.45, tekst: str(d.door), size: 14, min: 11, kleur: K.accent2 });
        break;
      case "afbeelding":
        titel(d.titel);
        var aw = d.tekst ? 5.6 : 9;
        R(0.5, 1.3, aw, 3.7);
        T({ x: 0.8, y: 1.3, w: aw - 0.6, h: 3.7, tekst: "[" + L.foto + ": " + str(d.afbeelding || "") + "]", size: 14, min: 11, kleur: K.grijs, align: "center", valign: "middle" });
        if (d.tekst) T({ x: 6.4, y: 1.3, w: 3.1, h: 3.7, tekst: str(d.tekst), size: 16, min: 12, valign: "top", wat: "De tekst naast de foto" });
        break;
      case "bronnen":
        titel(d.titel || L.bronnen);
        T({ x: 0.5, y: 1.3, w: 9, h: 3.7, runs: (d.bronnen || []).map(function (t) { return { t: str(t) } }), ruimte: 6, size: 12, min: 9, valign: "top", wat: "De bronnenlijst" });
        break;
      case "afsluiting":
        T({ x: 0.5, y: 1.5, w: 9, h: 1.5, tekst: str(d.titel || L.vragen), size: 40, min: 26, bold: true, face: "kop", kleur: K.licht, valign: "bottom", wat: "De titel" });
        if (d.punten) T({ x: 0.5, y: 3.2, w: 9, h: 1.8, runs: lijst(d.punten), ruimte: 8, size: 18, min: 13, kleur: K.zacht, valign: "top", wat: "De punten" });
        break;
      default:
        waarschuwingen.push({ dia: nr, tekst: "Onbekend type \"" + d.type + "\"; als opsomming getoond." });
        titel(d.titel);
        T({ x: 0.5, y: 1.35, w: 9, h: 3.6, runs: lijst(d.punten || [d.tekst]), ruimte: 8, size: 18, min: 13, valign: "top", wat: "De tekst" });
    }
    if (d.punten && d.punten.length > 5) waarschuwingen.push({ dia: nr, tekst: d.punten.length + " punten; maximaal 5 leest prettig." });
    var meta = /\b(opdracht|assignment|week \d|lesweek|docent|teacher|kern:|key point|key takeaways?|vraag aan de klas|question for the class)\b/i;
    var zichtbaar = [d.titel, d.ondertitel, d.kern, d.tekst, d.door, d.label].concat(d.punten || [], (d.kaarten || []).map(function (k) { return k.kop + " " + k.tekst })).filter(Boolean).join(" ");
    if (meta.test(zichtbaar)) waarschuwingen.push({ dia: nr, tekst: "Er staat tekst op die een student niet zelf zou zetten (\"" + zichtbaar.match(meta)[0] + "\"). Haal die weg." });
    if (!str(d.notities).trim() && ["bronnen", "afsluiting"].indexOf(d.type) < 0) waarschuwingen.push({ dia: nr, tekst: "Geen spreektekst in de notities." });
    return { type: d.type, donker: donker, items: items, notities: str(d.notities) };
  });

  var types = (spec.slides || []).map(function (d) { return d.type });
  for (var i = 2; i < types.length; i++) if (types[i] === types[i - 1] && types[i] === types[i - 2]) waarschuwingen.push({ dia: i + 1, tekst: "Drie dia's achter elkaar van type \"" + types[i] + "\"; wissel af voor een mooier geheel." });
  if (types[0] !== "titel") waarschuwingen.push({ dia: 1, tekst: "De eerste dia is geen titeldia." });
  return { K: K, titel: spec.titel || "", taal: spec.taal || "nl", slides: slides, waarschuwingen: waarschuwingen };
}

// opties.notities: true zet de spreektekst in de sprekersnotities (standaard uit: die kan een docent zien)
function indelingNaarPptx(ind, PptxGenJS, info, opties) {
  info = info || {}; opties = opties || {};
  var K = ind.K, pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = ind.titel; pres.subject = ind.titel; pres.author = info.auteur || "Jort Eeltink";
  pres.theme = { headFontFace: DECK_FONT.kop, bodyFontFace: DECK_FONT.body };
  ind.slides.forEach(function (s) {
    var slide = pres.addSlide();
    slide.background = { color: s.donker ? K.donker : K.licht };
    s.items.forEach(function (it) {
      if (it.k === "rect") slide.addShape(it.rond ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE, { x: it.x, y: it.y, w: it.w, h: it.h, fill: { color: it.kleur }, line: { color: it.kleur }, rectRadius: it.rond ? 0.12 : undefined });
      else if (it.k === "oval") slide.addShape(pres.shapes.OVAL, { x: it.x, y: it.y, w: it.w, h: it.h, fill: { color: it.kleur, transparency: it.transp }, line: { color: it.kleur, transparency: it.transp } });
      else if (it.k === "line") slide.addShape(pres.shapes.LINE, { x: it.x, y: it.y, w: it.w, h: 0, line: { color: it.kleur, width: 2 } });
      else if (it.k === "text") {
        var opt = { x: it.x, y: it.y, w: it.w, h: it.h, isTextBox: true, margin: 0, fontFace: it.face === "kop" ? DECK_FONT.kop : DECK_FONT.body, fontSize: it.size, bold: !!it.bold, italic: !!it.italic, color: it.kleur || K.tekst, align: it.align || "left", valign: it.valign || "top" };
        if (it.rotate) opt.rotate = it.rotate;
        var inhoud = it.runs ? it.runs.map(function (r, j, a) { return { text: r.t, options: { bullet: r.bullet ? { indent: 18 } : false, breakLine: j < a.length - 1, paraSpaceAfter: it.ruimte || 0 } } }) : it.tekst;
        slide.addText(inhoud, opt);
      }
    });
    if (opties.notities && s.notities) slide.addNotes(s.notities);
  });
  return pres;
}

function indelingNaarHtml(ind) {
  var K = ind.K, pct = function (v, of) { return (v / of * 100).toFixed(3) + "%" };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] }) };
  return ind.slides.map(function (s) {
    var html = s.items.map(function (it) {
      var pos = "left:" + pct(it.x, 10) + ";top:" + pct(it.y, 5.625) + ";width:" + pct(it.w, 10) + ";height:" + pct(it.h || 0.001, 5.625) + ";";
      if (it.k === "rect") return '<div style="position:absolute;' + pos + "background:#" + it.kleur + ";border-radius:" + (it.rond ? "1.2cqw" : "0") + '"></div>';
      if (it.k === "oval") return '<div style="position:absolute;' + pos + "background:#" + it.kleur + ";opacity:" + (1 - it.transp / 100) + ';border-radius:50%"></div>';
      if (it.k === "line") return '<div style="position:absolute;' + pos + "height:0;border-top:0.2cqw solid #" + it.kleur + '"></div>';
      var stijl = pos + "font-size:" + (it.size / 72 / 10 * 100).toFixed(3) + "cqw;line-height:1.2;color:#" + (it.kleur || K.tekst) + ";font-family:" + (it.face === "kop" ? "Cambria,Georgia,serif" : "Calibri,Carlito,Arial,sans-serif") +
        ";font-weight:" + (it.bold ? 700 : 400) + ";font-style:" + (it.italic ? "italic" : "normal") + ";text-align:" + (it.align || "left") + ";display:flex;flex-direction:column;justify-content:" + ({ top: "flex-start", middle: "center", bottom: "flex-end" }[it.valign || "top"]) +
        (it.rotate ? ";transform:rotate(" + it.rotate + "deg)" : "") + ";overflow:visible;white-space:pre-wrap;overflow-wrap:break-word";
      var inhoud = it.runs ? it.runs.map(function (r) { return '<div style="margin-bottom:' + ((it.ruimte || 0) / 72 / 10 * 100).toFixed(3) + "cqw;" + (r.bullet ? "padding-left:1.4em;text-indent:-0.8em" : "") + '">' + (r.bullet ? "•&nbsp;&nbsp;" : "") + esc(r.t) + "</div>" }).join("") : "<div>" + esc(it.tekst) + "</div>";
      return '<div style="position:absolute;' + stijl + '">' + inhoud + "</div>";
    }).join("");
    return '<div class="dia-render" style="position:relative;aspect-ratio:16/9;container-type:inline-size;overflow:hidden;background:#' + (s.donker ? K.donker : K.licht) + '">' + html + "</div>";
  });
}

if (typeof module !== "undefined") module.exports = { maakIndeling: maakIndeling, indelingNaarPptx: indelingNaarPptx, indelingNaarHtml: indelingNaarHtml, DECK_THEMAS: DECK_THEMAS };
