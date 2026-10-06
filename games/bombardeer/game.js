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
const LOCK = 0.8;             // nieuwe houder kan even niet tikken
const SAFE_T = 2;             // wie de kroket net doorgaf, is zo lang VEILIG (geen pingpong)
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
const FILL = {
  taart: { e: '🎂', t: (n) => `${n} is nu een taart 🎂` },
  eend: { e: '🦆', t: () => 'Een eend! Zomaar. 🦆' },
  sokken: { e: '🧦', t: () => 'Sokken. Alweer. 🧦' },
  brief: { e: '💌', t: () => 'Brief van oma: "Eet je groenten" 💌' },
  confetti: { e: '🎉', t: () => 'VERRASSING! 🎉' },
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
function pass(S, to, party) {
  const from = S.holder;
  if (from && S.p[from] && from !== to) S.p[from].safe = SAFE_T;
  S.holder = to;
  S.p[to].lock = LOCK;
  S.p[to].safe = 0;
  party.emit('pas', { x: S.p[to].x, y: S.p[to].y, from, to });
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
  p.held++; p.lock = LOCK; p.safe = 0;
  S.holder = id;
  startFuse(S);
  party.emit('bom', { x: p.x, y: p.y, id });
}

// Nieuwe bom: valt op de speler die hem het minst vaak heeft gehad.
function giveBomb(S, party) {
  const cand = playable(S);
  if (!cand.length) return;
  const min = Math.min(...cand.map(([, p]) => p.held));
  newBomb(S, pick(cand.filter(([, q]) => q.held === min))[0], party);
}

// Ronde loopt af (na een korte pauze, zodat de BOEM te zien is).
function toFin(S, t) {
  if (S.phase === 'fin') return;
  S.phase = 'fin'; S.pause = t; S.holder = null; S.chicken = null;
}

// Speler wordt spook (na BOEM of na wegvallen).
function makeGhost(S, p) {
  p.ghost = true; p.out = Math.round(S.elapsed); p.rs = 0; p.safe = 0; p.slip = 0; p.gb = GHOST_BANANA_START;
}

// BOEM: de houder verliest een leven.
function boom(S, party) {
  const id = S.holder, p = S.p[id];
  S.holder = null;
  if (!p || p.ghost) { S.phase = 'pause'; S.pause = PAUSE; return; }
  p.lives--; p.bm++; S.booms++;
  const filling = S.filling;
  S.filling = pick(FILLS);
  const out = p.lives <= 0;
  party.emit('boem', { x: p.x, y: p.y, id, filling, out });
  if (out) {
    makeGhost(S, p); S.order.push(id);
    party.emit('spook', { x: p.x, y: p.y, id });
    party.emit('uit', { id, left: living(S).length });
  } else { p.rs = RESPAWN; }
  if (living(S).length <= 1) toFin(S, 2.5);
  else { S.phase = 'pause'; S.pause = PAUSE; }
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
  if (!to) { S.phase = 'pause'; S.pause = PAUSE; return; }
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
        sprint: 0, cd: 0, lock: 0, safe: 0, shield: 0, slip: 0, sx: 0, sy: 0,
        ghost: false, threw: false, gb: 0, away: 0, held: 0, rs: 0, bm: 0, out: 0,
      };
    });
    return {
      p, ml: lives, small: players.length <= SMALL_N, holder: null, fuse: 0, fuseMax: 1, ckAt: 0, chicken: null, bananas: [],
      phase: 'intro', pause: INTRO, boomT: 0, booms: 0, filling: pick(FILLS), bananaT: BANANA_EVERY,
      elapsed: 0, order: [], tk: -1, sd: false,
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
      p.gb = Math.max(0, p.gb - dt);
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
        if (inp.pressed?.[0] && p.cd <= 0 && m > 0.2) { p.sprint = SPRINT_T; p.cd = SPRINT_CD; party.emit('sprint', { x: p.x, y: p.y }); }
        const sp = (id === S.holder ? HOLD_SPEED : SPEED) * (p.sprint > 0 ? SPRINT_MUL : 1);
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
      else { S.phase = 'pause'; S.pause = PAUSE; }
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
      if (best) pass(S, best, party);
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
    if (S.holder === id) {
      S.holder = null;
      if (S.phase === 'play' || S.phase === 'slow') {
        const c = playable(S);
        if (c.length) newBomb(S, pick(c)[0], party);
        else { S.phase = 'pause'; S.pause = PAUSE; }
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
    let x = 0, y = 0, sprint = false, flee = false;
    const hold = S.holder === id;
    if (hold) {
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
      // bananen ontwijken
      for (const b of S.bananas) { const d = dist(me, b); if (d < 130 && d > 0) { x += ((me.x - b.x) / d) * 1.5; y += ((me.y - b.y) / d) * 1.5; } }
    }
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
    const n = Math.hypot(rx, ry) || 1;
    return { x: rx / n, y: ry / n, buttons: [sprint && me.cd <= 0] };
  },

  // ----- alle apparaten: effecten en geluid -----
  onEvent(name, d, party) {
    const j = party.juice;
    const nm = (id) => nameOf(party, id);
    if (name === 'bom') {
      j.sfx('pop'); j.particles(d.x, d.y - 40, { count: 10, emoji: '🥟', speed: 250, size: 34 });
      j.floatText(d.x, d.y - 90, 'Kroket in aantocht! 🥟', { color: '#ffd166', size: 40 });
      if (d.id === party.me) j.vibrate(100);
    }
    if (name === 'pas') {
      j.sfx('pop', { pitch: 0.9 + Math.random() * 0.5 }); j.shake(3, 0.15); j.particles(d.x, d.y, { count: 8, colors: ['#ffd166', '#fff'], speed: 250 });
      j.floatText(d.x, d.y - 80, pick(['HIER, JIJ!', 'NIET MIJ!', 'Oeps 🙃']), { color: '#fff', size: 36 });
      if (d.to === party.me) j.vibrate(80);
    }
    if (name === 'sprint') { j.sfx('whoosh', { vol: 0.5, pitch: 1 + Math.random() * 0.3 }); j.particles(d.x, d.y, { count: 6, color: '#fff', speed: 200 }); }
    if (name === 'tik') {
      const f = d.slow ? 1.9 : 1 + (1 - Math.min(d.fuse, 4) / 4) * 0.8;
      j.sfx('tick', { pitch: f, vol: d.fuse > 6 && !d.slow ? 0.4 : 0.8 });
    }
    if (name === 'slow') { j.sfx('whoosh'); j.shake(4, 1); j.floatText(d.x, d.y - 100, 'TSSSS…', { color: '#ff6b6b', size: 48, life: 1 }); }
    if (name === 'boem') {
      const f = FILL[d.filling] || FILL.taart;
      j.sfx('boom'); j.sfx('splat', { vol: 0.6 }); j.shake(d.out ? 30 : 20, 0.7); j.flash('#fff', 0.3); j.confetti();
      j.particles(d.x, d.y, { count: 14, emoji: f.e, speed: 600, size: 44, gravity: 500 });
      j.particles(d.x, d.y, { count: 10, emoji: '🥟', speed: 450, size: 34, gravity: 500 });
      j.floatText(d.x, d.y - 70, d.out ? 'AUW MIJN KROKET' : 'BOEM!', { color: '#ff9f1c', size: 52 });
      j.floatText(d.x, d.y - 130, f.t(nm(d.id)), { color: '#fff', size: 32, life: 2 });
      if (d.id === party.me) j.vibrate(300);
    }
    if (name === 'kip') {
      j.sfx('quack'); j.particles(d.x, d.y, { count: 10, emoji: '🪶', speed: 300 });
      if (!d.again) j.floatText(CX, CY, 'HIJ KOMT! 🐔', { color: '#ffd166', size: 64, life: 1.5 });
      if (d.target === party.me) j.vibrate(150);
    }
    if (name === 'kipgrab') { j.sfx('toet'); j.shake(6, 0.3); j.floatText(d.x, d.y - 80, 'KAKEL!', { color: '#ffd166', size: 44 }); }
    if (name === 'kipop') {
      j.sfx('boing'); j.particles(d.kx, d.ky, { count: 8, emoji: '🪶', speed: 250 });
      j.floatText(d.kx, d.ky - 60, 'Pff, ik geef het op 🐔', { color: '#ffd166', size: 34 });
      j.floatText(d.x, d.y - 90, d.back ? 'TERUG NAAR JOU! 🙃' : 'Alsjeblieft! 🥟', { color: '#fff', size: 36 });
    }
    if (name === 'banaan') j.sfx('pop');
    if (name === 'spookbanaan') {
      j.sfx('pop', { pitch: 0.7 }); j.particles(d.x, d.y, { count: 6, emoji: '👻', speed: 150, size: 26, gravity: -100 });
      j.floatText(d.x, d.y - 50, '🍌 hihi', { color: '#cdb4ff', size: 30 });
    }
    if (name === 'slip') {
      j.sfx('boing'); j.particles(d.x, d.y, { count: 8, emoji: '🍌', speed: 300, size: 30 });
      j.floatText(d.x, d.y - 60, d.by ? 'SPOOKBANAAN!' : 'UITGEGLEDEN!', { color: d.by ? '#cdb4ff' : '#ffe066', size: 36 });
      if (d.id === party.me) j.vibrate(120);
    }
    if (name === 'spook') { j.sfx('lose'); j.particles(d.x, d.y, { count: 10, emoji: '👻', speed: 200, size: 30, gravity: -150 }); j.floatText(d.x, d.y - 40, '👻 SPOOK!', { color: '#cdb4ff', size: 44 }); }
    if (name === 'weg') { j.particles(d.x, d.y, { count: 8, emoji: '👻', speed: 150, size: 28, gravity: -150 }); j.floatText(d.x, d.y - 60, `${nm(d.id)} is weg 👋`, { color: '#cdb4ff', size: 36 }); }
    if (name === 'gooi') {
      j.sfx('whoosh'); j.sfx('toet');
      j.floatText(d.x, d.y - 90, 'SPOOK-GOOI!', { color: '#cdb4ff', size: 44 });
      j.floatText(d.x, d.y - 140, `${nm(d.to).toUpperCase()} NEE!`, { color: '#fff', size: 34 });
    }
    if (name === 'uit') j.floatText(CX, CY - 200, `Nog ${d.left}!`, { color: '#fff', size: 56, life: 1.8 });
    if (name === 'sudden') { j.sfx('go'); j.flash('#ff4d6d', 0.5); j.floatText(CX, CY, 'SUDDEN DEATH!', { color: '#ff4d6d', size: 72, life: 2 }); }
  },

  // ----- alle apparaten: tekenen -----
  render(c, S, party) {
    if (!S.p) return;
    const now = performance.now();
    // geruite keukenvloer
    c.fillStyle = '#f2e6cf'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e6d2ae';
    for (let y = 0; y < H / 100; y++) for (let x = 0; x < W / 100; x++) if ((x + y) % 2) c.fillRect(x * 100, y * 100, 100, 100);
    // keukentegels boven de vloer (hier kan de kroket boven je hoofd nog zweven)
    c.fillStyle = '#dfeaec'; c.fillRect(0, HUD_H, W, WALL_Y - HUD_H);
    c.strokeStyle = 'rgba(110,140,150,.35)'; c.lineWidth = 3; c.beginPath();
    for (let x = 0; x <= W; x += 60) { c.moveTo(x, HUD_H); c.lineTo(x, WALL_Y); }
    for (let y = HUD_H + 35; y < WALL_Y; y += 35) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    c.lineWidth = 20; c.strokeStyle = '#5a3720'; c.strokeRect(10, WALL_Y + 10, W - 20, H - WALL_Y - 20);
    c.lineWidth = 4; c.strokeStyle = '#a8703f'; c.strokeRect(22, WALL_Y + 22, W - 44, H - WALL_Y - 44);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    // knop: "Sprint" voor levenden, "👻 Gooi" of "🍌 Leg" voor spoken
    const mineP = S.p[party.me];
    const act = mineP?.ghost ? ghostAction(S, party.me) : null;
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
      c.font = `700 32px ${FONT}`; c.fillStyle = '#cdb4ff'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.7)';
      c.strokeText(t, CX, BAND_Y); c.fillText(t, CX, BAND_Y);
    } else if (mineP && mineP.rs > 0) {
      c.font = `700 36px ${FONT}`; c.fillStyle = '#6b4226'; c.fillText('Even opscharrelen… 🧺', CX, BAND_Y);
    }

    if (S.phase === 'slow') { c.fillStyle = `rgba(255,40,40,${0.12 + 0.1 * Math.sin(now / 60)})`; c.fillRect(0, 0, W, H); }

    // bananen (een vallende banaan is nog niet glad; een spook-banaan heeft een spookje)
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const b of S.bananas) {
      const fall = b.a > 0 ? b.a / BANANA_ARM : 0;
      c.globalAlpha = 1 - fall * 0.5;
      c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(b.x, b.y + 26, 28 * (1 - fall * 0.5), 10, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(b.x, b.y + Math.sin(now / 250 + b.x) * 4 - fall * 60); c.rotate(Math.sin(now / 300 + b.y) * 0.25);
      c.font = `54px ${EMOJI}`; c.fillStyle = '#000'; c.fillText('🍌', 0, 0); c.restore();
      if (b.g) { c.font = `26px ${EMOJI}`; c.fillText('👻', b.x + 26, b.y - 24); }
      c.globalAlpha = 1;
    }

    // spelers: eerst spoken, dan levenden (zodat de bom bovenop komt)
    const entries = Object.entries(S.p).sort((a, b) => (b[1].ghost ? 1 : 0) - (a[1].ghost ? 1 : 0));
    const ratio = clamp(S.fuse / S.fuseMax, 0, 1);
    for (const [id, p] of entries) {
      const pos = party.smooth(id, p.x, p.y);
      if (p.rs > 0) continue;
      const pr = party.player(id);
      const mine = id === party.me;
      const isHolder = id === S.holder;
      c.globalAlpha = p.ghost ? 0.45 : (p.shield > 0 && Math.floor(now / 100) % 2 ? 0.45 : 1);
      let px = pos.x, py = pos.y;
      if (isHolder && S.phase === 'slow') { px += Math.sin(now / 15) * 5; py += Math.cos(now / 17) * 5; }
      c.fillStyle = 'rgba(0,0,0,.18)';
      c.beginPath(); c.ellipse(px, py + R * 0.8, R * 0.9, R * 0.35, 0, 0, Math.PI * 2); c.fill();
      if (isHolder) { // gloeiende ring: wie heeft hem
        c.strokeStyle = `hsl(${50 - 50 * (1 - ratio)},100%,55%)`; c.lineWidth = 10 + Math.sin(now / (S.phase === 'slow' ? 40 : 150)) * 4;
        c.beginPath(); c.arc(px, py, R + 12, 0, Math.PI * 2); c.stroke();
      }
      const ph = (id.charCodeAt(0) + id.length * 7) % 10;
      const wob = p.ghost ? Math.sin(now / 400 + ph) * 8 : Math.sin(now / (isHolder ? 90 : 220) + ph) * (isHolder ? 0.07 : 0.035);
      const sx = p.ghost ? 1 : 1 + wob, sy = p.ghost ? 1 : 1 - wob;
      c.save(); c.translate(px, py + (p.ghost ? wob : 0)); c.scale(sx, sy);
      c.fillStyle = pr?.color || '#fff';
      c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(-R * 0.3, -R * 0.4, R * 0.4, R * 0.2, -0.5, 0, Math.PI * 2); c.fill();
      c.lineWidth = mine ? 9 : 5; c.strokeStyle = mine ? '#fff' : 'rgba(0,0,0,.4)'; c.stroke();
      c.restore();
      c.save(); c.translate(px, py);
      if (p.slip > 0) c.rotate(now / 80);
      c.font = `46px ${EMOJI}`; c.fillStyle = '#000';
      c.fillText(p.ghost ? '👻' : pr?.emoji || '🙂', 0, 3);
      c.restore();
      c.globalAlpha = p.ghost ? 0.7 : 1;
      c.font = `700 28px ${FONT}`; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = mine ? '#ffe066' : '#fff';
      const label = (mine ? '▲ ' : '') + (pr?.name || '');
      c.strokeText(label, px, py + R + 28); c.fillText(label, px, py + R + 28);
      const hearts = S.ml > 1 && !p.ghost;
      if (hearts) { c.font = `26px ${EMOJI}`; c.fillText('❤️'.repeat(Math.max(0, p.lives)), px, isHolder ? py + R + 58 : py - R - 22); }
      // VEILIG-bordje: net doorgegeven, je kunt hem even niet terugkrijgen
      if (!p.ghost && p.safe > 0 && !isHolder) {
        c.globalAlpha = 1;
        const sy2 = py - R - (hearts ? 62 : 26);
        c.font = `700 28px ${FONT}`;
        const tw = c.measureText('VEILIG').width + 26;
        c.fillStyle = 'rgba(255,255,255,.95)'; c.strokeStyle = '#2b9348'; c.lineWidth = 4;
        c.beginPath(); c.roundRect(px - tw / 2, sy2 - 19, tw, 38, 10); c.fill(); c.stroke();
        c.fillStyle = '#2b9348'; c.fillText('VEILIG', px, sy2 + 1);
      }
      // sprint-indicator bij jezelf
      if (mine && !p.ghost && p.cd > 0) {
        c.globalAlpha = 0.9; c.strokeStyle = '#2b9348'; c.lineWidth = 6;
        c.beginPath(); c.arc(px, py, R + 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p.cd / SPRINT_CD)); c.stroke();
      }
      // de kroket zelf vlak boven de houder: zwelt op en wordt rood (blijft onder de bovenbalk)
      if (isHolder) {
        c.globalAlpha = 1;
        const sz = 56 * (1 + 0.6 * (1 - ratio)) * (S.phase === 'slow' ? 1 + Math.sin(now / 40) * 0.1 : 1);
        drawBomb(c, px, py - R - 6 - sz * 0.31, sz, ratio, now, S.phase === 'slow');
      }
      c.globalAlpha = 1;
    }

    // kip
    if (S.chicken) {
      const k = party.smooth('kip', S.chicken.x, S.chicken.y);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(k.x, k.y + 42, 40, 13, 0, 0, Math.PI * 2); c.fill();
      c.font = `80px ${EMOJI}`; c.fillStyle = '#000';
      const kb = Math.abs(Math.sin(now / 90)) * 14;
      c.fillText('🐔', k.x, k.y - kb);
      drawBomb(c, k.x + 36, k.y - 48 - kb, 50, clamp(S.fuse / S.fuseMax, 0, 1), now, false);
    }

    // bovenbalk: wie heeft hem en de lont
    c.fillStyle = 'rgba(40,24,12,.92)'; c.fillRect(0, 0, W, HUD_H);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const kipMe = S.chicken?.target === party.me;
    let line = '';
    if (S.phase === 'intro') line = 'Kroket in aantocht… 🥟';
    else if (S.phase === 'pause') line = 'Volgende kroket! 🥟';
    else if (S.phase === 'fin') line = 'En dat was het! 🥟';
    else if (S.chicken) line = kipMe ? '🐔 DE KIP WIL JOU! Rennen!' : `🐔 De kip zoekt ${nameOf(party, S.chicken.target)}!`;
    else if (S.holder === party.me) line = 'JIJ HEBT HEM! Geef door! 🥟';
    else if (S.holder) line = `🥟 ${nameOf(party, S.holder)} heeft hem!`;
    c.font = `700 40px ${FONT}`;
    c.fillStyle = (S.holder === party.me || kipMe) && Math.floor(now / 200) % 2 ? '#ff6b6b' : '#fff';
    c.fillText(line, CX, 36);
    if (S.sd) { c.font = `700 28px ${FONT}`; c.fillStyle = '#ff4d6d'; c.textAlign = 'right'; c.fillText('SUDDEN DEATH', W - 20, 36); c.textAlign = 'center'; }
    // lontbalk
    if (S.phase === 'play' || S.phase === 'slow') {
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(60, 70, W - 120, 26);
      c.fillStyle = `hsl(${50 * ratio},100%,55%)`; c.fillRect(60, 70, (W - 120) * ratio, 26);
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(60, 70, W - 120, 26);
      c.font = `${34 + (ratio < 0.3 ? Math.sin(now / 60) * 6 : 0)}px ${EMOJI}`; c.fillStyle = '#000'; c.fillText('💥', 60 + (W - 120) * ratio, 84);
    }

    // terug na verbindingsverlies: duidelijk zeggen dat je nu spook bent
    if (mineP?.away && mineP.ghost) {
      if (!awaySince) awaySince = now;
      if (now - awaySince < AWAY_MSG_MS) {
        const t = 'Je was even weg: je bent nu een spook 👻';
        c.font = `700 40px ${FONT}`;
        const tw = c.measureText(t).width + 60;
        c.fillStyle = 'rgba(30,18,50,.88)'; c.strokeStyle = '#cdb4ff'; c.lineWidth = 5;
        c.beginPath(); c.roundRect(CX - tw / 2, CY - 50, tw, 100, 22); c.fill(); c.stroke();
        c.fillStyle = '#fff'; c.fillText(t, CX, CY + 2);
      }
    } else awaySince = 0;
  },
});

// ----- kroket-bom tekenen: bruin met lont en vonk, wordt rood vlak voor BOEM -----
function drawBomb(c, x, y, sz, ratio, now, slow) {
  const r = sz * 0.5, pulse = 1 + (ratio < 0.4 ? Math.sin(now / (30 + 150 * ratio)) * 0.06 : 0);
  c.save(); c.translate(x, y); c.scale(pulse, pulse);
  c.fillStyle = `hsla(${50 * ratio},100%,55%,.35)`; c.beginPath(); c.arc(0, 0, r * 1.25, 0, Math.PI * 2); c.fill();
  c.rotate(-0.4);
  c.fillStyle = ratio < 0.3 ? '#c0392b' : '#b5651d'; c.strokeStyle = '#3d1f0a'; c.lineWidth = 5;
  c.beginPath(); c.roundRect(-r * 0.95, -r * 0.6, r * 1.9, r * 1.2, r * 0.6); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,220,140,.5)'; c.beginPath(); c.roundRect(-r * 0.6, -r * 0.4, r * 0.9, r * 0.25, r * 0.12); c.fill();
  c.restore();
  const fx = x + r * 0.9, fy = y - r * 0.95;
  c.strokeStyle = '#555'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + r * 0.4, y - r * 0.5); c.quadraticCurveTo(x + r * 0.9, y - r * 0.5, fx, fy); c.stroke();
  const fl = 8 + Math.sin(now / 40) * 4 + (slow ? 6 : 0);
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(fx, fy, fl, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ff6b00'; c.beginPath(); c.arc(fx, fy, fl * 0.55, 0, Math.PI * 2); c.fill();
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
  if (most && most[1].bm >= 2 && !(winners.length === 1 && winners[0] === most[0])) text = `${nameOf(party, most[0])} ontplofte vaker dan een vuurwerkfabriek 🎆`;
  else if (S.order.length) text = `${nameOf(party, S.order[0])} ontplofte als eerste. Het ging lekker. 💥`;
  else text = 'Niemand ontplofte. Wat een kroketten-vrede. 🥟';
  party.end({
    title: winners.length ? `${names} wint! 🥟👑` : 'Niemand over! Gelijkspel 🥟💥',
    text: `${text} ⏱️ Getal = seconden overleefd.`, winners, scores,
  });
}
