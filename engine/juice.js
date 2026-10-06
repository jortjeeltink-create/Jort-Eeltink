// Juice: geluid en effecten die een game lekker laten voelen.
// Alles werkt zonder bestanden: geluiden worden ter plekke gemaakt met WebAudio.
//
// Gebruik in een game via party.juice (zie engine/README.md):
//   party.juice.sfx('boing')
//   party.juice.particles(x, y, { emoji: '🥚', count: 8 })
//   party.juice.shake(10)
//
// Let op: update() draait alleen op de host. Effecten horen in onEvent(),
// anders ziet en hoort alleen de host ze.

let actx = null;
let master = null;
let muted = false;
try { muted = localStorage.getItem('party:muted') === '1'; } catch {}

export function unlockAudio() {
  try {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
  } catch {}
}
for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, unlockAudio, { passive: true });

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('party:muted', m ? '1' : '0'); } catch {}
  if (master) master.gain.value = m ? 0 : 0.5;
}

// ---------- geluid ----------

function tone({ type = 'sine', f0 = 440, f1 = f0, dur = 0.15, vol = 0.3, delay = 0, vibrato = 0, vibratoRate = 10 }) {
  const t = actx.currentTime + delay;
  const osc = actx.createOscillator();
  const g = actx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  if (vibrato) {
    const lfo = actx.createOscillator();
    const lg = actx.createGain();
    lfo.frequency.value = vibratoRate;
    lg.gain.value = vibrato;
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

let noiseBuf = null;
function noise({ dur = 0.2, vol = 0.3, delay = 0, type = 'lowpass', f0 = 1000, f1 = f0, q = 1 }) {
  if (!noiseBuf) {
    noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = actx.currentTime + delay;
  const src = actx.createBufferSource();
  src.buffer = noiseBuf;
  const f = actx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.05);
}

const SOUNDS = {
  pop: (p) => tone({ f0: 500 * p, f1: 1100 * p, dur: 0.08, vol: 0.35 }),
  click: (p) => tone({ type: 'square', f0: 1200 * p, dur: 0.03, vol: 0.12 }),
  tick: (p) => tone({ type: 'square', f0: 880 * p, dur: 0.06, vol: 0.18 }),
  go: (p) => { tone({ type: 'square', f0: 523 * p, f1: 1046 * p, dur: 0.25, vol: 0.22 }); },
  coin: (p) => { tone({ type: 'square', f0: 988 * p, dur: 0.07, vol: 0.15 }); tone({ type: 'square', f0: 1319 * p, dur: 0.22, vol: 0.15, delay: 0.07 }); },
  jump: (p) => tone({ type: 'square', f0: 280 * p, f1: 720 * p, dur: 0.16, vol: 0.15 }),
  boing: (p) => tone({ type: 'triangle', f0: 180 * p, f1: 520 * p, dur: 0.45, vol: 0.4, vibrato: 60, vibratoRate: 14 }),
  hit: (p) => { noise({ dur: 0.12, vol: 0.4, f0: 1500 * p, f1: 300 }); tone({ f0: 160 * p, f1: 60, dur: 0.12, vol: 0.4 }); },
  splat: (p) => { noise({ dur: 0.22, vol: 0.45, f0: 900 * p, f1: 120 }); tone({ f0: 220 * p, f1: 45, dur: 0.2, vol: 0.3 }); },
  boom: (p) => { noise({ dur: 0.7, vol: 0.6, f0: 900 * p, f1: 60 }); tone({ f0: 90 * p, f1: 28, dur: 0.6, vol: 0.5 }); },
  whoosh: (p) => noise({ dur: 0.3, vol: 0.25, type: 'bandpass', f0: 300 * p, f1: 2500 * p, q: 2 }),
  powerup: (p) => tone({ type: 'square', f0: 300 * p, f1: 1300 * p, dur: 0.4, vol: 0.14, vibrato: 40, vibratoRate: 18 }),
  toet: (p) => { tone({ type: 'square', f0: 440 * p, dur: 0.32, vol: 0.12 }); tone({ type: 'square', f0: 554 * p, dur: 0.32, vol: 0.12 }); },
  prrt: (p) => { tone({ type: 'sawtooth', f0: 95 * p, f1: 70 * p, dur: 0.45, vol: 0.35, vibrato: 25, vibratoRate: 32 }); noise({ dur: 0.4, vol: 0.12, f0: 300, f1: 120 }); },
  quack: (p) => { tone({ type: 'sawtooth', f0: 520 * p, f1: 380 * p, dur: 0.13, vol: 0.2, vibrato: 30, vibratoRate: 40 }); },
  win: (p) => [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f0: f * p, dur: i === 3 ? 0.5 : 0.14, vol: 0.3, delay: i * 0.12 })),
  lose: (p) => [392, 370, 349, 262].forEach((f, i) => tone({ type: 'sawtooth', f0: f * p, f1: i === 3 ? 180 * p : f * p, dur: i === 3 ? 0.6 : 0.22, vol: 0.12, delay: i * 0.24, vibrato: i === 3 ? 12 : 0, vibratoRate: 7 })),
};

/** Speel een geluid af. Namen: zie SOUND_NAMES. opts: { vol: 0..1, pitch: 1 = normaal } */
export function sfx(name, opts = {}) {
  if (!actx || muted || actx.state !== 'running') return;
  const fn = SOUNDS[name];
  if (!fn) return;
  const pitch = (opts.pitch ?? 1) * (1 + (Math.random() - 0.5) * 0.08);
  try { fn(pitch); } catch {}
}
export const SOUND_NAMES = Object.keys(SOUNDS);

/** Laat de telefoon trillen (werkt op Android; iPhone negeert dit). */
export function vibrate(ms = 30) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
}

// ---------- beeld ----------

const parts = [];
const texts = [];
let shakeT = 0, shakeMag = 0, shakeDur = 0.3;
let flashColor = null, flashT = 0, flashDur = 0;

/** Schud het scherm. */
export function shake(mag = 8, dur = 0.3) { shakeMag = Math.max(shakeMag * (shakeT > 0 ? 1 : 0), mag); shakeT = dur; shakeDur = dur; }

/** Laat het hele scherm kort oplichten, bijv. flash('#fff') of flash('rgba(255,0,0,.4)'). */
export function flash(color = 'rgba(255,255,255,.6)', dur = 0.15) { flashColor = color; flashT = dur; flashDur = dur; }

/** Spat deeltjes uit een punt (wereldcoördinaten). Met emoji: emoji-deeltjes. */
export function particles(x, y, { count = 12, color = '#fff', colors = null, speed = 300, size = 8, life = 0.6, gravity = 0, emoji = null, spread = Math.PI * 2, angle = 0 } = {}) {
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const s = speed * (0.4 + Math.random() * 0.6);
    parts.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: gravity,
      life: life * (0.6 + Math.random() * 0.4), max: life, size: size * (0.6 + Math.random() * 0.8),
      color: colors ? colors[(Math.random() * colors.length) | 0] : color, emoji,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 10, rect: false,
    });
  }
  if (parts.length > 600) parts.splice(0, parts.length - 600);
}

/** Confetti over de hele wereld (bij winst). */
export function confetti(world, count = 120) {
  const colors = ['#ff4d6d', '#ffbe0b', '#3a86ff', '#06d6a0', '#b15eff', '#ff8500'];
  for (let i = 0; i < count; i++) {
    parts.push({
      x: Math.random() * world.w, y: -20 - Math.random() * world.h * 0.3,
      vx: (Math.random() - 0.5) * 200, vy: 100 + Math.random() * 250, g: 300,
      life: 2.5 + Math.random(), max: 3.5, size: 8 + Math.random() * 8,
      color: colors[(Math.random() * colors.length) | 0], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, rect: true,
    });
  }
}

/** Zwevende tekst, bijv. floatText(x, y, '+1') of floatText(x, y, 'AU!', { color: '#f44' }). */
export function floatText(x, y, text, { color = '#fff', size = 40, life = 0.9, rise = 90 } = {}) {
  texts.push({ x, y, text, color, size, life, max: life, rise });
}

export function shakeOffset() {
  if (shakeT <= 0) return { x: 0, y: 0 };
  const m = shakeMag * (shakeT / shakeDur);
  return { x: (Math.random() - 0.5) * 2 * m, y: (Math.random() - 0.5) * 2 * m };
}

export function update(dt) {
  if (shakeT > 0) shakeT -= dt;
  if (flashT > 0) flashT -= dt;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 1 - Math.min(1, dt * 1.5); if (!p.rect) p.vy *= 1 - Math.min(1, dt * 1.5);
    p.rot += p.vr * dt;
  }
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.life -= dt;
    if (t.life <= 0) texts.splice(i, 1);
  }
}

/** Tekent deeltjes en teksten. c staat al in wereldcoördinaten. */
export function draw(c) {
  for (const p of parts) {
    const a = Math.min(1, p.life / (p.max * 0.5));
    c.globalAlpha = a;
    if (p.emoji) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.font = `${p.size * 3}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p.emoji, 0, 0);
      c.restore();
    } else if (p.rect) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      c.fillStyle = p.color; c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      c.restore();
    } else {
      c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); c.fill();
    }
  }
  c.globalAlpha = 1;
  for (const t of texts) {
    const k = 1 - t.life / t.max;
    c.globalAlpha = Math.min(1, t.life / (t.max * 0.4));
    const s = t.size * (k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15)));
    c.font = `900 ${s}px Fredoka, system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = s / 6; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineJoin = 'round';
    c.strokeText(t.text, t.x, t.y - k * t.rise);
    c.fillStyle = t.color; c.fillText(t.text, t.x, t.y - k * t.rise);
  }
  c.globalAlpha = 1;
}

/** Tekent de flits over het hele scherm (schermcoördinaten). */
export function drawFlash(c, w, h) {
  if (flashT <= 0 || !flashColor) return;
  c.globalAlpha = flashT / flashDur;
  c.fillStyle = flashColor;
  c.fillRect(0, 0, w, h);
  c.globalAlpha = 1;
}
