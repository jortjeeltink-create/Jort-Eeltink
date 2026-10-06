# Party-engine: handleiding

Met deze engine maak je een game die vrienden **live samen spelen, ieder op een eigen apparaat**. Het werkt op telefoon, tablet en laptop. De engine regelt de lobby, de QR-code, de verbinding, de besturing, het aftellen, de bots en het eindscherm. Jij schrijft alleen de game.

Het voorbeeld om van te leren is [`games/botsbal/game.js`](../games/botsbal/game.js).

## Hoe het werkt

```
 Host (1 apparaat)                          Andere apparaten
 ┌───────────────────────────┐   stand     ┌────────────────────┐
 │ setup() → state           │ ──20×/s──▶ │ render(c, state)   │
 │ update(state, dt, inputs) │            │ onEvent(...)       │
 │ onAction(...)             │ ◀───────── │ besturing / send() │
 │ render(c, state)          │  besturing  └────────────────────┘
 └───────────────────────────┘
```

- **De host is de baas.** Alleen de host draait `setup`, `update`, `onAction` en `bot`. De host speelt zelf ook mee.
- **Iedereen tekent zelf.** Elk apparaat krijgt 20 keer per seconde de `state` en tekent die met `render`.
- **De `state` is een gewoon object** met alleen JSON-data: getallen, tekst, arrays en objecten. Geen functies, `Map`, `Set` of klassen. Getallen worden bij verzenden afgerond op 2 decimalen.
- **Houd de state klein**, liefst onder ±8 KB. Gebruik geen enorme arrays, en stuur geen dingen mee die elk apparaat zelf kan uitrekenen.

## Een game maken

Elke game heeft een eigen map `games/<naam>/` met:

- `index.html`: kopieer die van `games/botsbal/` en verander alleen `<title>`.
- `game.js`: de game zelf.

```js
import { startGame, rand, pick, dist } from '../../engine/party.js';

startGame({
  id: 'mijn-game',              // uniek, kleine letters en koppeltekens (= mapnaam)
  title: 'Mijn Game',
  emoji: '🐸',
  subtitle: 'Korte, grappige zin',
  howTo: ['Regel 1', 'Regel 2'],  // komt in het menu en de lobby
  minPlayers: 2,
  maxPlayers: 8,
  world: { w: 1600, h: 900 },   // de grootte van je spelwereld in "wereld-eenheden"
  background: '#1d1b3a',
  controls: { joystick: true, buttons: ['Spring'] },
  countdown: 3,                 // 3-2-1-GO! (0 = meteen beginnen)
  tickRate: 20,                 // updates per seconde naar de andere apparaten
  bots: true,                   // host mag bots toevoegen in de lobby

  setup(players, party) { return { /* begin-state */ }; },
  update(state, dt, inputs, party) { },
  onAction(state, playerId, action, party) { },
  onJoin(state, player, party) { },      // optioneel: meedoen tijdens een ronde
  onLeave(state, playerId, party) { },   // optioneel
  bot(state, playerId, party) { return { x: 0, y: 0, buttons: [false], action: null }; },
  init(party) { },
  render(c, state, party) { },
  onEvent(name, data, party) { },
});
```

## De functies

| Functie | Draait op | Wat doet het |
|---|---|---|
| `setup(players, party)` | host | Begin van elke ronde. `players` is `[{ id, name, emoji, color, bot }]`. Geeft de begin-`state` terug. |
| `update(state, dt, inputs, party)` | host, ±60×/s | Verandert `state` (direct aanpassen, niets teruggeven). `dt` = seconden sinds vorige keer. |
| `onAction(state, id, action, party)` | host | Een speler riep `party.send(action)` aan, bijv. een antwoord in een quiz. Controleer altijd of de actie mag. |
| `onJoin` / `onLeave` | host | Iemand komt erbij of gaat weg tijdens een ronde. Zonder `onJoin` kijkt een nieuwe speler mee tot de volgende ronde. |
| `bot(state, id, party)` | host (bots), en elk apparaat met `?autopilot=1` | Wat doet een computerspeler? Geeft besturing terug, eventueel met `action`. Moet werken met alleen `state`. |
| `init(party)` | elk apparaat, 1× | Eenmalige opbouw, bijv. luisteren naar tikken op het scherm. |
| `render(c, state, party)` | elk apparaat, elke frame | Tekent de `state`. `c` is een Canvas 2D-context die al in **wereldcoördinaten** staat (0..world.w, 0..world.h). Verander hier nooit de state. |
| `onEvent(name, data, party)` | elk apparaat | Een moment dat iedereen moet zien of horen. Hier horen geluid en effecten. |

### `inputs` (in `update`)

```js
inputs[playerId] = {
  x, y,          // joystick of WASD, van -1 tot 1 (y = -1 is omhoog)
  buttons: [..], // knoppen die NU ingedrukt zijn
  pressed: [..], // knoppen die SINDS DE VORIGE UPDATE zijn ingedrukt (voor eenmalige acties)
}
```

Gebruik `pressed[0]` voor "springen of schieten bij indrukken" en `buttons[0]` voor "zolang je vasthoudt".

### Besturing (`controls`)

| Instelling | Telefoon | Laptop |
|---|---|---|
| `{ joystick: true, buttons: ['Dash'] }` | joystick links, knop rechts | WASD/pijltjes + spatie |
| `{ joystick: true, buttons: [] }` | alleen joystick | WASD/pijltjes |
| `{ joystick: false, buttons: ['⬅️', '➡️'] }` | grote knoppen naast elkaar | spatie/J en K, of 1 en 2 |
| `false` | niets: maak eigen knoppen in `party.ui`, of laat spelers op het canvas tikken | idem |

Knoppen 1–4 = spatie/J/Enter, K/Shift, L, I. De cijfers 1–4 werken ook. Een gamepad werkt automatisch.

### Het `party`-object

| Wat | Waar | Betekenis |
|---|---|---|
| `party.me` | overal | id van de speler op dit apparaat |
| `party.isHost` | overal | `true` op de host |
| `party.players` | overal | spelers in deze ronde: `[{ id, name, emoji, color, bot, wins }]` |
| `party.player(id)` | overal | één speler opzoeken (naam, emoji, kleur) |
| `party.time` | overal | seconden sinds het begin van de ronde |
| `party.dt` | render | seconden sinds de vorige frame |
| `party.emit(name, data)` | host | stuur een event naar alle apparaten (komt in `onEvent`) |
| `party.end({ title, text, winners, scores })` | host | ronde klaar. `winners` = lijst met ids, `scores` = `{ id: getal }` |
| `party.send(action)` | overal | stuur een actie naar de host (komt in `onAction`) |
| `party.smooth(key, x, y)` | render | vloeiende positie op niet-host-apparaten. Gebruik dit voor alles wat beweegt. |
| `party.toWorld(clientX, clientY)` | overal | schermpunt omrekenen naar wereldcoördinaten (voor tikken) |
| `party.ui` | overal | een `<div>` precies over de spelwereld, voor HTML-knoppen of tekst |
| `party.canvas` | overal | het canvas-element |
| `party.world` | overal | `{ w, h }` |
| `party.juice.*` | overal (gebruik in `onEvent`) | geluid en effecten, zie hieronder |
| `party.h(tag, attrs, ...kids)` | overal | snel een HTML-element maken |
| `rand`, `randInt`, `pick`, `shuffle`, `clamp`, `lerp`, `dist`, `angle` | overal | hulpjes, ook te importeren uit `party.js` |

## Juice: geluid en effecten

Effecten roep je aan in **`onEvent`**, niet in `update`: `update` draait alleen op de host, dus de anderen zouden niets zien.

```js
// host, in update:
party.emit('boem', { x: b.x, y: b.y, id });

// alle apparaten:
onEvent(name, d, party) {
  if (name === 'boem') {
    party.juice.sfx('boom');
    party.juice.particles(d.x, d.y, { count: 20, colors: ['#f80', '#ff0'], speed: 400 });
    party.juice.shake(12);
    if (d.id === party.me) party.juice.vibrate(150); // alleen de getroffen speler trilt
  }
}
```

| Functie | Wat |
|---|---|
| `sfx(naam, { vol, pitch })` | geluiden: `pop` `click` `tick` `go` `coin` `jump` `boing` `hit` `splat` `boom` `whoosh` `powerup` `toet` `prrt` `quack` `win` `lose` |
| `particles(x, y, { count, color, colors, speed, size, life, gravity, emoji, angle, spread })` | spetters; met `emoji: '🥚'` vliegen er emoji's |
| `floatText(x, y, tekst, { color, size, life })` | zwevende tekst zoals `+1` of `AU!` |
| `shake(sterkte, duur)` | scherm schudden |
| `flash(kleur, duur)` | scherm kort laten oplichten |
| `confetti()` | confetti over de hele wereld |
| `vibrate(ms)` | telefoon laten trillen (Android) |

Bij het einde van de ronde doet de engine zelf confetti en een win- of verliesgeluid.

## Tekenen: tips voor elk scherm

- De wereld wordt geschaald zodat hij past. Op een staande telefoon is een liggende wereld klein. Gebruik daarom **grote dingen**: spelers minstens ±35 eenheden straal, tekst minstens 28 px in een wereld van 1600 breed.
- Wil je dat het op een staande telefoon goed werkt (bijv. een quiz), kies dan een staande of vierkante wereld, zoals `{ w: 900, h: 1200 }`.
- Emoji tekenen: `c.font = '44px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'`.
- Gebruik `party.smooth(id, x, y)` voor bewegende dingen, anders schokt het op de andere apparaten.
- Laat zien wie "jij" bent (bijv. een witte rand) en toon belangrijke info (tijd, score) groot bovenin.
- `performance.now()` in `render` is prima voor animaties die niet in de state hoeven (wiebelen, golfjes).

## Testen

```bash
npm install                      # eenmalig
npm run playtest -- <game-map>   # 4 apparaten spelen automatisch samen, zonder internet
npm run dev                      # lokale server: http://localhost:8080/games/<game-map>/?peer=local
```

De playtest schrijft screenshots en `rapport.json` naar `games/<game-map>/test/`. Handige URL-opties om zelf te testen:

| Optie | Wat |
|---|---|
| `?peer=local&peerport=9000` | lokale matchmaking-server (bij `npm run dev`) |
| `?autohost=1&bots=3` | meteen een kamer openen met 3 bots |
| `?autopilot=1` | jouw speler wordt bestuurd door `bot()` |
| `?touch=1` | touch-knoppen tonen op een laptop |

In de browserconsole staat `window.__party` met `phase`, `state`, `players`, `stats` en `start()`.
