// Botsbal: duw elkaar van het ijs! De voorbeeldgame van de studio.
// Laat zien hoe je startGame gebruikt: setup, update, events met effecten, bots en render.

import { startGame, rand, dist } from '../../engine/party.js';

const W = 1600, H = 900;
const CX = W / 2, CY = H / 2;
const ARENA = 400;      // straal van het ijs aan het begin
const R = 38;           // straal van een speler
const LIVES = 3;
const ROUND_TIME = 90;  // seconden

startGame({
  id: 'botsbal',
  title: 'Botsbal',
  emoji: '🎱',
  subtitle: 'Duw elkaar van het ijs!',
  howTo: [
    'Beweeg met de joystick (of WASD / pijltjes).',
    'Druk op Dash (of spatie) voor een supersnelle duw.',
    'Val je van het ijs, dan ben je een leven kwijt. Je hebt er 3.',
    'Het ijs smelt langzaam… Wie het langst blijft staan, wint!',
  ],
  minPlayers: 2,
  maxPlayers: 8,
  world: { w: W, h: H },
  background: '#14325c',
  controls: { joystick: true, buttons: ['Dash'] },

  // ----- host: begin van een ronde -----
  setup(players) {
    const balls = {};
    players.forEach((p, i) => {
      const a = (i / players.length) * Math.PI * 2;
      balls[p.id] = { x: CX + Math.cos(a) * ARENA * 0.6, y: CY + Math.sin(a) * ARENA * 0.6, vx: 0, vy: 0, lives: LIVES, dash: 0, dead: 0, safe: 1.5, lastHit: null, ko: 0 };
    });
    return { balls, arena: ARENA, timeLeft: ROUND_TIME };
  },

  // ----- host: elke frame -----
  update(state, dt, inputs, party) {
    state.timeLeft -= dt;
    state.arena = Math.max(200, ARENA - party.time * 2.5); // het ijs smelt

    for (const [id, b] of Object.entries(state.balls)) {
      if (b.lives <= 0) continue;
      if (b.dead > 0) { // aan het terugkomen
        b.dead -= dt;
        if (b.dead <= 0) { b.x = CX + rand(-50, 50); b.y = CY + rand(-50, 50); b.vx = b.vy = 0; b.safe = 1.5; }
        continue;
      }
      const inp = inputs[id] || { x: 0, y: 0, pressed: [] };
      b.vx += inp.x * 1400 * dt;
      b.vy += inp.y * 1400 * dt;
      b.dash = Math.max(0, b.dash - dt);
      b.safe = Math.max(0, b.safe - dt);
      if (inp.pressed[0] && b.dash === 0 && (inp.x || inp.y)) {
        const m = Math.hypot(inp.x, inp.y);
        b.vx += (inp.x / m) * 900; b.vy += (inp.y / m) * 900;
        b.dash = 1.2;
        party.emit('dash', { x: b.x, y: b.y });
      }
      b.vx *= 1 - Math.min(1, dt * 1.2); // een beetje wrijving op het ijs
      b.vy *= 1 - Math.min(1, dt * 1.2);
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (dist(b, { x: CX, y: CY }) > state.arena + R * 0.5) { // van het ijs gevallen!
        b.lives--;
        b.dead = 1.5;
        const by = b.lastHit && state.balls[b.lastHit] ? b.lastHit : null;
        if (by) state.balls[by].ko++;
        party.emit('val', { x: b.x, y: b.y, id, by, out: b.lives <= 0 });
      }
    }

    // botsingen tussen spelers
    const live = Object.entries(state.balls).filter(([, b]) => b.lives > 0 && b.dead <= 0);
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const [ia, a] = live[i], [ib, b] = live[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d === 0 || d >= R * 2) continue;
      const nx = dx / d, ny = dy / d;
      const push = (R * 2 - d) / 2;
      a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rel > 0) {
        const imp = rel * 1.15; // iets meer dan volledig elastisch = extra boing
        if (!a.safe) { a.vx -= imp * nx; a.vy -= imp * ny; }
        if (!b.safe) { b.vx += imp * nx; b.vy += imp * ny; }
        a.lastHit = ib; b.lastHit = ia;
        if (rel > 150) party.emit('bots', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, power: Math.min(1, rel / 900) });
      }
    }

    // einde van de ronde?
    const alive = Object.entries(state.balls).filter(([, b]) => b.lives > 0);
    if (alive.length <= 1 || state.timeLeft <= 0) {
      const best = Math.max(...alive.map(([, b]) => b.lives), 0);
      const winners = alive.filter(([, b]) => b.lives === best).map(([id]) => id);
      const scores = Object.fromEntries(Object.entries(state.balls).map(([id, b]) => [id, b.lives * 10 + b.ko]));
      const names = winners.map((id) => party.player(id)?.name).join(' & ');
      party.end({ title: winners.length ? `${names} wint! 🏆` : 'Iedereen ligt in het water! 💦', text: 'Punten: 10 per leven + 1 per keer dat je iemand eraf duwde.', winners, scores });
    }
  },

  // ----- host: wat doen bots? (ook gebruikt door de tester) -----
  bot(state, id) {
    const b = state.balls[id];
    if (!b || b.lives <= 0) return {};
    // zoek de dichtstbijzijnde tegenstander en ga erop af, maar blijf van de rand weg
    let target = null, best = Infinity;
    for (const [oid, o] of Object.entries(state.balls)) {
      if (oid === id || o.lives <= 0 || o.dead > 0) continue;
      const d = dist(b, o);
      if (d < best) { best = d; target = o; }
    }
    const toCenter = { x: CX - b.x, y: CY - b.y };
    const edge = dist(b, { x: CX, y: CY }) / state.arena;
    let x = toCenter.x * edge * 2, y = toCenter.y * edge * 2;
    if (target) { x += target.x - b.x; y += target.y - b.y; }
    const m = Math.hypot(x, y) || 1;
    return { x: x / m, y: y / m, buttons: [best < 150 && Math.random() < 0.05] };
  },

  // ----- alle apparaten: effecten en geluid -----
  onEvent(name, d, party) {
    const j = party.juice;
    if (name === 'bots') { j.sfx('boing', { pitch: 1.4 - d.power * 0.6 }); j.particles(d.x, d.y, { count: 8, color: '#cfe8ff' }); j.shake(4 + d.power * 10); }
    if (name === 'dash') { j.sfx('whoosh'); j.particles(d.x, d.y, { count: 10, color: '#fff', speed: 200 }); }
    if (name === 'val') {
      j.sfx('splat');
      j.particles(d.x, d.y, { count: 20, color: '#5dade2', speed: 400, gravity: 600 });
      j.floatText(d.x, d.y - 40, d.out ? 'UIT! 💀' : 'PLONS!', { color: '#9be7ff' });
      if (d.id === party.me) { j.vibrate(200); j.flash('rgba(80,160,255,.45)'); }
      if (d.by && d.by === party.me) j.floatText(d.x, d.y - 90, '+1 KO', { color: '#ffbe0b', size: 34 });
    }
  },

  // ----- alle apparaten: tekenen (c staat in wereldcoördinaten 1600 × 900) -----
  render(c, state, party) {
    // water met golfjes
    c.fillStyle = '#14325c';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.06)';
    c.lineWidth = 4;
    for (let y = 40; y < H; y += 60) {
      c.beginPath();
      for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x / 60 + performance.now() / 600 + y) * 6);
      c.stroke();
    }
    // het ijs
    const g = c.createRadialGradient(CX, CY, 0, CX, CY, state.arena);
    g.addColorStop(0, '#f2fbff'); g.addColorStop(1, '#bfe6ff');
    c.fillStyle = g;
    c.beginPath(); c.arc(CX, CY, state.arena, 0, Math.PI * 2); c.fill();
    c.lineWidth = 10; c.strokeStyle = '#8fd0ff'; c.stroke();

    // spelers
    for (const [id, b] of Object.entries(state.balls)) {
      if (b.lives <= 0 || b.dead > 0) continue;
      const p = party.player(id);
      const pos = party.smooth(id, b.x, b.y);
      c.globalAlpha = b.safe > 0 && Math.floor(performance.now() / 100) % 2 ? 0.5 : 1;
      c.fillStyle = 'rgba(0,0,0,.18)';
      c.beginPath(); c.ellipse(pos.x, pos.y + R * 0.8, R * 0.9, R * 0.35, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = p?.color || '#fff';
      c.beginPath(); c.arc(pos.x, pos.y, R, 0, Math.PI * 2); c.fill();
      c.lineWidth = id === party.me ? 7 : 4;
      c.strokeStyle = id === party.me ? '#fff' : 'rgba(0,0,0,.3)';
      c.stroke();
      c.font = '44px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p?.emoji || '🙂', pos.x, pos.y + 2);
      c.globalAlpha = 1;
      c.font = '600 24px Fredoka, system-ui, sans-serif';
      c.fillStyle = '#fff';
      c.fillText(p?.name || '', pos.x, pos.y - R - 26);
      c.fillText('❤️'.repeat(b.lives), pos.x, pos.y - R - 4);
    }

    // klok
    c.font = '700 48px Fredoka, system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillStyle = state.timeLeft < 10 ? '#ff4d6d' : '#fff';
    c.fillText(Math.max(0, Math.ceil(state.timeLeft)), CX, 60);

    // eigen status als je dood bent
    const mine = state.balls[party.me];
    if (mine && mine.lives > 0 && mine.dead > 0) {
      c.font = '700 40px Fredoka, system-ui, sans-serif';
      c.fillStyle = '#9be7ff';
      c.fillText('Even opdrogen… 🧺', CX, H - 60);
    } else if (mine && mine.lives <= 0) {
      c.font = '700 40px Fredoka, system-ui, sans-serif';
      c.fillStyle = '#ff9fb2';
      c.fillText('Je ligt eruit. Moedig de rest aan! 📣', CX, H - 60);
    }
  },
});
