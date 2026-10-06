// Bombardeer: geef de kroket-bom door voordat hij ontploft! Wie hem vasthoudt bij BOEM ligt eruit.
// Kern + sprint + VEILIG na doorgeven + spook-gooi en spook-banaan + slowmotion + kip + banaan.

import { startGame, rand, pick, dist, clamp } from '../../engine/party.js';

const W = 1200, H = 1200;
const R = 40;                 // straal van een speler
const HUD_H = 110;            // bovenbalk (ronde-info)
const TOP = 255;              // hoogste plek voor een speler: kroket en hartjes blijven onder de bovenbalk
const X0 = R, X1 = W - R, Y0 = TOP, Y1 = H - R;
const WALL_Y = Y0 - R;        // bovenmuur van de keukenvloer (daarboven: keukentegels)
const BAND_Y = (HUD_H + WALL_Y - 20) / 2; // midden van de tegelrand: hier staat je eigen status
const CX = W / 2, CY = (Y0 + Y1) / 2;
const SPEED = 380, HOLD_SPEED = 410;
const SPRINT_T = 0.35, SPRINT_MUL = 2.4, SPRINT_CD = 2.35;
const GHOST_SPEED = 320;
const TAG_DIST = 90;
const LOCK = 0.8;             // nieuwe houder kan even niet tikken (in TSSSS niet: dan mag je meteen door)
const SAFE_T = 2;             // wie de kroket net doorgaf, is zo lang VEILIG (geen pingpong)
const HOT_T = 0.5, HOT_MUL = 0.15; // hete handjes: na een gewone tik loop je even heel langzaam ("AU! HEET!")
// bots als er even geen kroket is (intro en pauze): rustig verspreiden in plaats van klonteren
const BOT_SPREAD = 320, BOT_CALM = 0.45, BOT_IDLE = 0.2;
const INTRO = 2, PAUSE = 3, SLOW_T = 1.0, RESPAWN = 1.5, SHIELD = 1.5;
// lont: hangt af van het aantal spelers BIJ DE START (in de finale wordt hij dus niet langer)
const FUSE_BASE = 14, FUSE_SMALL = 18, SMALL_N = 4, FUSE_DROP = 1.2, FUSE_MIN = 6, FUSE_SD = 3;
const SUDDEN_AT = 150;        // na zoveel seconden: sudden death
// kip: ongeveer de helft van de lonten, op een willekeurig moment; geeft het op als je hem ontloopt
const CHICKEN_SPEED = 320, CHICKEN_T = 3.8, CHICKEN_GRAB = 80;
const CHICKEN_WINDUP = 0.6;   // eerst even fladderen op de plek: het doelwit krijgt een voorsprong
const CHICKEN_CHANCE = 0.5, CHICKEN_MIN_FUSE = 8, CK_LO = 0.45, CK_HI = 0.8;
const CHICKEN_LEFT = 2.5;     // zoveel lont is er minstens nog als de kip klaar is
const CHICKEN_MIN_T = 2;      // korter jagen dan dit heeft geen zin: dan geen kip
// bananen
const BANANA_EVERY = 7, BANANA_MAX = 2, SLIP_T = 1, SLIP_SPEED = 450;
const BANANA_ARM = 0.8;       // een nieuwe banaan "valt" eerst even en is dan pas glad
// spoken
const GOOI_MIN = 1.5;         // spook-gooi kan niet meer als de lont korter is (en niet tijdens TSSSS)
const GHOST_BANANA_CD = 8, GHOST_BANANA_START = 2;
const AWAY_MSG_MS = 7000;     // zo lang zie je "Je was even weg" na terugkomen
// vulling van de kroket: emoji, grap en een eigen geluidje (alleen voor de show)
const FILL = {
  taart: { e: '🎂', s: 'splat', t: (n) => `${n} is nu een taart 🎂` },
  eend: { e: '🦆', s: 'quack', t: () => 'Een eend! Zomaar. 🦆' },
  sokken: { e: '🧦', s: 'prrt', t: () => 'Sokken. Alweer. 🧦' },
  brief: { e: '💌', s: 'pop', t: () => 'Brief van oma: "Eet je groenten" 💌' },
  confetti: { e: '🎉', s: 'powerup', t: () => 'VERRASSING! 🎉' },
};
const FILLS = Object.keys(FILL);
const FONT = 'Fredoka, system-ui, sans-serif';
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", sans-serif';

// ----- hulpjes (alleen state, dus ook bruikbaar in render en bot) -----
const living = (S) => Object.entries(S.p).filter(([, p]) => !p.ghost);
const playable = (S) => living(S).filter(([, p]) => p.rs <= 0);
const open = (q) => q.safe <= 0 && q.shield <= 0;   // mag deze speler de kroket krijgen?
const nameOf = (party, id) => party.player(id)?.name || '?';

// Spook-gooi: de bom springt naar de dichtstbijzijnde levende speler die niet VEILIG is.
function throwTarget(S, p) {
  return playable(S).filter(([oid, q]) => oid !== S.holder && open(q)).sort((a, b) => dist(a[1], p) - dist(b[1], p))[0] || null;
}
const lateForThrow = (S) => !!S.holder && (S.phase === 'slow' || (S.phase === 'play' && S.fuse < GOOI_MIN));

// Wat doet de knop van een spook nu? Eerst de gooi (1× per ronde), daarna elke 8 s een banaan.
function ghostAction(S, id) {
  const p = S.p[id];
  if (!p?.ghost || S.phase === 'fin') return null;
  if (!p.threw && S.holder && S.phase === 'play' && S.fuse >= GOOI_MIN && throwTarget(S, p)) return 'gooi';
  if (p.gb <= 0) return 'banaan';
  return null;
}

// Bot: beste vluchtrichting (16 richtingen proberen: ver van het gevaar, niet tegen een muur).
function fleeDir(me, threat) {
  let best = [0, 0], bs = -Infinity;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8, dx = Math.cos(a), dy = Math.sin(a);
    const nx = me.x + dx * 160, ny = me.y + dy * 160;
    const wall = Math.min(nx - X0, X1 - nx, ny - Y0, Y1 - ny);
    const sc = Math.hypot(nx - threat.x, ny - threat.y) + Math.min(0, wall) * 4 + Math.min(wall, 120) * 0.6;
    if (sc > bs) { bs = sc; best = [dx, dy]; }
  }
  return best;
}

// ----- spelregels (host) -----

// Bom gaat van de ene speler naar de andere. Wie hem kwijt is, is even VEILIG.
// In TSSSS geen vergrendeling: wie hem in de laatste seconde krijgt, kan hem nog net doorgeven.
// hot = gewone tik: dan heeft de nieuwe houder hete handjes (niet na een spook-gooi of de kip).
function pass(S, to, party, hot) {
  const from = S.holder;
  if (from && S.p[from] && from !== to) S.p[from].safe = SAFE_T;
  const slow = S.phase === 'slow';
  S.holder = to;
  S.p[to].lock = slow ? 0 : LOCK;
  S.p[to].safe = 0;
  S.p[to].hot = hot && !slow ? HOT_T : 0;
  party.emit('pas', { x: S.p[to].x, y: S.p[to].y, from, to, hot: S.p[to].hot > 0 ? 1 : 0 });
}

// Wie krijgt de volgende kroket? Wie hem het minst vaak had (gelijk: loten). Al bij de BOEM gekozen,
// zodat iedereen in de pauze ziet voor wie hij is en kan wegrennen.
function chooseNext(S) {
  const cand = living(S);
  if (!cand.length) return null;
  const min = Math.min(...cand.map(([, p]) => p.held));
  return pick(cand.filter(([, q]) => q.held === min))[0];
}

// Pauze tussen twee kroketten (met het volgende slachtoffer erbij).
function toPause(S) {
  S.phase = 'pause'; S.pause = PAUSE; S.holder = null; S.chicken = null;
  S.next = chooseNext(S);
}

// Nieuwe lont, en loten of (en wanneer) de kip komt.
function startFuse(S) {
  const base = S.small ? FUSE_SMALL : FUSE_BASE;
  let f = Math.max(FUSE_MIN, base - FUSE_DROP * S.booms) + rand(-1.5, 1.5);
  if (S.sd) f = FUSE_SD;
  S.fuse = S.fuseMax = f;
  const lo = Math.max(CK_LO, (CHICKEN_LEFT + CHICKEN_MIN_T + 0.5) / f);
  S.ckAt = !S.sd && f >= CHICKEN_MIN_FUSE && lo < CK_HI && Math.random() < CHICKEN_CHANCE ? rand(lo, CK_HI) : 0;
  S.chicken = null; S.phase = 'play'; S.tk = -1;
}

// Nieuwe kroket met een volle lont voor deze speler.
function newBomb(S, id, party) {
  const p = S.p[id];
  p.held++; p.lock = LOCK; p.safe = 0; p.hot = 0;
  S.holder = id; S.next = null;
  startFuse(S);
  party.emit('bom', { x: p.x, y: p.y, id });
}

// Nieuwe bom: valt op het gekozen slachtoffer (S.next). Is die weg of nog niet terug: wie hem het minst had.
function giveBomb(S, party) {
  const n = S.next && S.p[S.next];
  if (n && !n.ghost && n.rs <= 0) { newBomb(S, S.next, party); return; }
  const cand = playable(S);
  if (!cand.length) return;
  const min = Math.min(...cand.map(([, p]) => p.held));
  newBomb(S, pick(cand.filter(([, q]) => q.held === min))[0], party);
}

// Ronde loopt af (na een korte pauze, zodat de BOEM te zien is).
function toFin(S, t) {
  if (S.phase === 'fin') return;
  S.phase = 'fin'; S.pause = t; S.holder = null; S.chicken = null; S.next = null;
}

// Speler wordt spook (na BOEM of na wegvallen).
function makeGhost(S, p) {
  p.ghost = true; p.out = Math.round(S.elapsed); p.rs = 0; p.safe = 0; p.slip = 0; p.gb = GHOST_BANANA_START;
}

// BOEM: de houder verliest een leven.
function boom(S, party) {
  const id = S.holder, p = S.p[id];
  S.holder = null;
  if (!p || p.ghost) { toPause(S); return; }
  p.lives--; p.bm++; S.booms++;
  const filling = S.filling;
  S.filling = pick(FILLS);
  const out = p.lives <= 0;
  party.emit('boem', { x: p.x, y: p.y, id, filling, out });
  if (out) {
    makeGhost(S, p); S.order.push(id);
    party.emit('spook', { x: p.x, y: p.y, id });
    // de BOEM-plek gaat mee, zodat "Nog N!" altijd op de andere helft komt (het spook vliegt intussen weg)
    party.emit('uit', { id, left: living(S).length, x: p.x, y: p.y });
  } else { p.rs = RESPAWN; }
  if (living(S).length <= 1) toFin(S, 2.5);
  else toPause(S);
}

// Kip: de kroket springt van de houder af en rent naar een doelwit (dat staat in de state).
function startChicken(S, party) {
  S.ckAt = 0;
  const from = S.holder, h = S.p[from];
  const t = Math.min(CHICKEN_T, S.fuse - CHICKEN_LEFT);
  if (!h || h.rs > 0 || t < CHICKEN_MIN_T) return;
  let others = playable(S).filter(([id, q]) => id !== from && open(q));
  if (!others.length) others = playable(S).filter(([id]) => id !== from);
  if (!others.length) return;
  const target = pick(others)[0];
  S.chicken = { x: h.x, y: h.y, t, age: 0, target, from };
  h.safe = SAFE_T;
  S.holder = null;
  party.emit('kip', { x: h.x, y: h.y, target, from });
}

// De kip rent naar zijn doelwit. Raakt hij iemand: die heeft hem. Ontloop je hem: hij geeft het op.
function updateChicken(S, dt, party) {
  const ch = S.chicken;
  ch.age += dt; ch.t -= dt;
  let tg = S.p[ch.target];
  if (!tg || tg.ghost || tg.rs > 0) { // doelwit weg of eruit: nieuw doelwit
    const all = playable(S);
    const pool = all.filter(([id]) => id !== ch.from);
    const c = pool.length ? pool : all;
    if (c.length) { ch.target = pick(c)[0]; tg = S.p[ch.target]; party.emit('kip', { x: ch.x, y: ch.y, target: ch.target, from: ch.from, again: true }); }
    else tg = null;
  }
  if (tg && ch.age > CHICKEN_WINDUP) {
    const d = dist(ch, tg) || 1, step = Math.min(d, CHICKEN_SPEED * dt);
    ch.x += ((tg.x - ch.x) / d) * step; ch.y += ((tg.y - ch.y) / d) * step;
  }
  let hit = null;
  if (ch.age > CHICKEN_WINDUP) {
    hit = playable(S).filter(([, q]) => open(q) && dist(q, ch) < CHICKEN_GRAB)
      .sort((a, b) => (a[0] === ch.target ? -1 : 0) - (b[0] === ch.target ? -1 : 0) || dist(a[1], ch) - dist(b[1], ch))[0];
  }
  if (hit) {
    S.chicken = null; S.holder = null;
    pass(S, hit[0], party);
    party.emit('kipgrab', { x: hit[1].x, y: hit[1].y, id: hit[0], target: hit[0] === ch.target });
    return;
  }
  if (ch.t > 0 && S.fuse > 1) return;
  // opgegeven: de kroket gaat terug naar de oude houder (of wie het dichtst bij de kip staat)
  S.chicken = null; S.holder = null;
  const back = S.p[ch.from];
  let to = back && !back.ghost && back.rs <= 0 ? ch.from : null;
  if (!to) {
    const c = playable(S).sort((a, b) => dist(a[1], ch) - dist(b[1], ch));
    to = (c.find(([id]) => id !== ch.target) || c[0] || [null])[0];
  }
  if (!to) { toPause(S); return; }
  pass(S, to, party);
  party.emit('kipop', { kx: ch.x, ky: ch.y, x: S.p[to].x, y: S.p[to].y, id: to, back: to === ch.from, target: ch.target });
}

// Spook drukt op de knop: gooien (1×) of een banaan neerleggen (elke 8 s, max 1 per spook).
function ghostPress(S, id, party) {
  const p = S.p[id];
  const act = ghostAction(S, id);
  if (act === 'gooi') {
    const t = throwTarget(S, p);
    const from = S.holder;
    p.threw = true;
    pass(S, t[0], party);
    party.emit('gooi', { from, to: t[0], x: t[1].x, y: t[1].y, by: id });
  } else if (act === 'banaan') {
    const k = S.bananas.findIndex((b) => b.g === id);
    if (k >= 0) S.bananas.splice(k, 1);
    const b = { x: Math.round(p.x), y: Math.round(p.y), a: BANANA_ARM, g: id };
    S.bananas.push(b);
    p.gb = GHOST_BANANA_CD;
    party.emit('spookbanaan', { x: b.x, y: b.y, id });
  }
}

function respawn(p) {
  p.x = CX + rand(-250, 250); p.y = CY + rand(-250, 250);
  p.shield = SHIELD; p.lock = 0; p.safe = 0;
}

let awaySince = 0; // dit apparaat: sinds wanneer zien we "Je was even weg" (alleen voor de tekst)

// ----- alleen voor tekenen en effecten op dit apparaat (hoort niet in de state) -----
const TAU = Math.PI * 2;
const meas = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
const seen = {};   // waar elke speler op dit scherm het laatst getekend is (voor effecten die van A naar B vliegen)
let lastS = null;  // de laatst getekende state (alleen lezen, voor effecten die even later komen)
let pasQ = [];     // effecten van een gewone overgave wachten heel even: bij de kip of de spook-gooi doen die het zelf
const later = (s, fn) => setTimeout(fn, s * 1000);
const pickBy = (arr, n) => arr[Math.abs(Math.floor(n)) % arr.length]; // zelfde tekst op elk apparaat
const bandY = (y) => clamp(y, Y0 + 90, H - 170); // BOEM-teksten blijven binnen de vloer

// Zwevende tekst die altijd helemaal in beeld blijft: te breed wordt kleiner, tegen een muur schuift hij op.
function say(j, x, y, text, o = {}) {
  let size = o.size || 40;
  if (meas) {
    meas.font = `900 ${size * 1.1}px ${FONT}`;
    const w = meas.measureText(text).width + size * 0.4;
    if (w > W - 30) size *= (W - 30) / w;
    const hw = Math.min(w, W - 30) / 2;
    x = clamp(x, hw + 15, W - hw - 15);
  }
  y = clamp(y, HUD_H + size * 0.7, H - size * 0.7);
  j.floatText(x, y, text, { ...o, size });
}

// Spoor van deeltjes in een boogje van A naar B (de kroket vliegt over).
function trail(j, x0, y0, x1, y1, o) {
  for (let i = 1; i <= 7; i++) {
    const k = i / 8;
    later(i * 0.05, () => j.particles(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 110, { count: 3, speed: 50, life: 0.45, ...o }));
  }
}

startGame({
  id: 'bombardeer',
  title: 'Bombardeer',
  emoji: '🥟',
  subtitle: 'Geef de kroket door!',
  howTo: [
    'Beweeg met de joystick (of WASD / pijltjes).',
    'Heb jij de kroket 🥟? Ren iemand aan om hem door te geven!',
    'Net doorgegeven? Dan ben je 2 tellen VEILIG.',
    'Geen kroket? Rennen! Sprint met de knop (of spatie).',
    'Wie hem vasthoudt bij BOEM, ligt eruit. Laatste over wint!',
    'Spook? Gooi de kroket 1× naar iemand, en leg bananen 🍌.',
  ],
  minPlayers: 2,
  maxPlayers: 8,
  world: { w: W, h: H },
  background: '#3a2a1f',
  controls: { joystick: true, buttons: ['Sprint'] },

  // ----- host: begin van een ronde -----
  setup(players) {
    const lives = players.length <= 2 ? 3 : players.length === 3 ? 2 : 1;
    const p = {};
    players.forEach((pl, i) => {
      const a = (i / players.length) * Math.PI * 2;
      p[pl.id] = {
        x: CX + Math.cos(a) * 380, y: CY + Math.sin(a) * 380, lives,
        sprint: 0, cd: 0, lock: 0, safe: 0, shield: 0, slip: 0, sx: 0, sy: 0, hot: 0,
        ghost: false, threw: false, gb: 0, away: 0, held: 0, rs: 0, bm: 0, out: 0,
      };
    });
    return {
      p, ml: lives, small: players.length <= SMALL_N, holder: null, fuse: 0, fuseMax: 1, ckAt: 0, chicken: null, bananas: [],
      phase: 'intro', pause: INTRO, boomT: 0, booms: 0, filling: pick(FILLS), bananaT: BANANA_EVERY,
      elapsed: 0, order: [], tk: -1, sd: false, next: null,
    };
  },

  // ----- host: elke frame -----
  update(S, dt, inputs, party) {
    S.elapsed += dt;
    if (S.phase === 'fin') {
      S.pause -= dt;
      if (S.pause <= 0) finish(S, party);
      return;
    }
    if (living(S).length <= 1) { toFin(S, 0.5); return; }

    // sudden death
    if (!S.sd && S.elapsed >= SUDDEN_AT) {
      S.sd = true; S.ckAt = 0;
      if (S.fuse > FUSE_SD) { S.fuse = FUSE_SD; S.fuseMax = Math.min(S.fuseMax, FUSE_SD); }
      party.emit('sudden', {});
    }

    // spelers bewegen (spoken zweven en hebben hun eigen knop)
    for (const [id, p] of Object.entries(S.p)) {
      p.lock = Math.max(0, p.lock - dt); p.shield = Math.max(0, p.shield - dt); p.safe = Math.max(0, p.safe - dt);
      p.cd = Math.max(0, p.cd - dt); p.sprint = Math.max(0, p.sprint - dt); p.slip = Math.max(0, p.slip - dt);
      p.gb = Math.max(0, p.gb - dt); p.hot = Math.max(0, (p.hot || 0) - dt);
      if (p.rs > 0) { p.rs -= dt; if (p.rs <= 0) respawn(p); continue; }
      const inp = inputs[id] || { x: 0, y: 0, pressed: [] };
      let ix = inp.x || 0, iy = inp.y || 0;
      const m = Math.hypot(ix, iy);
      if (m > 1) { ix /= m; iy /= m; }
      if (p.ghost) {
        p.x = clamp(p.x + ix * GHOST_SPEED * dt, X0, X1); p.y = clamp(p.y + iy * GHOST_SPEED * dt, Y0, Y1);
        if (inp.pressed?.[0]) ghostPress(S, id, party);
        continue;
      }
      let vx, vy;
      if (p.slip > 0) { vx = p.sx * SLIP_SPEED; vy = p.sy * SLIP_SPEED; }
      else {
        const hot = id === S.holder && p.hot > 0; // hete handjes: even jongleren, bijna stilstaan
        if (inp.pressed?.[0] && p.cd <= 0 && m > 0.2 && !hot) { p.sprint = SPRINT_T; p.cd = SPRINT_CD; party.emit('sprint', { x: p.x, y: p.y }); }
        const sp = (id === S.holder ? HOLD_SPEED : SPEED) * (p.sprint > 0 ? SPRINT_MUL : 1) * (hot ? HOT_MUL : 1);
        vx = ix * sp; vy = iy * sp;
      }
      p.x = clamp(p.x + vx * dt, X0, X1); p.y = clamp(p.y + vy * dt, Y0, Y1);
    }

    // spelers botsen niet door elkaar heen (zacht wegduwen)
    const pl = playable(S);
    for (let i = 0; i < pl.length; i++) for (let j = i + 1; j < pl.length; j++) {
      const a = pl[i][1], b = pl[j][1];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= R * 1.6) continue;
      const nx = d ? dx / d : 1, ny = d ? dy / d : 0, push = (R * 1.6 - d) / 2;
      a.x = clamp(a.x - nx * push, X0, X1); a.y = clamp(a.y - ny * push, Y0, Y1);
      b.x = clamp(b.x + nx * push, X0, X1); b.y = clamp(b.y + ny * push, Y0, Y1);
    }

    // wachten op de volgende kroket
    if (S.phase === 'intro' || S.phase === 'pause') {
      S.pause -= dt;
      if (S.pause <= 0) giveBomb(S, party);
    }

    // bananen: af en toe een nieuwe, en wie erop stapt glijdt naar een ander
    if (S.phase !== 'intro') {
      S.bananaT -= dt;
      if (S.bananaT <= 0) {
        S.bananaT = BANANA_EVERY;
        if (S.bananas.filter((b) => !b.g).length < BANANA_MAX) {
          const b = { x: Math.round(rand(120, W - 120)), y: Math.round(rand(Y0 + 40, Y1 - 60)), a: BANANA_ARM };
          S.bananas.push(b); party.emit('banaan', b);
        }
      }
    }
    for (const b of S.bananas) if (b.a > 0) b.a = Math.max(0, b.a - dt);
    for (const [id, p] of playable(S)) {
      if (p.slip > 0) continue;
      const k = S.bananas.findIndex((b) => !(b.a > 0) && dist(b, p) < 60);
      if (k < 0) continue;
      const bn = S.bananas.splice(k, 1)[0];
      const others = playable(S).filter(([oid]) => oid !== id);
      let a = rand(Math.PI * 2);
      if (others.length) { const o = pick(others)[1]; a = Math.atan2(o.y - p.y, o.x - p.x); }
      p.slip = SLIP_T; p.sx = Math.cos(a); p.sy = Math.sin(a);
      party.emit('slip', { x: bn.x, y: bn.y, id, by: bn.g || null });
    }

    if (S.phase !== 'play' && S.phase !== 'slow') return;

    // vangnet: lont loopt maar niemand heeft hem (zou niet moeten gebeuren): nieuwe kroket
    if (!S.holder && !S.chicken) {
      const c = playable(S);
      if (c.length) newBomb(S, pick(c)[0], party);
      else toPause(S);
      return;
    }

    // lont
    S.fuse = Math.max(0, S.fuse - dt);
    const ratio = S.fuse / S.fuseMax;
    if (S.phase === 'play' && S.holder && S.ckAt > 0 && ratio < S.ckAt) startChicken(S, party);

    // kip
    if (S.chicken) {
      updateChicken(S, dt, party);
      if (S.chicken || S.phase !== 'play') return;
    }

    // tikken: de houder rent iemand aan (niet wie VEILIG is of net terug is)
    const h = S.holder && S.p[S.holder];
    if (h && !h.ghost && h.rs <= 0 && h.lock <= 0) {
      let best = null, bd = TAG_DIST;
      for (const [id, q] of playable(S)) {
        if (id === S.holder || !open(q)) continue;
        const d = dist(h, q);
        if (d < bd) { bd = d; best = id; }
      }
      if (best) pass(S, best, party, true);
    }

    // tik-geluid, slowmotion en BOEM
    const v = S.phase === 'slow' ? 1000 + Math.floor(S.boomT / 0.2) : Math.floor(S.fuse / (S.fuse < 4 ? 0.5 : 1));
    if (v !== S.tk) { S.tk = v; party.emit('tik', { fuse: S.fuse, slow: S.phase === 'slow' }); }
    if (S.phase === 'play' && S.fuse <= 0) {
      S.phase = 'slow'; S.boomT = SLOW_T;
      const hp = S.p[S.holder];
      party.emit('slow', { x: hp?.x || CX, y: hp?.y || CY, id: S.holder });
    } else if (S.phase === 'slow') {
      S.boomT -= dt;
      if (S.boomT <= 0) boom(S, party);
    }
  },

  // ----- host: speler weg (verbinding kwijt): wordt spook; had hij de kroket, dan een nieuwe voor een ander -----
  onLeave(S, id, party) {
    const p = S.p?.[id];
    if (!p || p.ghost || S.phase === 'fin') return;
    makeGhost(S, p); p.away = 1;
    party.emit('weg', { x: p.x, y: p.y, id });
    if (S.next === id) S.next = S.phase === 'pause' ? chooseNext(S) : null; // het slachtoffer is weg: kies een ander
    if (S.holder === id) {
      S.holder = null;
      if (S.phase === 'play' || S.phase === 'slow') {
        const c = playable(S);
        if (c.length) newBomb(S, pick(c)[0], party);
        else toPause(S);
      }
    }
  },

  // ----- host: wat doen bots? (alleen de state; een knop "drukken" = buttons van false naar true) -----
  bot(S, id, party) {
    const me = S.p?.[id];
    if (!me || me.rs > 0) return {};
    const t = party.time;
    let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 1000;
    // spook: zweef naar een slachtoffer, gooi als de lont bijna op is, leg bananen bij levenden
    if (me.ghost) {
      const act = ghostAction(S, id);
      const live = Object.entries(S.p).filter(([oid, q]) => !q.ghost && q.rs <= 0 && oid !== S.holder);
      let x, y;
      if (live.length) {
        const v = live[h % live.length][1], a = t * 0.9 + h;
        x = v.x + Math.cos(a) * 110 - me.x; y = v.y + Math.sin(a) * 110 - me.y;
      } else { const a = t * 0.5 + h; x = Math.cos(a); y = Math.sin(a); }
      const n = Math.hypot(x, y) || 1;
      let press = false;
      if (act === 'gooi') press = S.fuse < 4;
      else if (act === 'banaan') press = live.some(([, q]) => dist(q, me) < 220) && Math.sin(t * 2 + h) > 0.3;
      return { x: x / n, y: y / n, buttons: [press] };
    }
    const others = Object.entries(S.p).filter(([oid, q]) => oid !== id && !q.ghost && q.rs <= 0);
    const hunted = S.chicken?.target === id; // de kip moet MIJ hebben
    let x = 0, y = 0, sprint = false, flee = false, spd = 1;
    const hold = S.holder === id;
    const nx = S.phase === 'pause' && S.next && S.p[S.next] && !S.p[S.next].ghost ? S.next : null;
    if (!S.holder && !S.chicken) {
      // geen kroket in het spel (intro of pauze): weg van het volgende slachtoffer, of rustig verspreiden
      const nv = nx && nx !== id ? S.p[nx] : null;
      const near = others.slice().sort((a, b) => dist(me, a[1]) - dist(me, b[1]))[0];
      if (nv && dist(me, nv) < 500) { [x, y] = fleeDir(me, nv); flee = true; sprint = dist(me, nv) < 160 && Math.random() < 0.1; }
      else if (nx === id && near) { x = near[1].x - me.x; y = near[1].y - me.y; spd = BOT_CALM; } // ik ben de volgende: sluip er alvast heen
      else if (near && dist(me, near[1]) < BOT_SPREAD) { [x, y] = fleeDir(me, near[1]); flee = true; spd = BOT_CALM; }
      else spd = BOT_IDLE;
    } else if (hold) {
      let tg = null, bd = Infinity;
      for (const [, q] of others) {
        const d = dist(me, q) + (open(q) ? 0 : 400);
        if (d < bd) { bd = d; tg = q; }
      }
      if (tg) { x = tg.x - me.x; y = tg.y - me.y; sprint = dist(me, tg) < 170 && Math.random() < 0.15; }
    } else {
      const src = S.holder && S.p[S.holder] && S.holder !== id ? S.p[S.holder] : S.chicken;
      if (src) {
        const d = dist(me, src) || 1;
        if (d < 500 || hunted) { [x, y] = fleeDir(me, src); flee = true; }
        else { x = (me.x - src.x) / d; y = (me.y - src.y) / d; }
        sprint = d < (src === S.chicken ? 200 : 140) && Math.random() < 0.15;
      }
      if (S.chicken && src !== S.chicken && dist(me, S.chicken) < 250) { x += (me.x - S.chicken.x) / 200; y += (me.y - S.chicken.y) / 200; }
    }
    // bananen ontwijken (wie geen kroket heeft)
    if (!hold) for (const b of S.bananas) { const d = dist(me, b); if (d < 130 && d > 0) { x += ((me.x - b.x) / d) * 1.5; y += ((me.y - b.y) / d) * 1.5; } }
    // muren ontwijken en naar het midden hoeken uit (vluchten houdt zelf al rekening met muren)
    if (!flee) {
      const mm = 130, push = 1.6;
      if (me.x < X0 + mm) x += push; if (me.x > X1 - mm) x -= push;
      if (me.y < Y0 + mm) y += push; if (me.y > Y1 - mm) y -= push;
      if (!hold) { x += (CX - me.x) / 1200; y += (CY - me.y) / 1200; }
    }
    // lichte zwenk zodat bots niet voorspelbaar zijn (niet als de kip je achterna zit)
    const sway = hunted ? 0 : Math.sin(t * 1.4 + h) * (flee ? 0.2 : 0.4);
    const c = Math.cos(sway), s = Math.sin(sway);
    const rx = x * c - y * s, ry = x * s + y * c;
    const n = (Math.hypot(rx, ry) || 1) / spd;
    return { x: rx / n, y: ry / n, buttons: [sprint && me.cd <= 0] };
  },

  // ----- alle apparaten: effecten en geluid -----
  onEvent(name, d, party) {
    const j = party.juice, me = party.me;
    const nm = (id) => nameOf(party, id);
    const clearPas = () => { pasQ.forEach(clearTimeout); pasQ = []; };

    // nieuwe kroket valt op iemand
    if (name === 'bom') {
      j.sfx('pop', { pitch: 0.8 }); j.sfx('splat', { vol: 0.25, pitch: 1.6 });
      j.particles(d.x, d.y - 70, { count: 8, emoji: '🥟', speed: 260, size: 10, life: 0.7, gravity: 400 });
      if (d.id === me) { say(j, d.x, d.y - 120, 'VOOR JOU! 🥟', { color: '#ff4d6d', size: 46, life: 1.2 }); j.vibrate(100); j.shake(5, 0.25); }
      else say(j, d.x, d.y - 120, pickBy(['Vers uit de frituur! 🥟', 'Kroket in aantocht! 🥟', 'PLOF! 🥟'], d.x + d.y), { color: '#ffd166', size: 40, life: 1.2 });
    }
    // gewone overgave (bij kip of spook-gooi laten die events hun eigen effect zien)
    if (name === 'pas') {
      if (d.to === me) j.vibrate(80);
      pasQ.push(setTimeout(() => {
        j.sfx('pop', { pitch: 0.9 + Math.random() * 0.5 });
        j.particles(d.x, d.y - 20, { count: 10, colors: ['#ffd166', '#fff', '#ff9f1c'], speed: 300, size: 9 });
        say(j, d.x, d.y - 100, pickBy(['HIER, JIJ!', 'NIET MIJ!', 'Oeps 🙃', 'PLOF!'], d.x * 7 + d.y), { color: '#fff', size: 38 });
        if (d.to === me) { j.shake(5, 0.2); j.flash('rgba(255,140,40,.25)', 0.2); }
        if (d.from === me) j.sfx('coin', { vol: 0.5, pitch: 1.2 });
      }, 0));
    }
    if (name === 'sprint') {
      j.sfx('whoosh', { vol: 0.5, pitch: 1 + Math.random() * 0.3 });
      j.particles(d.x, d.y + 28, { count: 8, colors: ['#fff', '#e6d2ae'], speed: 220, size: 12, life: 0.4 });
    }
    if (name === 'tik') {
      const f = d.slow ? 1.9 : 1 + (1 - Math.min(d.fuse, 4) / 4) * 0.8;
      j.sfx('tick', { pitch: f, vol: d.fuse > 6 && !d.slow ? 0.4 : 0.8 });
    }
    if (name === 'slow') {
      j.sfx('whoosh', { pitch: 0.6 }); j.shake(4, 1);
      say(j, d.x, d.y - 130, 'TSSSS…', { color: '#ff4d6d', size: 54, life: 1, rise: 40 });
      if (d.id === me) j.vibrate([60, 40, 60, 40, 60, 40, 60]);
    }
    // BOEM: de teksten komen NA elkaar (0 / 0,4 / 0,85 / 1,3 s), elk op een eigen hoogte
    if (name === 'boem') {
      const f = FILL[d.filling] || FILL.taart, by = bandY(d.y);
      j.sfx('boom'); j.sfx('splat', { vol: 0.6 }); j.shake(d.out ? 30 : 20, 0.7); j.flash('#fff', 0.3); j.confetti();
      j.particles(d.x, d.y, { count: 18, colors: ['#ff9f1c', '#ffd166', '#ff4d6d', '#fff'], speed: 700, size: 16, life: 0.5 });
      j.particles(d.x, d.y, { count: 8, emoji: '🥟', speed: 500, size: 11, gravity: 600, life: 0.9 });
      if (d.id === me) j.vibrate(300);
      say(j, d.x, by - 85, d.out ? 'AUW MIJN KROKET' : 'BOEM!', { color: '#ff9f1c', size: 62, life: 1.0, rise: 50 });
      later(0.4, () => {
        j.sfx(f.s, { vol: 0.7 });
        j.particles(d.x, d.y, { count: 12, emoji: f.e, speed: 650, size: 18, gravity: 700, life: 1.3, angle: -Math.PI / 2, spread: Math.PI * 1.2 });
        say(j, d.x, by + 5, f.t(nm(d.id)), { color: '#fff', size: 44, life: 2.4, rise: 40 });
      });
      if (!d.out) later(0.85, () => {
        const l = lastS?.p?.[d.id]?.lives;
        if (l > 0) say(j, d.x, by + 85, `💔 Nog ${l} ${l === 1 ? 'leven' : 'levens'}`, { color: '#ff8fa3', size: 40, life: 1.4, rise: 30 });
      });
    }
    if (name === 'spook') later(0.85, () => {
      j.sfx('lose', { vol: 0.8 });
      j.particles(d.x, d.y, { count: 10, emoji: '👻', speed: 200, size: 10, gravity: -150, life: 1 });
      say(j, d.x, bandY(d.y) + 85, '👻 SPOOK!', { color: '#cdb4ff', size: 46, life: 1.4, rise: 30 });
    });
    if (name === 'uit' && d.left >= 2) later(1.3, () => {
      const s = seen[d.id], y = s && s.y > CY ? Y0 + 150 : Y1 - 220; // op de andere helft dan de BOEM
      if (d.left === 2) { j.sfx('go'); say(j, CX, y, 'FINALE! Nog 2 🔥', { color: '#ffd166', size: 62, life: 1.8, rise: 40 }); }
      else { j.sfx('pop', { pitch: 0.7 }); say(j, CX, y, `Nog ${d.left}!`, { color: '#fff', size: 62, life: 1.6, rise: 40 }); }
    });

    // 🐔 de kip: iedereen ziet voor wie hij komt; het doelwit trilt en ziet rood
    if (name === 'kip') {
      const mine = d.target === me;
      j.sfx('quack'); later(0.16, () => j.sfx('quack', { pitch: 1.25 }));
      j.particles(d.x, d.y, { count: 12, emoji: '🪶', speed: 320, size: 10, life: 0.9, gravity: 200 });
      if (!d.again) say(j, CX, CY - 150, mine ? '🐔 HIJ KOMT VOOR JOU!' : `🐔 HIJ KOMT VOOR ${nm(d.target).toUpperCase()}!`, { color: mine ? '#ff4d6d' : '#ffd166', size: 62, life: 1.8, rise: 40 });
      else say(j, CX, CY - 150, mine ? '🐔 NU WIL HIJ JOU!' : `🐔 Nieuw doelwit: ${nm(d.target)}!`, { color: mine ? '#ff4d6d' : '#ffd166', size: 48, life: 1.4, rise: 40 });
      if (mine) { j.vibrate([150, 60, 150]); j.flash('rgba(255,30,30,.45)', 0.45); j.shake(8, 0.4); }
    }
    if (name === 'kipgrab') {
      clearPas();
      j.sfx('toet'); j.sfx('quack', { pitch: 0.8 }); j.shake(6, 0.3);
      j.particles(d.x, d.y, { count: 10, emoji: '🪶', speed: 300, size: 10, life: 0.8, gravity: 150 });
      say(j, d.x, d.y - 140, 'KAKEL!', { color: '#ffd166', size: 46, life: 1, rise: 25 });
      later(0.35, () => say(j, d.x, d.y - 80, d.target ? 'GEPAKT! 🎯' : 'Pech, in de weg! 🙃', { color: '#fff', size: 36, life: 1.1, rise: 20 }));
      if (d.id === me) { j.vibrate(120); j.flash('rgba(255,140,40,.3)', 0.25); }
    }
    if (name === 'kipop') {
      clearPas();
      j.sfx('boing', { pitch: 0.7 });
      j.particles(d.kx, d.ky, { count: 10, emoji: '🪶', speed: 250, size: 10, life: 1, gravity: 150 });
      say(j, d.kx, d.ky - 145, 'Pff, ik geef het op 🐔', { color: '#ffd166', size: 36, life: 1.5, rise: 25 });
      trail(j, d.kx, d.ky - 40, d.x, d.y - 60, { colors: ['#ffd166', '#b5651d'], size: 12 });
      const t = seen[d.target];
      if (t && d.target !== d.id) later(0.4, () => say(j, t.x, t.y - 80, 'ONTSNAPT! 😅', { color: '#7dffa8', size: 38, life: 1.2, rise: 20 }));
      if (d.target === me && d.id !== me) later(0.4, () => j.sfx('coin'));
      later(0.6, () => {
        j.sfx('pop', { pitch: 0.8 });
        say(j, d.x, d.y - 100, d.back ? 'TERUG NAAR JOU! 🙃' : 'Alsjeblieft! 🥟', { color: '#fff', size: 38 });
        if (d.id === me) j.vibrate(100);
      });
    }

    // 🍌 bananen
    if (name === 'banaan') {
      j.sfx('pop', { pitch: 1.3, vol: 0.5 });
      later(BANANA_ARM, () => j.particles(d.x, d.y + 22, { count: 6, colors: ['#fff', '#e6d2ae'], speed: 120, size: 10, life: 0.35 }));
    }
    if (name === 'spookbanaan') {
      j.sfx('prrt', { vol: d.id === me ? 0.5 : 0.3, pitch: 1.1 + Math.random() * 0.5 });
      j.particles(d.x, d.y, { count: 8, colors: ['#cdb4ff', '#fff', '#a98bff'], speed: 160, size: 10, life: 0.7 });
      say(j, d.x, d.y - 70, pickBy(['🍌 hihi', '🍌 Oepsie!', '🍌 Voor jou!', '🍌 Kijk uit!'], d.x + d.y), { color: '#cdb4ff', size: 32, life: 1.1, rise: 50 });
    }
    if (name === 'slip') {
      j.sfx('boing', { pitch: 0.9 + Math.random() * 0.3 });
      j.particles(d.x, d.y, { count: 8, emoji: '🍌', speed: 300, size: 10 });
      say(j, d.x, d.y - 70, d.by ? 'SPOOKBANAAN! 👻' : 'UITGEGLEDEN!', { color: d.by ? '#cdb4ff' : '#ffe066', size: 38 });
      if (d.id === me) { j.vibrate(120); j.shake(5, 0.3); }
      if (d.by && d.by === me) j.sfx('coin', { vol: 0.6 });
    }

    // 👻 spoken
    if (name === 'gooi') {
      clearPas();
      j.sfx('whoosh'); j.sfx('toet');
      const a = seen[d.from], g = seen[d.by];
      if (a) trail(j, a.x, a.y - 60, d.x, d.y - 60, { colors: ['#cdb4ff', '#fff', '#ffd166'], size: 13 });
      if (g) j.particles(g.x, g.y, { count: 8, emoji: '👻', speed: 160, size: 9, gravity: -120, life: 0.8 });
      say(j, d.x, d.y - 145, 'SPOOK-GOOI! 👻', { color: '#cdb4ff', size: 46, life: 1.3, rise: 25 });
      later(0.4, () => say(j, d.x, d.y - 85, `${nm(d.to).toUpperCase()} NEE!`, { color: '#fff', size: 40, life: 1.3, rise: 20 }));
      if (d.to === me) { j.vibrate(150); j.flash('rgba(180,140,255,.4)', 0.35); j.shake(6, 0.3); }
      if (d.from === me) j.sfx('coin', { vol: 0.5, pitch: 1.2 });
    }
    if (name === 'weg') {
      j.sfx('whoosh', { pitch: 0.6, vol: 0.6 });
      j.particles(d.x, d.y, { count: 8, emoji: '💨', speed: 200, size: 10, life: 0.7 });
      j.particles(d.x, d.y, { count: 6, emoji: '👻', speed: 150, size: 9, gravity: -150, life: 1 });
      say(j, d.x, d.y - 80, `${nm(d.id)} is even weg 👋`, { color: '#cdb4ff', size: 36, life: 1.8, rise: 40 });
    }
    if (name === 'sudden') {
      j.sfx('go'); j.shake(10, 0.5); j.flash('#ff4d6d', 0.5);
      say(j, CX, CY - 60, 'SUDDEN DEATH!', { color: '#ff4d6d', size: 76, life: 2 });
      later(0.6, () => say(j, CX, CY + 40, 'Elke kroket: 3 tellen! ⚡', { color: '#fff', size: 40, life: 1.8, rise: 30 }));
    }
  },

  // ----- alle apparaten: tekenen -----
  render(c, S, party) {
    if (!S.p) return;
    lastS = S;
    const now = performance.now();
    const me = party.me;
    drawKitchen(c);
    c.textAlign = 'center'; c.textBaseline = 'middle';

    // knop: "Sprint" voor levenden, "👻 Gooi" of "🍌 Leg" voor spoken
    const mineP = S.p[me];
    const act = mineP?.ghost ? ghostAction(S, me) : null;
    let btn = 'Sprint';
    if (mineP?.ghost) btn = act === 'gooi' ? '👻 Gooi' : act === 'banaan' ? '🍌 Leg' : mineP.gb > 0 ? `🍌 ${Math.ceil(mineP.gb)}` : '👻';
    party.setButtonLabel?.(0, btn);

    // eigen status in de tegelrand boven de vloer (spelers komen daar nooit, de kroket zweeft eroverheen)
    if (mineP?.ghost && S.phase !== 'fin') {
      let t;
      if (act === 'gooi') t = '👻 Knop / spatie = kroket GOOIEN! (1×)';
      else if (!mineP.threw && lateForThrow(S)) t = act === 'banaan' ? 'Te laat om te gooien! 👻 Wel een 🍌' : 'Te laat om te gooien! 👻';
      else if (act === 'banaan') t = '👻 Knop / spatie = 🍌 neerleggen!';
      else t = `👻 Volgende 🍌 over ${Math.ceil(mineP.gb)} s`;
      const go = act === 'gooi' && Math.floor(now / 300) % 2;
      tag(c, t, CX, BAND_Y, 34, go ? '#fff' : '#e9e0ff', go ? 'rgba(110,60,200,.92)' : 'rgba(40,20,70,.85)', '#cdb4ff');
    } else if (mineP && mineP.rs > 0) {
      tag(c, 'Even opscharrelen… 🧺', CX, BAND_Y, 34, '#fff', 'rgba(70,40,20,.88)', '#ffd166');
    }

    if (S.phase === 'slow') { c.fillStyle = `rgba(255,40,40,${0.12 + 0.1 * Math.sin(now / 60)})`; c.fillRect(0, 0, W, H); }

    // bananen: vallen eerst (nog niet glad); een spook-banaan heeft een paars rondje in de kleur van het spook
    for (const b of S.bananas) {
      const fall = b.a > 0 ? b.a / BANANA_ARM : 0, drop = fall * fall * 170, sh = 1 - fall * 0.6;
      c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(b.x, b.y + 26, 28 * sh, 10 * sh, 0, 0, TAU); c.fill();
      if (b.g) {
        c.save(); c.translate(b.x, b.y + 6); c.rotate(now / 900);
        c.fillStyle = 'rgba(205,180,255,.35)'; c.strokeStyle = party.player(b.g)?.color || '#a98bff'; c.lineWidth = 5;
        c.setLineDash([12, 10]); c.beginPath(); c.arc(0, 0, 42, 0, TAU); c.fill(); c.stroke(); c.setLineDash([]);
        c.restore();
      }
      c.save(); c.translate(b.x, b.y - drop + Math.sin(now / 250 + b.x) * 4); c.rotate(Math.sin(now / 300 + b.y) * 0.25 + fall * 5);
      c.font = `54px ${EMOJI}`; c.fillStyle = '#000'; c.fillText('🍌', 0, 0); c.restore();
      if (b.g && !fall) { // spookje op een paars rondje, zodat je hem ook op de lichte vloer ziet
        const gy = b.y - 36 + Math.sin(now / 300 + b.x) * 5;
        c.fillStyle = '#6a4fc8'; c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(b.x + 34, gy, 20, 0, TAU); c.fill(); c.stroke();
        c.font = `28px ${EMOJI}`; c.fillStyle = '#000'; c.fillText('👻', b.x + 34, gy + 1);
      }
    }

    const ratio = clamp(S.fuse / S.fuseMax, 0, 1);
    const ck = S.chicken, hunt = ck?.target;
    const kp = ck ? party.smooth('kip', ck.x, ck.y) : null;
    // kip-doellijn: rode streepjes van de kip naar zijn doelwit
    if (kp && seen[hunt]) {
      const t = seen[hunt];
      c.strokeStyle = 'rgba(255,45,85,.55)'; c.lineWidth = 6; c.setLineDash([18, 14]); c.lineDashOffset = -now / 25;
      c.beginPath(); c.moveTo(kp.x, kp.y); c.lineTo(t.x, t.y); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0;
    }

    // 1. lichamen: eerst spoken, dan levenden
    const entries = Object.entries(S.p).sort((a, b) => (b[1].ghost ? 1 : 0) - (a[1].ghost ? 1 : 0));
    for (const [id, p] of entries) {
      const pos = party.smooth(id, p.x, p.y);
      if (p.rs > 0) { delete seen[id]; continue; }
      const pr = party.player(id), mine = id === me, isHolder = id === S.holder;
      let px = pos.x, py = pos.y;
      if (isHolder && S.phase === 'slow') { px += Math.sin(now / 15) * 5; py += Math.cos(now / 17) * 5; }
      seen[id] = { x: px, y: py };
      const ph = (id.charCodeAt(0) + id.length * 7) % 10;
      c.globalAlpha = p.ghost ? 0.45 : (p.shield > 0 && Math.floor(now / 100) % 2 ? 0.45 : 1);
      c.fillStyle = 'rgba(0,0,0,.18)';
      c.beginPath(); c.ellipse(px, py + R * 0.8, R * (p.ghost ? 0.6 : 0.9), R * (p.ghost ? 0.22 : 0.35), 0, 0, TAU); c.fill();
      // VEILIG: groene bubbel (knippert vlak voor het einde)
      if (!p.ghost && p.safe > 0 && !isHolder) {
        const a = c.globalAlpha;
        c.globalAlpha = a * (p.safe < 0.5 && Math.floor(now / 90) % 2 ? 0.35 : 1);
        c.fillStyle = 'rgba(120,230,160,.3)'; c.strokeStyle = '#2b9348'; c.lineWidth = 5;
        c.beginPath(); c.arc(px, py, R + 13, 0, TAU); c.fill(); c.stroke();
        c.globalAlpha = a;
      }
      if (isHolder) { // gloeiende ring: wie heeft hem
        c.strokeStyle = `hsl(${50 - 50 * (1 - ratio)},100%,55%)`; c.lineWidth = 10 + Math.sin(now / (S.phase === 'slow' ? 40 : 150)) * 4;
        c.beginPath(); c.arc(px, py, R + 12, 0, TAU); c.stroke();
      }
      if (id === hunt) { // rood vizier: hier gaat de kip heen
        c.save(); c.translate(px, py); c.rotate(now / 500);
        c.strokeStyle = '#ff2d55'; c.lineWidth = 6;
        c.beginPath(); c.arc(0, 0, R + 18, 0, TAU);
        for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; c.moveTo(Math.cos(a) * (R + 6), Math.sin(a) * (R + 6)); c.lineTo(Math.cos(a) * (R + 32), Math.sin(a) * (R + 32)); }
        c.stroke(); c.restore();
      }
      // lijf: wiebelt (de houder zenuwachtig snel), spoken zweven
      const wob = p.ghost ? Math.sin(now / 400 + ph) * 8 : Math.sin(now / (isHolder ? 90 : 220) + ph) * (isHolder ? 0.07 : 0.035);
      const sx = p.ghost ? 1 : 1 + wob, sy = p.ghost ? 1 : 1 - wob;
      c.save(); c.translate(px, py + (p.ghost ? wob : 0)); c.scale(sx, sy);
      c.fillStyle = pr?.color || '#fff';
      c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(-R * 0.3, -R * 0.4, R * 0.4, R * 0.2, -0.5, 0, TAU); c.fill();
      c.beginPath(); c.arc(0, 0, R, 0, TAU);
      c.lineWidth = mine ? 9 : 5; c.strokeStyle = mine ? '#fff' : 'rgba(0,0,0,.4)'; c.stroke();
      c.restore();
      c.save(); c.translate(px, py + (p.ghost ? wob : 0));
      if (p.slip > 0) c.rotate(now / 80);
      c.font = `46px ${EMOJI}`; c.fillStyle = '#000';
      c.fillText(p.ghost ? '👻' : pr?.emoji || '🙂', 0, 3);
      c.restore();
      // sprint-indicator bij jezelf
      if (mine && !p.ghost && p.cd > 0) {
        c.globalAlpha = 0.9; c.strokeStyle = '#2b9348'; c.lineWidth = 6;
        c.beginPath(); c.arc(px, py, R + 22, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p.cd / SPRINT_CD)); c.stroke();
      }
      c.globalAlpha = 1;
    }

    // 2. namen, hartjes, VEILIG-bordje, JIJ en 🎯 (boven op alle lijven, zodat je ze altijd kunt lezen)
    const nameSize = Math.round(clamp(12.5 / (party.screen?.scale || 0.4), 32, 40));
    let bomb = null;
    const labels = entries.filter(([id]) => id !== me).concat(entries.filter(([id]) => id === me)); // jouw naam bovenop
    for (const [id, p] of labels) {
      const s = seen[id];
      if (!s || p.rs > 0) continue;
      const px = s.x, py = s.y;
      const pr = party.player(id), mine = id === me, isHolder = id === S.holder;
      const hearts = S.ml > 1 && !p.ghost ? '❤️'.repeat(Math.max(0, p.lives)) : '';
      const heartsBelow = isHolder && hearts;
      // te dicht bij de ondermuur: dan komt de naam boven het hoofd
      const low = py + R + nameSize * 1.3 + (heartsBelow ? 34 : 0) > H - 8;
      let up = py - R - 8; // alles boven het hoofd stapelen we van onder naar boven
      const stack = (h) => { const y = up - h / 2; up -= h + 4; return y; };
      const label = (mine ? '▲ ' : '') + (pr?.name || '');
      const ns = p.ghost && !mine ? Math.round(nameSize * 0.8) : nameSize; // spoken zijn minder belangrijk
      c.font = `700 ${ns}px ${FONT}`;
      const hw = c.measureText(label).width / 2 + 6;
      const lx = clamp(px, hw + 16, W - hw - 16);
      const ly = low ? stack(ns + 2) : py + R + ns * 0.72;
      c.globalAlpha = p.ghost ? 0.75 : 1;
      c.lineWidth = ns * 0.22; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.72)';
      c.fillStyle = p.ghost ? '#d9ccff' : mine ? '#ffe066' : '#fff';
      c.strokeText(label, lx, ly); c.fillText(label, lx, ly);
      c.globalAlpha = 1;
      if (isHolder) { // de kroket: zwelt op en wordt rood; valt even op zijn plek bij een nieuwe houder
        const sz = 56 * (1 + 0.6 * (1 - ratio)) * (S.phase === 'slow' ? 1 + Math.sin(now / 40) * 0.1 : 1);
        const drop = p.lock > 0 ? (p.lock / LOCK) ** 2 * 70 : 0;
        bomb = { x: clamp(px, sz * 0.65, W - sz * 0.65), y: stack(sz * 0.85) + sz * 0.08 - drop, sz }; // ruimte voor lont en vonkje
      }
      if (hearts) {
        c.font = `30px ${EMOJI}`; c.fillStyle = '#000';
        c.fillText(hearts, clamp(px, 60, W - 60), heartsBelow && !low ? ly + nameSize * 0.5 + 20 : stack(32));
      }
      if (!p.ghost && p.safe > 0 && !isHolder) drawSafe(c, px, stack(46), p.safe, now);
      if (mine && !p.ghost && S.elapsed < 5 && S.phase !== 'fin') {
        const y = Math.max(HUD_H + 28, stack(44) - Math.abs(Math.sin(now / 160)) * 10);
        c.font = `700 36px ${FONT}`; c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.75)'; c.fillStyle = '#ffe066';
        c.strokeText('▼ JIJ', clamp(px, 70, W - 70), y); c.fillText('▼ JIJ', clamp(px, 70, W - 70), y);
      }
      if (id === hunt) {
        const y = Math.max(HUD_H + 32, stack(56) - Math.abs(Math.sin(now / 150)) * 12);
        c.font = `56px ${EMOJI}`; c.fillStyle = '#000'; c.fillText('🎯', clamp(px, 40, W - 40), y);
      }
    }

    // 3. de kip: fladdert eerst op de plek (met een ❗), rent dan kakelend naar zijn doelwit
    if (kp) {
      const wind = ck.age < CHICKEN_WINDUP;
      const kb = wind ? Math.abs(Math.sin(now / 45)) * 24 : Math.abs(Math.sin(now / 90)) * 14;
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(kp.x, kp.y + 42, 40 - kb, 13, 0, 0, TAU); c.fill();
      c.save(); c.translate(kp.x, kp.y - kb); c.rotate(Math.sin(now / (wind ? 35 : 110)) * (wind ? 0.3 : 0.12));
      c.font = `84px ${EMOJI}`; c.fillStyle = '#000'; c.fillText('🐔', 0, 0); c.restore();
      drawBomb(c, kp.x + 38, kp.y - 52 - kb, 50, ratio, now, false);
      if (wind) { c.font = `48px ${EMOJI}`; c.fillText('❗', kp.x - 40, kp.y - 70 - kb); }
    }

    // 4. de kroket boven de houder, bovenop alles
    if (bomb) drawBomb(c, bomb.x, bomb.y, bomb.sz, ratio, now, S.phase === 'slow');

    // 5. bovenbalk: hoeveel er nog over zijn, wie heeft hem en de lont
    c.fillStyle = 'rgba(40,24,12,.95)'; c.fillRect(0, 0, W, HUD_H);
    c.fillStyle = '#ffd166'; c.fillRect(0, HUD_H - 4, W, 4);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const kipMe = hunt === me;
    let line = '';
    if (S.phase === 'intro') line = 'Kroket in aantocht… 🥟';
    else if (S.phase === 'pause') line = `Volgende kroket over ${Math.max(1, Math.ceil(S.pause))}… 🥟`;
    else if (S.phase === 'fin') line = 'En dat was het! 🥟';
    else if (ck) line = kipMe ? '🐔 DE KIP WIL JOU! Rennen!' : `🐔 De kip zoekt ${nameOf(party, hunt)}!`;
    else if (S.holder === me) line = 'JIJ HEBT HEM! Geef door! 🥟';
    else if (S.holder) line = `🥟 ${nameOf(party, S.holder)} heeft hem!`;
    let fs = 44;
    c.font = `700 ${fs}px ${FONT}`;
    const lw = c.measureText(line).width, maxW = W - 440;
    if (lw > maxW) { fs = Math.floor((fs * maxW) / lw); c.font = `700 ${fs}px ${FONT}`; }
    c.fillStyle = (S.holder === me || kipMe) && Math.floor(now / 200) % 2 ? '#ff6b6b' : '#fff';
    c.fillText(line, CX, 36);
    c.textAlign = 'left'; c.font = `700 34px ${FONT}`; c.fillStyle = '#ffd166';
    c.fillText(`👥 ${living(S).length}`, 22, 36);
    if (S.sd) { c.font = `700 28px ${FONT}`; c.fillStyle = '#ff4d6d'; c.textAlign = 'right'; c.fillText('SUDDEN DEATH', W - 20, 36); }
    c.textAlign = 'center';
    // lontbalk
    if (S.phase === 'play' || S.phase === 'slow') {
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.roundRect(60, 68, W - 120, 26, 13); c.fill();
      if (ratio > 0) { c.fillStyle = `hsl(${50 * ratio},100%,55%)`; c.beginPath(); c.roundRect(60, 68, Math.max(26, (W - 120) * ratio), 26, 13); c.fill(); }
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.roundRect(60, 68, W - 120, 26, 13); c.stroke();
      c.font = `${34 + (ratio < 0.3 ? Math.sin(now / 60) * 6 : 0)}px ${EMOJI}`; c.fillStyle = '#000'; c.fillText('💥', 60 + (W - 120) * ratio, 82);
    }

    // 6. de kip moet JOU hebben: knipperende rode rand om het hele scherm
    if (kipMe) {
      c.strokeStyle = `rgba(255,23,68,${0.6 + 0.3 * Math.sin(now / 90)})`; c.lineWidth = 40;
      c.strokeRect(20, 20, W - 40, H - 40);
    }

    // terug na verbindingsverlies: duidelijk zeggen dat je nu spook bent
    if (mineP?.away && mineP.ghost) {
      if (!awaySince) awaySince = now;
      if (now - awaySince < AWAY_MSG_MS) tag(c, 'Je was even weg: je bent nu een spook 👻', CX, CY, 40, '#fff', 'rgba(30,18,50,.9)', '#cdb4ff');
    } else awaySince = 0;
  },
});

// ----- keuken: geruite vloer, metrotegels boven de vloer en een houten rand -----
function drawKitchen(c) {
  c.fillStyle = '#f2e6cf'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#e6d2ae';
  for (let y = 2; y < H / 100; y++) for (let x = 0; x < W / 100; x++) if ((x + y) % 2) c.fillRect(x * 100, y * 100, 100, 100);
  // metrotegels (een paar net iets donkerder), met voegen
  const TH = 35, TW = 80;
  c.fillStyle = '#e4eff1'; c.fillRect(0, HUD_H, W, WALL_Y - HUD_H);
  c.fillStyle = '#d4e3e7';
  for (let r = 0; r * TH < WALL_Y - HUD_H; r++) {
    const off = r % 2 ? TW / 2 : 0;
    for (let i = -1; i * TW + off < W; i++) if ((i * 7 + r * 3 + 21) % 5 === 0) c.fillRect(i * TW + off, HUD_H + r * TH, TW, TH);
  }
  c.strokeStyle = 'rgba(110,140,150,.45)'; c.lineWidth = 3; c.beginPath();
  for (let r = 0; r * TH < WALL_Y - HUD_H; r++) {
    const y = HUD_H + r * TH, off = r % 2 ? TW / 2 : 0;
    c.moveTo(0, y); c.lineTo(W, y);
    for (let x = off; x <= W; x += TW) { c.moveTo(x, y); c.lineTo(x, Math.min(y + TH, WALL_Y)); }
  }
  c.stroke();
  c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(0, HUD_H, W, 10); // schaduw onder de bovenbalk
  // een zoutvaatje en een lepel op de rand (rustig, in de hoeken)
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000';
  c.font = `44px ${EMOJI}`; c.fillText('🧂', 54, WALL_Y - 34); c.fillText('🥄', W - 56, WALL_Y - 34);
  // houten rand om de vloer
  c.fillStyle = '#c8915a'; c.fillRect(0, WALL_Y - 8, W, 8);
  c.lineWidth = 20; c.strokeStyle = '#5a3720'; c.strokeRect(10, WALL_Y + 10, W - 20, H - WALL_Y - 20);
  c.lineWidth = 4; c.strokeStyle = '#a8703f'; c.strokeRect(22, WALL_Y + 22, W - 44, H - WALL_Y - 44);
}

// ----- tekstbordje met afgeronde hoeken (eigen status, "Je was even weg") -----
function tag(c, text, x, y, size, fg, bg, border) {
  c.font = `700 ${size}px ${FONT}`;
  let tw = c.measureText(text).width;
  if (tw > W - 100) { size = (size * (W - 100)) / tw; c.font = `700 ${size}px ${FONT}`; tw = W - 100; }
  const pw = tw + size * 1.3, ph = size * 1.55;
  c.fillStyle = bg; c.strokeStyle = border; c.lineWidth = 4;
  c.beginPath(); c.roundRect(x - pw / 2, y - ph / 2, pw, ph, ph / 2); c.fill(); c.stroke();
  c.fillStyle = fg; c.fillText(text, x, y + size * 0.04);
}

// ----- VEILIG-bordje: springt erin, balkje loopt leeg, knippert vlak voor het einde -----
function drawSafe(c, x, y, safe, now) {
  const age = SAFE_T - safe;
  const pop = age < 0.15 ? 0.6 + (age / 0.15) * 0.5 : age < 0.3 ? 1.1 - ((age - 0.15) / 0.15) * 0.1 : 1;
  c.save();
  c.font = `700 28px ${FONT}`;
  const t = '🛡️ VEILIG', w = c.measureText(t).width + 32;
  c.translate(clamp(x, w / 2 + 14, W - w / 2 - 14), Math.max(HUD_H + 26, y)); c.scale(pop, pop);
  c.globalAlpha = safe < 0.5 && Math.floor(now / 90) % 2 ? 0.45 : 1;
  c.fillStyle = '#2b9348'; c.strokeStyle = '#fff'; c.lineWidth = 4;
  c.beginPath(); c.roundRect(-w / 2, -23, w, 46, 23); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(-w / 2 + 18, 13, (w - 36) * clamp(safe / SAFE_T, 0, 1), 4);
  c.fillStyle = '#fff'; c.fillText(t, 0, -3);
  c.restore();
}

// ----- kroket-bom tekenen: bruin met paneerkruimels, lont en vonk, wordt rood vlak voor BOEM -----
const CRUMBS = [[-0.55, 0.1], [-0.25, 0.32], [0.15, -0.12], [0.45, 0.22], [0.62, -0.15], [-0.68, -0.22], [0.05, 0.36], [-0.1, -0.3]];
function drawBomb(c, x, y, sz, ratio, now, slow) {
  const r = sz * 0.5, pulse = 1 + (ratio < 0.4 ? Math.sin(now / (30 + 150 * ratio)) * 0.06 : 0);
  c.save(); c.translate(x, y); c.scale(pulse, pulse);
  c.fillStyle = `hsla(${50 * ratio},100%,55%,.35)`; c.beginPath(); c.arc(0, 0, r * 1.25, 0, TAU); c.fill();
  c.rotate(-0.4);
  c.fillStyle = ratio < 0.3 ? '#c0392b' : '#b5651d'; c.strokeStyle = '#3d1f0a'; c.lineWidth = 5;
  c.beginPath(); c.roundRect(-r * 0.95, -r * 0.6, r * 1.9, r * 1.2, r * 0.6); c.fill(); c.stroke();
  c.fillStyle = 'rgba(70,30,5,.45)';
  for (const [cx, cy] of CRUMBS) { c.beginPath(); c.arc(cx * r, cy * r, r * 0.07, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,220,140,.55)'; c.beginPath(); c.roundRect(-r * 0.6, -r * 0.42, r * 0.9, r * 0.22, r * 0.11); c.fill();
  c.restore();
  const fx = x + r * 0.9, fy = y - r * 0.95;
  c.strokeStyle = '#555'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + r * 0.4, y - r * 0.5); c.quadraticCurveTo(x + r * 0.9, y - r * 0.5, fx, fy); c.stroke();
  const fl = 8 + Math.sin(now / 40) * 4 + (slow ? 6 : 0);
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(fx, fy, fl, 0, TAU); c.fill();
  c.fillStyle = '#ff6b00'; c.beginPath(); c.arc(fx, fy, fl * 0.55, 0, TAU); c.fill();
}

// ----- host: ronde afsluiten met winnaar en scores (score = seconden overleefd) -----
function finish(S, party) {
  const winners = living(S).map(([id]) => id);
  const total = Math.round(S.elapsed);
  const scores = {};
  for (const [id, p] of Object.entries(S.p)) scores[id] = p.ghost ? p.out : total;
  const names = winners.map((id) => nameOf(party, id)).join(' & ');
  let text = '';
  const most = Object.entries(S.p).sort((a, b) => b[1].bm - a[1].bm)[0];
  const mx = Math.max(...Object.values(S.p).map((p) => p.held));
  const grabby = Object.entries(S.p).filter(([, p]) => p.held === mx); // kreeg het vaakst een verse kroket
  if (most && most[1].bm >= 2 && !(winners.length === 1 && winners[0] === most[0])) text = `${nameOf(party, most[0])} ontplofte vaker dan een vuurwerkfabriek 🎆`;
  else if (winners.length === 1 && grabby.length === 1 && grabby[0][0] === winners[0] && mx >= 2) text = `${names} heeft de nerveuze handjes van een sloop-aannemer 👑`;
  else if (S.order.length) text = `${nameOf(party, S.order[0])} ontplofte als eerste. Het ging lekker. 💥`;
  else text = 'Niemand ontplofte. Wat een kroketten-vrede. 🥟';
  const win = [`${names} wint! 🥟👑`, `${names} is de koning van de kroketten! 👑`, `${names} wint! Niemand vertrouwde deze kroket 😏`];
  party.end({
    title: winners.length ? pickBy(win, S.elapsed * 10) : 'Niemand over! Gelijkspel 🥟💥',
    text: `${text} ⏱️ Getal = seconden overleefd.`, winners, scores,
  });
}
