# Bouwt app/opdrachtteam.html: zet het studieoverzicht in de pagina.
import json, pathlib
map = pathlib.Path(__file__).parent
data = json.loads((map / "overzicht.json").read_text())
html = (map / "opdrachtteam.src.html").read_text()
(map / "opdrachtteam.html").write_text(html.replace("/*OVERZICHT*/null", json.dumps(data, ensure_ascii=False).replace("</", "<\\/")))
print("Klaar: app/opdrachtteam.html")
