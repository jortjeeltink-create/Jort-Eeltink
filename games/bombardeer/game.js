// Bombardeer: geef de kroket-bom door voordat hij ontploft! Wie hem vasthoudt bij BOEM ligt eruit.
// Kern + sprint + spook-gooi + slowmotion + kip + banaan.

import { startGame, rand, pick, dist, clamp } from '../../engine/party.js';

const W = 1200, H = 1200;
const R = 40;                 // straal van een speler
const HUD_H = 110;            // bovenbalk (ronde-info), speelveld begint daaronder
const X0 = R, X1 = W - R, Y0 = HUD_H + R, Y1 = H - R;
const CX = W / 2, CY = (HUD_H + H) / 2;
const SPEED = 380, HOLD_SPEED = 410;
const SPRINT_T = 0.35, SPRINT_MUL = 2.4, SPRINT_CD = 2.35;
const GHOST_SPEED = 320;
const TAG_DIST = 90;
const LOCK = 0.8;             // vergrendeling na een overgave (geen pingpong)
const INTRO = 2, PAUSE = 3, SLOW_T = 1.0, RESPAWN = 1.5, SHIELD = 1.5;
const FUSE_BASE = 14, FUSE_SMALL = 18, FUSE_DROP = 1.2, FUSE_MIN = 6, FUSE_SD = 3;
const SUDDEN_AT = 150;        // na zoveel seconden: sudden death
const CHICKEN_SPEED = 300, CHICKEN_T = 3;
const BANANA_EVERY = 7, BANANA_MAX = 2, SLIP_T = 1, SLIP_SPEED = 450;
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

// ----- hulpjes (host) -----
const living = (S) => Object.entries(S.p).filter(([, p]) => !p.ghost);
const playable = (S) => living(S).filter(([, p]) => p.rs <= 0);
const nameOf = (party, id) => party.player(id)?.name || '?';

// Bom gaat van de ene speler naar de andere.
function pass(S, to, party) {
  const from = S.holder;
  if (from && S.p[from]) S.p[from].lock = LOCK;
  S.holder = to;
  S.p[to].lock = LOCK;
  party.emit('pas', { x: S.p[to].x, y: S.p[to].y, from, to });
}

// Nieuwe bom: valt op de speler die hem het minst vaak heeft gehad.
function giveBomb(S, party) {
  const cand = playable(S);
  if (!cand.length) return;
  const min = Math.min(...cand.map(([, p]) => p.held));
  const [id, p] = pick(cand.filter(([, q]) => q.held === min));
  p.held++;
  p.lock = LOCK;
  S.holder = id;
  const base = living(S).length <= 3 ? FUSE_SMALL : FUSE_BASE;
  let f = Math.max(FUSE_MIN, base - FUSE_DROP * S.booms) + rand(-1.5, 1.5);
  if (S.sd) f = FUSE_SD;
  S.fuse = S.fuseMax = f;
  S.ck = false; S.chicken = null; S.phase = 'play'; S.tk = -1;
  party.emit('bom', { x: p.x, y: p.y, id });
}

// Ronde loopt af (na een korte pauze, zodat de BOEM te zien is).
function toFin(S, t) {
  if (S.phase === 'fin') return;
  S.phase = 'fin'; S.pause = t; S.holder = null; S.chicken = null;
}

// BOEM: de houder verliest een leven.
function boom(S, party) {
  const id = S.holder, p = S.p[id];
  S.holder = null;
  if (!p) { S.phase = 'pause'; S.pause = PAUSE; return; }
  p.lives--; p.bm++; S.booms++;
  const filling = S.filling;
  S.filling = pick(FILLS);
  const out = p.lives <= 0;
  party.emit('boem', { x: p.x, y: p.y, id, filling, out });
  if (out) {
    p.ghost = true; p.out = Math.round(S.elapsed); S.order.push(id);
    party.emit('spook', { x: p.x, y: p.y, id });
    party.emit('uit', { id, left: living(S).length });
  } else { p.rs = RESPAWN; }
  if (living(S).length <= 1) toFin(S, 2.5);
  else { S.phase = 'pause'; S.pause = PAUSE; }
}

// Kip: de kroket springt van de houder af en rent naar iemand anders.
function startChicken(S, party) {
  const h = S.p[S.holder];
  const others = playable(S).filter(([id]) => id !== S.holder);
  if (!h || !others.length) return;
  const [tid] = pick(others);
  S.ck = true;
  S.chicken = { x: h.x, y: h.y, t: CHICKEN_T, age: 0, target: tid };
  h.lock = LOCK;
  S.holder = null;
  party.emit('kip', { x: h.x, y: h.y, target: tid });
}

function respawn(p) {
  p.x = CX + rand(-250, 250); p.y = CY + rand(-250, 250);
  p.shield = SHIELD; p.lock = 0;
}

startGame({
  id: 'bombardeer',
  title: 'Bombardeer',
  emoji: '🥟',
  subtitle: 'Geef de kroket door!',
  howTo: [
    'Beweeg met de joystick (of WASD / pijltjes).',
    'Heb jij de kroket 🥟? Ren iemand aan om hem door te geven!',
    'Geen kroket? Rennen! Sprint met de knop (of spatie).',
    'Wie hem vasthoudt bij BOEM, ligt eruit. Laatste over wint!',
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
        sprint: 0, cd: 0, lock: 0, shield: 0, slip: 0, sx: 0, sy: 0,
        ghost: false, threw: false, held: 0, rs: 0, bm: 0, out: 0,
      };
    });
    return {
      p, ml: lives, holder: null, fuse: 0, fuseMax: 1, ck: false, chicken: null, bananas: [],
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
      S.sd = true;
      if (S.fuse > FUSE_SD) { S.fuse = FUSE_SD; S.fuseMax = Math.min(S.fuseMax, FUSE_SD); }
      party.emit('sudden', {});
    }

    // spelers bewegen
    for (const [id, p] of Object.entries(S.p)) {
      p.lock = Math.max(0, p.lock - dt); p.shield = Math.max(0, p.shield - dt);
      p.cd = Math.max(0, p.cd - dt); p.sprint = Math.max(0, p.sprint - dt); p.slip = Math.max(0, p.slip - dt);
      if (p.rs > 0) { p.rs -= dt; if (p.rs <= 0) respawn(p); continue; }
      const inp = inputs[id] || { x: 0, y: 0, pressed: [] };
      let ix = inp.x || 0, iy = inp.y || 0;
      const m = Math.hypot(ix, iy);
      if (m > 1) { ix /= m; iy /= m; }
      if (p.ghost) {
        p.x = clamp(p.x + ix * GHOST_SPEED * dt, X0, X1); p.y = clamp(p.y + iy * GHOST_SPEED * dt, Y0, Y1);
        // spook-gooi: bom springt naar de levende speler het dichtst bij het spook
        if (inp.pressed[0] && !p.threw && S.holder && (S.phase === 'play' || S.phase === 'slow')) {
          const t = playable(S).filter(([oid]) => oid !== S.holder).sort((a, b) => dist(a[1], p) - dist(b[1], p))[0];
          if (t) {
            p.threw = true;
            const from = S.holder;
            pass(S, t[0], party);
            party.emit('gooi', { from, to: t[0], x: t[1].x, y: t[1].y, by: id });
          }
        }
        continue;
      }
      let vx, vy;
      if (p.slip > 0) { vx = p.sx * SLIP_SPEED; vy = p.sy * SLIP_SPEED; }
      else {
        if (inp.pressed[0] && p.cd <= 0 && m > 0.2) { p.sprint = SPRINT_T; p.cd = SPRINT_CD; party.emit('sprint', { x: p.x, y: p.y }); }
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

    // bananen
    if (S.phase !== 'intro') {
      S.bananaT -= dt;
      if (S.bananaT <= 0) {
        S.bananaT = BANANA_EVERY;
        if (S.bananas.length < BANANA_MAX) {
          const b = { x: rand(120, W - 120), y: rand(HUD_H + 120, H - 120) };
          S.bananas.push(b); party.emit('banaan', b);
        }
      }
      for (const [id, p] of playable(S)) {
        if (p.slip > 0) continue;
        const k = S.bananas.findIndex((b) => dist(b, p) < 60);
        if (k < 0) continue;
        const bn = S.bananas.splice(k, 1)[0];
        const others = playable(S).filter(([oid]) => oid !== id);
        let a = rand(Math.PI * 2);
        if (others.length) { const o = pick(others)[1]; a = Math.atan2(o.y - p.y, o.x - p.x); }
        p.slip = SLIP_T; p.sx = Math.cos(a); p.sy = Math.sin(a);
        party.emit('slip', { x: bn.x, y: bn.y, id });
      }
    }

    if (S.phase !== 'play' && S.phase !== 'slow') return;

    // bom zonder houder (bijv. houder is weggegaan): geef hem aan iemand
    if (!S.holder && !S.chicken) {
      const c = playable(S);
      if (c.length) pass(S, pick(c)[0], party);
    }

    // lont
    S.fuse = Math.max(0, S.fuse - dt);
    const ratio = S.fuse / S.fuseMax;
    if (S.phase === 'play' && S.holder && !S.ck && S.fuseMax >= 8 && ratio < 0.7 && ratio > 0.4) startChicken(S, party);

    // kip
    const ch = S.chicken;
    if (ch) {
      ch.age += dt; ch.t -= dt;
      let tg = S.p[ch.target];
      if (!tg || tg.ghost || tg.rs > 0) {
        const c = playable(S);
        if (!c.length) { S.chicken = null; }
        else { ch.target = pick(c)[0]; tg = S.p[ch.target]; }
      }
      if (S.chicken && tg) {
        const d = dist(ch, tg) || 1;
        ch.x += ((tg.x - ch.x) / d) * CHICKEN_SPEED * dt; ch.y += ((tg.y - ch.y) / d) * CHICKEN_SPEED * dt;
        let hit = null;
        if (ch.age > 0.5) hit = playable(S).find(([, q]) => dist(q, ch) < 80);
        if (hit) { S.chicken = null; S.holder = null; pass(S, hit[0], party); party.emit('kipgrab', { x: hit[1].x, y: hit[1].y, id: hit[0] }); }
        else if (ch.t <= 0 || S.fuse <= 0) { S.chicken = null; S.holder = null; pass(S, ch.target, party); party.emit('kipgrab', { x: tg.x, y: tg.y, id: ch.target }); }
      }
      if (S.chicken) return;
    }

    // tikken: de houder rent iemand aan
    const h = S.holder && S.p[S.holder];
    if (h && !h.ghost && h.rs <= 0 && h.lock <= 0) {
      let best = null, bd = TAG_DIST;
      for (const [id, q] of playable(S)) {
        if (id === S.holder || q.lock > 0 || q.shield > 0) continue;
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

  // ----- host: speler weg: bom wordt later automatisch doorgegeven -----
  onLeave(S, id) {
    delete S.p[id];
    if (S.holder === id) S.holder = null;
    S.order = S.order.filter((o) => o !== id);
  },

  // ----- host: wat doen bots? (alleen de state, nooit de knop echt "indrukken" nodig: edge komt uit buttons) -----
  bot(S, id, party) {
    const me = S.p[id];
    if (!me || me.rs > 0) return {};
    const t = party.time;
    let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 1000;
    // spook: zweven en één keer gooien als de lont bijna op is
    if (me.ghost) {
      const a = t * 0.5 + h;
      return { x: Math.cos(a), y: Math.sin(a), buttons: [!me.threw && !!S.holder && (S.phase === 'slow' || (S.phase === 'play' && S.fuse < 4))] };
    }
    const others = Object.entries(S.p).filter(([oid, q]) => oid !== id && !q.ghost && q.rs <= 0);
    const sway = Math.sin(t * 1.4 + h) * 0.4;
    let x = 0, y = 0, sprint = false;
    const hold = S.holder === id;
    if (hold) {
      let tg = null, bd = Infinity;
      for (const [, q] of others) {
        const d = dist(me, q) + (q.lock > 0 || q.shield > 0 ? 300 : 0);
        if (d < bd) { bd = d; tg = q; }
      }
      if (tg) { x = tg.x - me.x; y = tg.y - me.y; sprint = dist(me, tg) < 170 && Math.random() < 0.15; }
    } else {
      const src = S.holder && S.p[S.holder] && S.holder !== id ? S.p[S.holder] : S.chicken;
      if (src) {
        const d = dist(me, src) || 1;
        x = (me.x - src.x) / d; y = (me.y - src.y) / d;
        sprint = d < 140 && Math.random() < 0.15;
      }
      if (S.chicken && src !== S.chicken && dist(me, S.chicken) < 250) { x += (me.x - S.chicken.x) / 200; y += (me.y - S.chicken.y) / 200; }
      // bananen ontwijken
      for (const b of S.bananas) { const d = dist(me, b); if (d < 130 && d > 0) { x += ((me.x - b.x) / d) * 1.5; y += ((me.y - b.y) / d) * 1.5; } }
    }
    // muren ontwijken en naar het midden hoeken uit
    const mm = 130, push = 1.6;
    if (me.x < X0 + mm) x += push; if (me.x > X1 - mm) x -= push;
    if (me.y < Y0 + mm) y += push; if (me.y > Y1 - mm) y -= push;
    if (!hold) { x += (CX - me.x) / 1200; y += (CY - me.y) / 1200; }
    // lichte zwenk zodat bots niet voorspelbaar zijn
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
      j.floatText(CX, CY, 'HIJ KOMT! 🐔', { color: '#ffd166', size: 64, life: 1.5 });
    }
    if (name === 'kipgrab') { j.sfx('toet'); j.shake(6, 0.3); j.floatText(d.x, d.y - 80, 'KAKEL!', { color: '#ffd166', size: 44 }); }
    if (name === 'banaan') j.sfx('pop');
    if (name === 'slip') {
      j.sfx('boing'); j.particles(d.x, d.y, { count: 8, emoji: '🍌', speed: 300, size: 30 });
      j.floatText(d.x, d.y - 60, 'UITGEGLEDEN!', { color: '#ffe066', size: 36 });
      if (d.id === party.me) j.vibrate(120);
    }
    if (name === 'spook') { j.sfx('lose'); j.particles(d.x, d.y, { count: 10, emoji: '👻', speed: 200, size: 30, gravity: -150 }); j.floatText(d.x, d.y - 40, '👻 SPOOK!', { color: '#cdb4ff', size: 44 }); }
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
    c.lineWidth = 20; c.strokeStyle = '#5a3720'; c.strokeRect(10, HUD_H + 10, W - 20, H - HUD_H - 20);
    c.lineWidth = 4; c.strokeStyle = '#a8703f'; c.strokeRect(22, HUD_H + 22, W - 44, H - HUD_H - 44);
    if (S.phase === 'slow') { c.fillStyle = `rgba(255,40,40,${0.12 + 0.1 * Math.sin(now / 60)})`; c.fillRect(0, 0, W, H); }

    // bananen
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `54px ${EMOJI}`;
    for (const b of S.bananas) {
      c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(b.x, b.y + 26, 28, 10, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(b.x, b.y + Math.sin(now / 250 + b.x) * 4); c.rotate(Math.sin(now / 300 + b.y) * 0.25);
      c.fillStyle = '#000'; c.fillText('🍌', 0, 0); c.restore();
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
      if (S.ml > 1 && !p.ghost) { c.font = `26px ${EMOJI}`; c.fillText('❤️'.repeat(Math.max(0, p.lives)), px, isHolder ? py + R + 58 : py - R - 22); }
      // sprint-indicator bij jezelf
      if (mine && !p.ghost && p.cd > 0) {
        c.globalAlpha = 0.9; c.strokeStyle = '#2b9348'; c.lineWidth = 6;
        c.beginPath(); c.arc(px, py, R + 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p.cd / SPRINT_CD)); c.stroke();
      }
      // de kroket zelf boven de houder: zwelt op en wordt rood
      if (isHolder) {
        c.globalAlpha = 1;
        const sz = 56 * (1 + 0.6 * (1 - ratio)) * (S.phase === 'slow' ? 1 + Math.sin(now / 40) * 0.1 : 1);
        const by = py - R - 62 - (sz - 56) / 2;
        drawBomb(c, px, by, sz, ratio, now, S.phase === 'slow');
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
    const mineP = S.p[party.me];
    let line = '';
    if (S.phase === 'intro') line = 'Kroket in aantocht… 🥟';
    else if (S.phase === 'pause') line = 'Volgende kroket! 🥟';
    else if (S.phase === 'fin') line = 'En dat was het! 🥟';
    else if (S.chicken) line = '🐔 De kip heeft hem!';
    else if (S.holder === party.me) line = 'JIJ HEBT HEM! Geef door! 🥟';
    else if (S.holder) line = `🥟 ${nameOf(party, S.holder)} heeft hem!`;
    c.font = `700 40px ${FONT}`;
    c.fillStyle = S.holder === party.me && Math.floor(now / 200) % 2 ? '#ff6b6b' : '#fff';
    c.fillText(line, CX, 36);
    if (S.sd) { c.font = `700 28px ${FONT}`; c.fillStyle = '#ff4d6d'; c.textAlign = 'right'; c.fillText('SUDDEN DEATH', W - 20, 36); c.textAlign = 'center'; }
    // lontbalk
    if (S.phase === 'play' || S.phase === 'slow') {
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(60, 70, W - 120, 26);
      c.fillStyle = `hsl(${50 * ratio},100%,55%)`; c.fillRect(60, 70, (W - 120) * ratio, 26);
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(60, 70, W - 120, 26);
      c.font = `${34 + (ratio < 0.3 ? Math.sin(now / 60) * 6 : 0)}px ${EMOJI}`; c.fillStyle = '#000'; c.fillText('💥', 60 + (W - 120) * ratio, 84);
    }
    // eigen status
    if (mineP?.ghost) {
      c.font = `700 32px ${FONT}`; c.fillStyle = '#cdb4ff'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.7)';
      const t = mineP.threw ? 'Je hebt gegooid. Veel plezier met toekijken. 👻' : '👻 Druk op de knop om de kroket te GOOIEN!';
      c.strokeText(t, CX, H - 36); c.fillText(t, CX, H - 36);
    } else if (mineP && mineP.rs > 0) {
      c.font = `700 36px ${FONT}`; c.fillStyle = '#6b4226'; c.fillText('Even opscharrelen… 🧺', CX, H - 36);
    }
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

// ----- host: ronde afsluiten met winnaar en scores -----
function finish(S, party) {
  const alive = living(S).map(([id]) => id);
  const winners = alive;
  const scores = {};
  for (const [id, p] of Object.entries(S.p)) scores[id] = p.ghost ? p.out : 1000 + p.lives * 10;
  const names = winners.map((id) => nameOf(party, id)).join(' & ');
  let text = '';
  const most = Object.entries(S.p).sort((a, b) => b[1].bm - a[1].bm)[0];
  if (most && most[1].bm >= 2 && !(winners.length === 1 && winners[0] === most[0])) text = `${nameOf(party, most[0])} ontplofte vaker dan een vuurwerkfabriek 🎆`;
  else if (S.order.length) text = `${nameOf(party, S.order[0])} ontplofte als eerste. Het ging lekker. 💥`;
  else text = 'Niemand ontplofte. Wat een kroketten-vrede. 🥟';
  party.end({
    title: winners.length ? `${names} wint! 🥟👑` : 'Niemand over! Gelijkspel 🥟💥',
    text, winners, scores,
  });
}
