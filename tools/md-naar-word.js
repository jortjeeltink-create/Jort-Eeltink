// Zet Markdown om naar een Word-document (.docx).
// Werkt in Node (node tools/md-naar-word.js invoer.md uitvoer.docx [--voorblad "Titel|Vak|Week"])
// en in de browser (de app zet deze functie in de pagina; daar zijn `docx` en `marked` globals).
//
// Ondersteunt: kopjes, alinea's, vet/cursief, opsommingen (ook genummerd en - [ ] vinkjes),
// tabellen en citaten. [VUL IN: ...] en [BRON ZOEKEN: ...] worden geel gemarkeerd.

function mdNaarWord(md, opties, lib) {
  const D = lib.docx, M = lib.marked;
  const o = Object.assign({ kleur: "4B3BC4", auteur: "Jort Eeltink" }, opties || {});
  const FONT = "Calibri";

  // Tekst met **vet**, *cursief* en [VUL IN]-plekken omzetten naar TextRuns
  function runs(tokens, stijl = {}) {
    const uit = [];
    for (const t of tokens || []) {
      if (t.type === "strong") uit.push(...runs(t.tokens, Object.assign({}, stijl, { bold: true })));
      else if (t.type === "em") uit.push(...runs(t.tokens, Object.assign({}, stijl, { italics: true })));
      else if (t.type === "codespan") uit.push(new D.TextRun(Object.assign({ text: ontsnap(t.text), font: "Consolas" }, stijl)));
      else if (t.type === "link") uit.push(...runs(t.tokens, Object.assign({}, stijl, { color: o.kleur, underline: {} })));
      else if (t.type === "br") uit.push(new D.TextRun({ text: "", break: 1 }));
      else if (t.tokens) uit.push(...runs(t.tokens, stijl));
      else uit.push(...markeer(ontsnap(t.text != null ? t.text : t.raw || ""), stijl));
    }
    return uit;
  }
  function ontsnap(s) {
    return String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }
  function markeer(tekst, stijl) {
    return tekst.split(/(\[(?:VUL IN|BRON ZOEKEN):[^\]]*\])/).filter(Boolean).map((deel) =>
      /^\[(VUL IN|BRON ZOEKEN):/.test(deel)
        ? new D.TextRun(Object.assign({ text: deel, highlight: "yellow", bold: true }, stijl))
        : new D.TextRun(Object.assign({ text: deel }, stijl)));
  }

  const KOP = [D.HeadingLevel.TITLE, D.HeadingLevel.HEADING_1, D.HeadingLevel.HEADING_2, D.HeadingLevel.HEADING_3, D.HeadingLevel.HEADING_4];
  const blokken = [];
  function lijst(t, niveau) {
    t.items.forEach((item) => {
      const binnen = item.tokens || [];
      const tekstTokens = binnen.filter((x) => x.type === "text" || x.type === "paragraph");
      const r = [];
      if (item.task) r.push(new D.TextRun({ text: item.checked ? "☑ " : "☐ " }));
      tekstTokens.forEach((x, i) => { if (i) r.push(new D.TextRun({ text: "", break: 1 })); r.push(...runs(x.tokens || [{ type: "text", text: x.text }])) });
      blokken.push(new D.Paragraph(item.task
        ? { children: r, indent: { left: 360 * (niveau + 1) }, spacing: { after: 80 } }
        : t.ordered
          ? { children: r, numbering: { reference: "nummers", level: niveau }, spacing: { after: 80 } }
          : { children: r, bullet: { level: niveau }, spacing: { after: 80 } }));
      binnen.filter((x) => x.type === "list").forEach((sub) => lijst(sub, Math.min(niveau + 1, 3)));
    });
  }
  function tabel(t) {
    const cel = (c, kop) => new D.TableCell({
      children: [new D.Paragraph({ children: runs(c.tokens, kop ? { bold: true, color: "FFFFFF" } : {}) })],
      shading: kop ? { fill: o.kleur, type: D.ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
    });
    blokken.push(new D.Table({
      width: { size: 100, type: D.WidthType.PERCENTAGE },
      rows: [new D.TableRow({ tableHeader: true, children: t.header.map((c) => cel(c, true)) }),
        ...t.rows.map((rij) => new D.TableRow({ children: rij.map((c) => cel(c, false)) }))],
    }));
    blokken.push(new D.Paragraph({ text: "" }));
  }

  for (const t of M.lexer(md || "")) {
    if (t.type === "heading") blokken.push(new D.Paragraph({ heading: KOP[Math.min(t.depth, 4)], children: runs(t.tokens) }));
    else if (t.type === "paragraph") blokken.push(new D.Paragraph({ children: runs(t.tokens), spacing: { after: 160 } }));
    else if (t.type === "list") lijst(t, 0);
    else if (t.type === "table") tabel(t);
    else if (t.type === "blockquote") blokken.push(new D.Paragraph({ children: runs((t.tokens[0] || {}).tokens, { italics: true }), indent: { left: 567 }, spacing: { after: 160 } }));
    else if (t.type === "hr") blokken.push(new D.Paragraph({ border: { bottom: { color: "BFBFBF", space: 1, style: D.BorderStyle.SINGLE, size: 6 } } }));
    else if (t.type === "code") t.text.split("\n").forEach((r) => blokken.push(new D.Paragraph({ children: [new D.TextRun({ text: r, font: "Consolas", size: 20 })] })));
  }

  const voorblad = o.voorblad ? [
    new D.Paragraph({ text: "", spacing: { before: 2800 } }),
    new D.Paragraph({ heading: D.HeadingLevel.TITLE, children: [new D.TextRun({ text: o.voorblad.titel })] }),
    new D.Paragraph({ children: [new D.TextRun({ text: o.voorblad.ondertitel || "", size: 28, color: "595959" })], spacing: { after: 2400 } }),
    ...[o.auteur, "Tio · Digital Business & Generative AI", o.voorblad.datum || new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })]
      .map((r) => new D.Paragraph({ children: [new D.TextRun({ text: r, size: 24 })], spacing: { after: 60 } })),
    new D.Paragraph({ children: [new D.PageBreak()] }),
  ] : [];

  const doc = new D.Document({
    creator: o.auteur,
    title: o.titel || (o.voorblad && o.voorblad.titel) || "Document",
    styles: {
      default: { document: { run: { font: FONT, size: 22 }, paragraph: { spacing: { line: 300 } } } },
      paragraphStyles: [
        { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { font: FONT, size: 56, bold: true, color: "141B34" }, paragraph: { spacing: { after: 200 } } },
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 32, bold: true, color: "141B34" }, paragraph: { spacing: { before: 360, after: 120 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 26, bold: true, color: o.kleur }, paragraph: { spacing: { before: 280, after: 100 } } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: 23, bold: true, color: "141B34" }, paragraph: { spacing: { before: 200, after: 80 } } },
      ],
    },
    numbering: { config: [{ reference: "nummers", levels: [0, 1, 2, 3].map((l) => ({ level: l, format: D.LevelFormat.DECIMAL, text: `%${l + 1}.`, alignment: D.AlignmentType.START, style: { paragraph: { indent: { left: 720 * (l + 1), hanging: 360 } } } })) }] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 } } },
      footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [new D.TextRun({ children: [D.PageNumber.CURRENT], size: 18, color: "7F7F7F" })] })] }) },
      children: [...voorblad, ...blokken],
    }],
  });
  return doc;
}

if (typeof module !== "undefined" && require.main === module) {
  const fs = require("fs");
  const [invoer, uitvoer, vlag, vb] = process.argv.slice(2);
  if (!invoer || !uitvoer) { console.error('Gebruik: node tools/md-naar-word.js invoer.md uitvoer.docx [--voorblad "Titel|Ondertitel"]'); process.exit(1) }
  const docx = require("docx"), { marked } = require("marked");
  const voorblad = vlag === "--voorblad" && vb ? { titel: vb.split("|")[0], ondertitel: vb.split("|")[1] || "" } : null;
  const doc = mdNaarWord(fs.readFileSync(invoer, "utf8"), { voorblad }, { docx, marked });
  docx.Packer.toBuffer(doc).then((b) => { fs.writeFileSync(uitvoer, b); console.log("Klaar: " + uitvoer) });
} else if (typeof module !== "undefined") {
  module.exports = mdNaarWord;
}
