// Party-engine: lobby met QR-code, live multiplayer en een game-loop.
//
// Eén apparaat is de host: dat rekent het spel uit (update) en stuurt de stand
// 20x per seconde naar de andere apparaten. Alle apparaten tekenen het spel zelf
// (render) en sturen hun besturing naar de host. De verbinding loopt rechtstreeks
// tussen de apparaten (WebRTC via PeerJS), dus er is geen eigen server nodig.
//
// Handleiding voor het maken van een game: engine/README.md

import qrcode from './vendor/qrcode.mjs';
import { Controls } from './input.js';
import * as juice from './juice.js';

const PREFIX = 'jortparty-v1';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const COLORS = ['#ff4d6d', '#3a86ff', '#ffbe0b', '#06d6a0', '#b15eff', '#ff8500', '#00c2d1', '#ff66c4', '#8ac926', '#f4f1de'];
export const EMOJIS = ['🐸', '🦄', '🐙', '🍌', '🦖', '🐷', '🤖', '👽', '🐔', '🦊', '🐼', '🍕', '🌮', '🦆', '🐝', '🥑', '🐧', '🦀', '🤠', '💩'];
const NAME_A = ['Snelle', 'Gekke', 'Stoere', 'Slaperige', 'Dappere', 'Wiebelige', 'Knappe', 'Plakkerige', 'Boze', 'Vrolijke', 'Mysterieuze', 'Hongerige', 'Turbo', 'Mini', 'Mega'];
const NAME_B = ['Banaan', 'Kip', 'Pannenkoek', 'Draak', 'Tosti', 'Eend', 'Robot', 'Sok', 'Augurk', 'Pinguïn', 'Kroket', 'Wafel', 'Frikandel', 'Hamster', 'Spruitje'];
const BOT_NAMES = ['Bot Bart', 'Bot Bea', 'Bot Bram', 'Bot Bo', 'Bot Billy', 'Bot Bella', 'Bot Boris', 'Bot Britt'];

// ---------- kleine hulpjes (ook bruikbaar in games) ----------

export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

/** Maak een DOM-element: h('button', { class: 'x', onclick: fn }, 'tekst') */
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    e.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return e;
}

const store = {
  get(k, d) { try { const v = localStorage.getItem('party:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('party:' + k, JSON.stringify(v)); } catch {} },
};
const params = new URLSearchParams(location.search);
const ENGINE_URL = new URL('.', import.meta.url);
const roundNum = (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v);
const randomName = () => `${pick(NAME_A)} ${pick(NAME_B)}`;
const randomCode = () => Array.from({ length: 4 }, () => pick([...CODE_CHARS])).join('');

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('Kon ' + src + ' niet laden'));
    document.head.append(s);
  });
}
async function getPeer() {
  if (!window.Peer) await loadScript(new URL('vendor/peerjs.min.js', ENGINE_URL).href);
  return window.Peer;
}
function peerOptions() {
  if (params.get('peer') === 'local') {
    return { host: location.hostname, port: +(params.get('peerport') || 9000), path: '/', secure: false, debug: 1, config: { iceServers: [] } };
  }
  return { debug: 1 };
}

// ---------- de engine ----------

/**
 * Start een game. Zie engine/README.md voor alle opties.
 * @param {object} def  de game-definitie
 */
export function startGame(def) {
  const p = new Party(def);
  p.boot();
  return p;
}

class Party {
  constructor(def) {
    this.g = {
      title: 'Party game', emoji: '🎮', subtitle: '', howTo: [],
      minPlayers: 1, maxPlayers: 8, tickRate: 20, countdown: 3, bots: true,
      world: { w: 1600, h: 900 }, background: '#1d1b3a',
      controls: { joystick: true, buttons: [] },
      ...def,
    };
    if (!this.g.id) this.g.id = (this.g.title || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.role = null;          // 'host' | 'client'
    this.phase = 'menu';       // menu | connecting | lobby | playing | over | error
    this.players = [];         // { id, name, emoji, color, bot, connected, wins }
    this.inRound = new Set();
    this.state = null;
    this.result = null;
    this.me = null;
    this.room = null;
    this.time = 0;
    this.countdown = 0;
    this.shownCount = 0;
    this.conns = new Map();    // host: peerId -> { conn, id, lastSeen }
    this.inputs = {};          // host: id -> laatste besturing
    this.lastK = {};
    this.lastB = {};
    this.lastAct = {};
    this.events = [];
    this.nextId = 1;
    this.nextBot = 0;
    this.seq = 0;
    this.smoothMap = new Map();
    this.stats = { statesIn: 0, msgsIn: 0, lastStateBytes: 0, maxStateBytes: 0, errors: [] };
    this.autopilot = params.get('autopilot') === '1';
    this.name = params.get('name') || store.get('name', null) || randomName();
    this.emoji = store.get('emoji', null) || pick(EMOJIS);
    this.token = store.get('token', null);
    if (!this.token || params.get('autojoin') || params.get('autohost')) {
      this.token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      if (!params.get('autojoin') && !params.get('autohost')) store.set('token', this.token);
    }
    this.api = this.makeApi();
  }

  // ----- opbouw -----

  boot() {
    const g = this.g;
    document.title = `${g.emoji} ${g.title}`;
    if (!document.querySelector('link[rel=icon]')) {
      document.head.append(h('link', { rel: 'icon', href: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${g.emoji}</text></svg>` }));
    }
    this.canvas = h('canvas', { class: 'party-canvas' });
    this.c = this.canvas.getContext('2d');
    this.ui = h('div', { class: 'party-ui' });
    this.hud = h('div', { class: 'party-hud' });
    this.overlay = h('div', { class: 'party-overlay' });
    this.controlsEl = h('div', { class: 'party-controls' });
    this.countEl = h('div', { class: 'party-count' });
    this.banner = h('div', { class: 'party-banner' });
    document.body.append(h('div', { class: 'party-root' }, this.canvas, this.ui, this.controlsEl, this.hud, this.countEl, this.banner, this.overlay));
    this.controls = new Controls(this.controlsEl, g.controls, params.get('touch') === '1');

    addEventListener('error', (e) => this.logError(e.message));
    addEventListener('unhandledrejection', (e) => this.logError(e.reason?.message || String(e.reason)));
    addEventListener('resize', () => this.resize());
    this.resize();
    try { g.init?.(this.api); } catch (e) { this.logError(e); }

    this.lastFrame = performance.now();
    requestAnimationFrame((t) => this.frame(t));
    window.__party = this.debugApi();

    const room = (params.get('room') || '').toUpperCase();
    if (room) params.get('autojoin') ? this.join(room) : this.showJoin(room);
    else if (params.get('autohost')) this.host();
    else this.showMenu();
  }

  makeApi() {
    const self = this;
    return {
      get me() { return self.me; },
      get isHost() { return self.role === 'host'; },
      get players() { return self.players.filter((p) => self.inRound.has(p.id)); },
      get allPlayers() { return self.players; },
      player: (id) => self.players.find((p) => p.id === id),
      get time() { return self.time; },
      dt: 0,
      get world() { return self.g.world; },
      get screen() { return { w: self.W, h: self.H, scale: self.scale, ox: self.ox, oy: self.oy }; },
      get ui() { return self.ui; },
      get canvas() { return self.canvas; },
      get inRound() { return self.inRound.has(self.me); },
      emit: (name, data) => self.emit(name, data),
      end: (result) => self.endRound(result),
      send: (action) => self.sendAction(action),
      smooth: (key, x, y, k) => self.smooth(key, x, y, k),
      toWorld: (cx, cy) => ({ x: (cx - self.ox) / self.scale, y: (cy - self.oy) / self.scale }),
      juice: {
        sfx: juice.sfx, vibrate: juice.vibrate, shake: juice.shake, flash: juice.flash,
        particles: juice.particles, floatText: juice.floatText,
        confetti: () => juice.confetti(self.g.world),
      },
      h, rand, randInt, pick, shuffle, clamp, lerp, dist, angle,
    };
  }

  debugApi() {
    const self = this;
    return {
      get phase() { return self.phase; },
      get role() { return self.role; },
      get room() { return self.room; },
      get me() { return self.me; },
      get players() { return self.players; },
      get state() { return self.state; },
      get stats() { return self.stats; },
      get result() { return self.result; },
      get countdown() { return self.countdown; },
      start: () => self.startRound(),
      lobby: () => self.toLobby(),
      addBot: () => self.addBot(),
    };
  }

  logError(e) {
    const msg = e?.stack || e?.message || String(e);
    if (this.stats.errors.length < 50) this.stats.errors.push(msg);
    console.error(e);
  }

  resize() {
    const W = innerWidth, H = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.W = W; this.H = H; this.dpr = dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    const { w, h: wh } = this.g.world;
    const touch = this.controls.touchVisible && this.controls.cfg && (this.controls.cfg.joystick || this.controls.cfg.buttons.length);
    const portrait = H > W;
    const top = portrait ? 48 : 0;
    const bottom = touch && portrait ? Math.min(260, H * 0.36) : 0;
    const availH = H - top - bottom;
    this.scale = Math.min(W / w, availH / wh);
    this.ox = (W - w * this.scale) / 2;
    this.oy = top + (availH - wh * this.scale) / 2;
    this.ui.style.cssText = `left:${this.ox}px;top:${this.oy}px;width:${w * this.scale}px;height:${wh * this.scale}px`;
    document.documentElement.style.setProperty('--world-scale', this.scale);
  }

  // ----- verbinden -----

  async host() {
    this.role = 'host';
    this.setPhase('connecting');
    let Peer;
    try { Peer = await getPeer(); } catch (e) { return this.fail('De multiplayer-bibliotheek kon niet laden. Heb je internet?'); }
    const tryOpen = (attempt) => {
      const code = params.get('code') && attempt === 0 ? params.get('code').toUpperCase() : randomCode();
      const peer = new Peer(`${PREFIX}-${this.g.id}-${code}`, peerOptions());
      peer.on('open', () => {
        if (this.room) return; // opnieuw verbonden met de matchmaking-server: kamer bestaat al
        this.peer = peer;
        this.room = code;
        this.me = 'p' + this.nextId++;
        this.players = [{ id: this.me, name: this.name, emoji: this.emoji, color: COLORS[0], bot: false, connected: true, wins: 0, host: true }];
        const bots = +(params.get('bots') || 0);
        for (let i = 0; i < bots; i++) this.addBot(false);
        this.toLobby();
        this.hostLoop();
      });
      peer.on('error', (err) => {
        if (err.type === 'unavailable-id' && attempt < 5) { peer.destroy(); tryOpen(attempt + 1); return; }
        if (!this.room) this.fail('Kon geen kamer openen: ' + (err.type || err.message) + '. Check je internet en probeer opnieuw.');
        else console.warn('peer-fout', err.type, err);
      });
      peer.on('disconnected', () => { setTimeout(() => { if (!peer.destroyed) peer.reconnect(); }, 1500); });
      peer.on('connection', (conn) => this.onConnection(conn));
    };
    tryOpen(0);
  }

  async join(code) {
    this.role = 'client';
    this.room = code;
    this.setPhase('connecting');
    let Peer;
    try { Peer = await getPeer(); } catch (e) { return this.fail('De multiplayer-bibliotheek kon niet laden. Heb je internet?'); }
    if (!this.peer || this.peer.destroyed) {
      this.peer = new Peer(undefined, peerOptions());
      this.peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') this.fail(`Kamer ${code} bestaat niet (meer). Check de code of vraag de host om een nieuwe.`);
        else if (this.phase === 'connecting') this.fail('Verbinden lukt niet (' + err.type + '). Probeer opnieuw.');
      });
      this.peer.on('disconnected', () => { setTimeout(() => { if (!this.peer.destroyed) this.peer.reconnect(); }, 1500); });
      await new Promise((res) => this.peer.on('open', res));
    }
    this.connectToHost();
  }

  connectToHost() {
    const conn = this.peer.connect(`${PREFIX}-${this.g.id}-${this.room}`, { reliable: true, serialization: 'raw' });
    this.hostConn = conn;
    const timeout = setTimeout(() => { if (!conn.open && this.phase === 'connecting') this.fail('Verbinden duurt te lang. Zitten jullie allebei op internet? Probeer opnieuw.'); }, 15000);
    conn.on('open', () => {
      clearTimeout(timeout);
      conn.send(JSON.stringify({ t: 'hello', name: this.name, emoji: this.emoji, token: this.token }));
      this.lastHostMsg = performance.now();
      if (!this.clientTimer) this.clientTimer = setInterval(() => this.clientHeartbeat(), 1000);
    });
    conn.on('data', (d) => this.onHostMessage(d));
    conn.on('close', () => this.lostHost());
    conn.on('error', () => this.lostHost());
  }

  clientHeartbeat() {
    if (this.hostConn?.open) this.hostConn.send('{"t":"ping"}');
    if (this.phase !== 'error' && this.phase !== 'connecting' && performance.now() - this.lastHostMsg > 8000) this.lostHost();
  }

  lostHost() {
    if (this.bye || this.reconnecting || this.phase === 'error' || this.phase === 'menu') return;
    this.reconnecting = true;
    this.showBanner('Verbinding kwijt… opnieuw verbinden 🔌');
    let tries = 0;
    const retry = () => {
      if (this.hostConn?.open && performance.now() - this.lastHostMsg < 3000) { this.reconnecting = false; this.showBanner(''); return; }
      if (++tries > 6) { this.reconnecting = false; this.showBanner(''); return this.fail('De verbinding met de host is verbroken. 😢'); }
      try { this.hostConn?.close(); } catch {}
      if (this.peer.disconnected) this.peer.reconnect();
      this.connectToHost();
      setTimeout(retry, 3000);
    };
    setTimeout(retry, 500);
  }

  // ----- host: berichten -----

  onConnection(conn) {
    conn.on('data', (d) => {
      let m; try { m = JSON.parse(d); } catch { return; }
      const c = this.conns.get(conn.peer);
      if (c) c.lastSeen = performance.now();
      if (m.t === 'hello') this.onHello(conn, m);
      else if (!c) return;
      else if (m.t === 'in') this.inputs[c.id] = { x: clamp(+m.x || 0, -1, 1), y: clamp(+m.y || 0, -1, 1), b: Array.isArray(m.b) ? m.b.map(Boolean) : [], k: Array.isArray(m.k) ? m.k.map(Number) : [] };
      else if (m.t === 'act') this.handleAction(c.id, m.a);
    });
    conn.on('close', () => this.dropConn(conn.peer));
    conn.on('error', () => this.dropConn(conn.peer));
  }

  onHello(conn, m) {
    let p = this.players.find((x) => !x.bot && x.token === m.token);
    if (!p && this.players.length >= this.g.maxPlayers) {
      conn.send(JSON.stringify({ t: 'full' }));
      setTimeout(() => conn.close(), 500);
      return;
    }
    const name = String(m.name || 'Speler').slice(0, 20);
    const emoji = String(m.emoji || '🙂').slice(0, 8);
    if (p) {
      p.connected = true; p.name = name; p.emoji = emoji;
    } else {
      const used = new Set(this.players.map((x) => x.color));
      p = { id: 'p' + this.nextId++, name, emoji, color: COLORS.find((c) => !used.has(c)) || pick(COLORS), bot: false, connected: true, wins: 0, token: m.token };
      this.players.push(p);
      juice.sfx('pop');
    }
    for (const [pid, c] of this.conns) if (c.id === p.id && pid !== conn.peer) { this.conns.delete(pid); try { c.conn.close(); } catch {} }
    this.conns.set(conn.peer, { conn, id: p.id, lastSeen: performance.now() });
    conn.send(JSON.stringify({ t: 'welcome', id: p.id, room: this.room }));
    if (this.phase === 'playing' && !this.inRound.has(p.id) && this.g.onJoin) {
      this.inRound.add(p.id);
      try { this.g.onJoin(this.state, p, this.api); } catch (e) { this.logError(e); }
    } else if (this.phase === 'playing' && this.inRound.has(p.id)) {
      // terug na verbindingsverlies: gewoon verder spelen
    }
    this.broadcastLobby();
    if (this.state) this.broadcastState();
  }

  dropConn(peerId) {
    const c = this.conns.get(peerId);
    if (!c) return;
    this.conns.delete(peerId);
    const p = this.players.find((x) => x.id === c.id);
    if (!p || [...this.conns.values()].some((o) => o.id === p.id)) return;
    p.connected = false;
    delete this.inputs[p.id];
    if (this.phase === 'lobby') this.players = this.players.filter((x) => x !== p);
    else if (this.phase === 'playing' && this.inRound.has(p.id) && this.g.onLeave) {
      try { this.g.onLeave(this.state, p.id, this.api); } catch (e) { this.logError(e); }
    }
    this.broadcastLobby();
  }

  addBot(broadcast = true) {
    if (this.role !== 'host' || this.players.length >= this.g.maxPlayers) return;
    const used = new Set(this.players.map((x) => x.color));
    const p = { id: 'b' + ++this.nextBot, name: BOT_NAMES[(this.nextBot - 1) % BOT_NAMES.length], emoji: '🤖', color: COLORS.find((c) => !used.has(c)) || pick(COLORS), bot: true, connected: true, wins: 0 };
    this.players.push(p);
    if (broadcast) this.broadcastLobby();
  }

  removeBot(id) {
    this.players = this.players.filter((p) => p.id !== id);
    this.broadcastLobby();
  }

  sendAll(msg) {
    for (const { conn } of this.conns.values()) if (conn.open) { try { conn.send(msg); } catch {} }
  }

  publicPlayers() {
    return this.players.map(({ token, ...p }) => p);
  }

  broadcastLobby(renderLocal = true) {
    if (this.role !== 'host') return;
    this.sendAll(JSON.stringify({ t: 'lobby', phase: this.phase, players: this.publicPlayers(), round: [...this.inRound], result: this.result }, roundNum));
    if (renderLocal) this.render();
  }

  broadcastState() {
    const msg = JSON.stringify({ t: 's', n: ++this.seq, tm: this.time, c: Math.ceil(Math.max(0, this.countdown)), s: this.state, e: this.events }, roundNum);
    this.events = [];
    this.stats.lastStateBytes = msg.length;
    this.stats.maxStateBytes = Math.max(this.stats.maxStateBytes, msg.length);
    this.stats.statesOut = (this.stats.statesOut || 0) + 1;
    this.sendAll(msg);
  }

  // ----- host: spelverloop -----

  hostLoop() {
    if (this.hostTimer) return;
    this.stats.hostLoops = (this.stats.hostLoops || 0) + 1;
    this.lastTick = performance.now();
    this.sendAcc = 0;
    this.lobbyAcc = 0;
    this.hostTimer = setInterval(() => this.hostTick(), 1000 / 60);
  }

  hostTick() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTick) / 1000);
    this.lastTick = now;
    if (this.phase === 'playing') {
      if (this.countdown > 0) {
        this.countdown -= dt;
      } else {
        const inputs = this.collectInputs();
        try { this.g.update(this.state, dt, inputs, this.api); } catch (e) { this.logError(e); }
        this.time += dt;
      }
    }
    if (this.phase === 'playing' || this.phase === 'over') {
      this.sendAcc += dt;
      if (this.sendAcc >= 1 / this.g.tickRate) { this.sendAcc = Math.min(this.sendAcc - 1 / this.g.tickRate, 1 / this.g.tickRate); this.broadcastState(); }
    }
    this.lobbyAcc += dt;
    if (this.lobbyAcc > 3) {
      this.lobbyAcc = 0;
      if (this.phase === 'lobby') this.broadcastLobby(false);
      for (const [pid, c] of this.conns) if (now - c.lastSeen > 10000) { try { c.conn.close(); } catch {} this.dropConn(pid); }
    }
  }

  botInput(id) {
    let r;
    if (this.g.bot) {
      try { r = this.g.bot(this.state, id, this.api) || {}; } catch (e) { this.logError(e); r = {}; }
    } else {
      const s = (this.botWander ||= {});
      const w = (s[id] ||= { x: 0, y: 0, t: 0 });
      w.t -= 1 / 60;
      if (w.t <= 0) { const a = rand(Math.PI * 2); w.x = Math.cos(a); w.y = Math.sin(a); w.t = rand(0.4, 1.4); w.b = Math.random() < 0.3; }
      r = { x: w.x, y: w.y, buttons: [w.b] };
    }
    if (r.action !== undefined && r.action !== null) {
      const now = performance.now();
      if (!this.lastAct[id] || now - this.lastAct[id] > 300) { this.lastAct[id] = now; this.sendActionAs(id, r.action); }
    }
    return { x: clamp(r.x || 0, -1, 1), y: clamp(r.y || 0, -1, 1), b: (r.buttons || []).map(Boolean) };
  }

  collectInputs() {
    const inputs = {};
    for (const p of this.players) {
      if (!this.inRound.has(p.id)) continue;
      let raw;
      if (p.bot) raw = this.botInput(p.id);
      else if (p.id === this.me) raw = this.autopilot ? this.botInput(p.id) : this.controls.read();
      else raw = this.inputs[p.id] || { x: 0, y: 0, b: [], k: [] };
      const n = Math.max(4, raw.b.length);
      const lastK = this.lastK[p.id] || [];
      const lastB = this.lastB[p.id] || [];
      const pressed = [];
      for (let i = 0; i < n; i++) pressed[i] = raw.k ? (raw.k[i] || 0) > (lastK[i] || 0) : !!raw.b[i] && !lastB[i];
      if (raw.k) this.lastK[p.id] = raw.k.slice();
      this.lastB[p.id] = raw.b.slice();
      inputs[p.id] = { x: raw.x, y: raw.y, buttons: Array.from({ length: n }, (_, i) => !!raw.b[i]), pressed };
    }
    return inputs;
  }

  handleAction(id, action) {
    if (this.phase !== 'playing' || this.countdown > 0 || !this.inRound.has(id) || !this.g.onAction) return;
    try { this.g.onAction(this.state, id, action, this.api); } catch (e) { this.logError(e); }
  }
  sendActionAs(id, action) { this.handleAction(id, action); }

  startRound() {
    if (this.role !== 'host') return;
    const ready = this.players.filter((p) => p.connected);
    if (ready.length < this.g.minPlayers) return;
    this.players = ready;
    this.inRound = new Set(ready.map((p) => p.id));
    this.result = null;
    this.time = 0;
    this.events = [];
    this.lastK = {}; this.lastB = {}; this.lastAct = {}; this.botWander = {};
    for (const [id, inp] of Object.entries(this.inputs)) this.lastK[id] = (inp.k || []).slice();
    this.lastK[this.me] = this.controls.read().k;
    try { this.state = this.g.setup(ready.map(({ token, ...p }) => p), this.api); } catch (e) { this.logError(e); this.state = {}; }
    this.countdown = this.g.countdown;
    this.setPhase('playing');
    this.broadcastLobby();
    this.broadcastState();
  }

  endRound(result = {}) {
    if (this.role !== 'host' || this.phase !== 'playing') return;
    const winners = result.winners || [];
    for (const p of this.players) if (winners.includes(p.id)) p.wins = (p.wins || 0) + 1;
    this.result = { title: result.title || 'Klaar!', text: result.text || '', winners, scores: result.scores || null };
    this.setPhase('over');
    this.broadcastLobby();
    this.broadcastState();
  }

  toLobby() {
    if (this.role !== 'host') return;
    this.players = this.players.filter((p) => p.connected);
    this.inRound = new Set();
    this.setPhase('lobby');
    this.broadcastLobby();
  }

  emit(name, data = {}) {
    if (this.role !== 'host') return;
    this.events.push({ n: name, d: data });
    this.runEvent(name, data);
  }

  runEvent(name, data) {
    try { this.g.onEvent?.(name, data, this.api); } catch (e) { this.logError(e); }
  }

  // ----- client: berichten -----

  onHostMessage(d) {
    let m; try { m = JSON.parse(d); } catch { return; }
    this.lastHostMsg = performance.now();
    this.stats.msgsIn++;
    if (this.reconnecting) { this.reconnecting = false; this.showBanner(''); }
    if (m.t === 'welcome') { this.me = m.id; this.room = m.room; }
    else if (m.t === 'lobby') {
      this.players = m.players;
      this.inRound = new Set(m.round);
      this.result = m.result;
      this.setPhase(m.phase);
      this.render();
    } else if (m.t === 's') {
      this.state = m.s;
      this.time = m.tm;
      this.countdown = m.c;
      this.stats.statesIn++;
      this.stats.lastStateBytes = d.length;
      this.stats.maxStateBytes = Math.max(this.stats.maxStateBytes, d.length);
      for (const e of m.e || []) this.runEvent(e.n, e.d);
    } else if (m.t === 'full') {
      this.bye = true;
      this.fail('Dit spel zit vol. 😅');
    }
  }

  sendAction(action) {
    if (this.role === 'host') this.handleAction(this.me, action);
    else if (this.hostConn?.open) this.hostConn.send(JSON.stringify({ t: 'act', a: action }));
  }

  clientInput(now) {
    if (!this.hostConn?.open || this.phase !== 'playing' || !this.inRound.has(this.me)) return;
    let inp;
    if (this.autopilot && this.state) {
      let r = {};
      if (this.g.bot) { try { r = this.g.bot(this.state, this.me, this.api) || {}; } catch (e) { this.logError(e); } }
      else { const a = now / 700 + this.me.length; r = { x: Math.cos(a), y: Math.sin(a * 1.3), buttons: [Math.sin(now / 300) > 0.7] }; }
      if (r.action !== undefined && r.action !== null && (!this.lastAutoAct || now - this.lastAutoAct > 300)) { this.lastAutoAct = now; this.sendAction(r.action); }
      const b = (r.buttons || []).map(Boolean);
      this.autoK ||= [0, 0, 0, 0];
      b.forEach((v, i) => { if (v && !this.autoB?.[i]) this.autoK[i]++; });
      this.autoB = b;
      inp = { x: clamp(r.x || 0, -1, 1), y: clamp(r.y || 0, -1, 1), b, k: this.autoK.slice() };
    } else inp = this.controls.read();
    const last = this.lastSent;
    const changed = !last || Math.abs(last.x - inp.x) > 0.04 || Math.abs(last.y - inp.y) > 0.04 || last.b.join() !== inp.b.join() || last.k.join() !== inp.k.join();
    if ((changed && now - this.lastSentAt > 30) || now - this.lastSentAt > 250 || !this.lastSentAt) {
      this.hostConn.send(JSON.stringify({ t: 'in', x: +inp.x.toFixed(2), y: +inp.y.toFixed(2), b: inp.b.map((v) => (v ? 1 : 0)), k: inp.k }));
      this.lastSent = inp;
      this.lastSentAt = now;
    }
  }

  // ----- tekenen -----

  smooth(key, x, y, k = 18) {
    if (this.role === 'host') return { x, y };
    let s = this.smoothMap.get(key);
    const now = this.frameTime;
    if (!s || Math.hypot(s.x - x, s.y - y) > 250 || now - s.t > 500) s = { x, y, t: now };
    const a = 1 - Math.exp(-k * this.api.dt);
    s.x += (x - s.x) * a; s.y += (y - s.y) * a; s.t = now;
    this.smoothMap.set(key, s);
    return { x: s.x, y: s.y };
  }

  frame(t) {
    requestAnimationFrame((tt) => this.frame(tt));
    const dt = Math.min(0.1, (t - this.lastFrame) / 1000);
    this.lastFrame = t;
    this.frameTime = t;
    this.api.dt = dt;
    if (this.role === 'client') this.clientInput(t);

    const shown = Math.ceil(this.countdown);
    if (this.phase === 'playing' && shown !== this.shownCount) {
      if (shown > 0) { this.countEl.textContent = shown; this.countEl.className = 'party-count show'; juice.sfx('tick'); }
      else if (this.shownCount > 0) { this.countEl.textContent = 'GO!'; this.countEl.className = 'party-count show go'; juice.sfx('go'); setTimeout(() => { if (this.countEl.textContent === 'GO!') this.countEl.className = 'party-count'; }, 700); }
      this.shownCount = shown;
    }
    if (this.phase !== 'playing' && this.countEl.className !== 'party-count') { this.countEl.className = 'party-count'; this.shownCount = 0; }

    const c = this.c, dpr = this.dpr, { w, h: wh } = this.g.world;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#0d0c1d';
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.state && (this.phase === 'playing' || this.phase === 'over')) {
      const sh = juice.shakeOffset();
      c.setTransform(dpr * this.scale, 0, 0, dpr * this.scale, dpr * (this.ox + sh.x), dpr * (this.oy + sh.y));
      c.save();
      c.beginPath(); c.rect(0, 0, w, wh); c.clip();
      c.fillStyle = this.g.background; c.fillRect(0, 0, w, wh);
      try { this.g.render(c, this.state, this.api); } catch (e) { if (!this.renderErr) { this.renderErr = true; this.logError(e); } }
      juice.update(dt);
      juice.draw(c);
      c.restore();
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      juice.drawFlash(c, this.W, this.H);
    }
  }

  // ----- schermen -----

  setPhase(phase) {
    const prev = this.phase;
    this.phase = phase;
    if (prev === phase) return;
    this.controls.setActive(phase === 'playing' && this.inRound.has(this.me));
    if (phase === 'playing') {
      this.requestWakeLock();
      const { w, h: wh } = this.g.world;
      if (this.controls.touchVisible && this.H > this.W && w > wh * 1.2) {
        this.showBanner('Tip: draai je telefoon voor een groter beeld 🔄');
        setTimeout(() => { if (this.banner.textContent.startsWith('Tip:')) this.showBanner(''); }, 4000);
      }
    }
    if (phase === 'over' && prev === 'playing') {
      const won = this.result?.winners?.includes(this.me);
      juice.confetti(this.g.world);
      juice.sfx(won || !this.result?.winners?.length ? 'win' : 'lose');
      if (won) juice.vibrate([60, 40, 60]);
    }
    if (phase === 'lobby' || phase === 'playing') this.smoothMap.clear();
    this.render();
  }

  async requestWakeLock() {
    try { if ('wakeLock' in navigator && !this.wakeLock) { this.wakeLock = await navigator.wakeLock.request('screen'); this.wakeLock.addEventListener('release', () => { this.wakeLock = null; }); } } catch {}
  }

  showBanner(text) {
    this.banner.textContent = text;
    this.banner.classList.toggle('show', !!text);
  }

  fail(msg) {
    this.errorMsg = msg;
    this.setPhase('error');
    this.render();
  }

  joinUrl() {
    const u = new URL(location.href);
    const keep = ['peer', 'peerport'];
    for (const k of [...u.searchParams.keys()]) if (!keep.includes(k)) u.searchParams.delete(k);
    u.searchParams.set('room', this.room);
    return u.href;
  }

  render() {
    this.renderHud();
    const o = this.overlay;
    o.replaceChildren();
    o.className = 'party-overlay';
    this.ui.classList.toggle('hidden', this.phase !== 'playing' && this.phase !== 'over');
    this.controls.setActive(this.phase === 'playing' && this.inRound.has(this.me));
    if (this.phase === 'playing') {
      if (!this.inRound.has(this.me)) this.showBanner('Je kijkt mee 👀 Volgende ronde doe je mee!');
      else if (!this.reconnecting && !this.banner.textContent.startsWith('Tip:')) this.showBanner('');
      return;
    }
    o.classList.add('show');
    const view = {
      menu: () => this.viewMenu(),
      join: () => this.viewJoin(),
      connecting: () => this.viewConnecting(),
      lobby: () => this.viewLobby(),
      over: () => this.viewOver(),
      error: () => this.viewError(),
    }[this.phase];
    if (view) o.append(view());
  }

  renderHud() {
    const inGame = this.phase === 'playing' || this.phase === 'over';
    this.hud.replaceChildren();
    if (!inGame) return;
    const btns = h('div', { class: 'hud-right' },
      h('button', { class: 'hud-btn', title: 'Geluid', onclick: (e) => { juice.setMuted(!juice.isMuted()); e.currentTarget.textContent = juice.isMuted() ? '🔇' : '🔊'; } }, juice.isMuted() ? '🔇' : '🔊'),
      document.fullscreenEnabled ? h('button', { class: 'hud-btn', title: 'Volledig scherm', onclick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {})) }, '⛶') : null,
      this.role === 'host' && this.phase === 'playing' ? h('button', { class: 'hud-btn', title: 'Terug naar lobby', onclick: () => { if (confirm('Ronde stoppen en terug naar de lobby?')) this.toLobby(); } }, '⏹') : null,
    );
    this.hud.append(h('div', { class: 'hud-room' }, '🏠 ', h('b', {}, this.room || ''), ` · ${this.players.filter((p) => p.connected).length} 👥`), btns);
  }

  header() {
    const g = this.g;
    return h('div', { class: 'pv-head' },
      h('div', { class: 'pv-emoji' }, g.emoji),
      h('h1', {}, g.title),
      g.subtitle ? h('p', { class: 'pv-sub' }, g.subtitle) : null);
  }

  profileFields() {
    const nameInput = h('input', { class: 'pv-input', maxlength: 20, value: this.name, 'aria-label': 'Je naam', oninput: (e) => { this.name = e.target.value.trim() || randomName(); store.set('name', this.name); } });
    const emojiBtn = h('button', { class: 'pv-emoji-btn', title: 'Kies een avatar', onclick: (e) => { const i = (EMOJIS.indexOf(this.emoji) + 1) % EMOJIS.length; this.emoji = EMOJIS[i]; store.set('emoji', this.emoji); e.currentTarget.textContent = this.emoji; juice.sfx('pop'); } }, this.emoji);
    const dice = h('button', { class: 'pv-dice', title: 'Willekeurige naam', onclick: () => { this.name = randomName(); nameInput.value = this.name; store.set('name', this.name); juice.sfx('click'); } }, '🎲');
    return h('div', { class: 'pv-profile' }, emojiBtn, nameInput, dice);
  }

  howTo() {
    if (!this.g.howTo?.length) return null;
    return h('div', { class: 'pv-card pv-howto' }, h('h3', {}, 'Zo speel je'), h('ul', {}, this.g.howTo.map((t) => h('li', {}, t))));
  }

  viewMenu() {
    const codeInput = h('input', { class: 'pv-input pv-code-input', maxlength: 4, placeholder: 'CODE', autocapitalize: 'characters', 'aria-label': 'Kamercode', oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); } });
    const doJoin = () => { const v = codeInput.value.trim().toUpperCase(); if (v.length === 4) this.join(v); else { codeInput.focus(); codeInput.classList.add('shake'); setTimeout(() => codeInput.classList.remove('shake'), 400); } };
    codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
    return h('div', { class: 'pv' },
      h('a', { class: 'pv-back', href: '../../' }, '← Alle games'),
      this.header(),
      this.profileFields(),
      h('button', { class: 'pv-btn pv-primary', onclick: () => this.host() }, '🎉 Nieuw spel starten'),
      h('div', { class: 'pv-join' }, codeInput, h('button', { class: 'pv-btn', onclick: doJoin }, 'Meedoen')),
      this.howTo(),
      h('p', { class: 'pv-hint' }, 'Eén iemand start een spel. De rest scant de QR-code of typt de code in.'));
  }

  showJoin(code) {
    this.room = code;
    this.phase = 'join';
    this.render();
  }

  viewJoin() {
    return h('div', { class: 'pv' },
      this.header(),
      h('p', { class: 'pv-sub' }, 'Je doet mee met kamer ', h('b', {}, this.room)),
      this.profileFields(),
      h('button', { class: 'pv-btn pv-primary', onclick: () => this.join(this.room) }, '🙌 Meedoen!'),
      this.howTo());
  }

  viewConnecting() {
    return h('div', { class: 'pv pv-center' }, this.header(), h('div', { class: 'pv-spinner' }), h('p', {}, this.role === 'host' ? 'Kamer openen…' : `Verbinden met ${this.room}…`));
  }

  playerList(editable) {
    return h('div', { class: 'pv-players' }, this.players.map((p) => h('div', { class: 'pv-player' + (p.connected ? '' : ' off'), style: `--pc:${p.color}` },
      h('span', { class: 'pv-p-emoji' }, p.emoji),
      h('span', { class: 'pv-p-name' }, p.name, p.id === this.me ? h('i', {}, ' (jij)') : null),
      p.host ? h('span', { title: 'Host' }, '👑') : null,
      p.wins ? h('span', { class: 'pv-wins' }, '🏆' + p.wins) : null,
      editable && p.bot ? h('button', { class: 'pv-x', title: 'Bot weghalen', onclick: () => this.removeBot(p.id) }, '✕') : null)));
  }

  viewLobby() {
    const g = this.g;
    const n = this.players.filter((p) => p.connected).length;
    const card = [];
    if (this.role === 'host') {
      const url = this.joinUrl();
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      const qrBox = h('div', { class: 'pv-qr' });
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
      const share = h('button', { class: 'pv-btn pv-small', onclick: async (e) => {
        const btn = e.currentTarget;
        try {
          if (navigator.share) await navigator.share({ title: g.title, text: `Doe mee met ${g.title}! Code: ${this.room}`, url });
          else { await navigator.clipboard.writeText(url); btn.textContent = '✅ Gekopieerd!'; setTimeout(() => { btn.textContent = '🔗 Deel link'; }, 1500); }
        } catch {}
      } }, '🔗 Deel link');
      card.push(h('div', { class: 'pv-room' }, qrBox, h('div', {}, h('div', { class: 'pv-label' }, 'Kamercode'), h('div', { class: 'pv-code' }, this.room), h('p', { class: 'pv-hint' }, 'Scan de QR-code of ga naar dit spel en typ de code.'), share)));
      const missing = g.minPlayers - n;
      card.push(this.playerList(true));
      card.push(h('div', { class: 'pv-row' },
        g.bots !== false && this.players.length < g.maxPlayers ? h('button', { class: 'pv-btn pv-small', onclick: () => { this.addBot(); juice.sfx('pop'); } }, '🤖 + Bot') : null,
        h('span', { class: 'pv-hint' }, `${n} / ${g.maxPlayers} spelers`)));
      card.push(h('button', { class: 'pv-btn pv-primary', disabled: missing > 0, onclick: () => this.startRound() }, missing > 0 ? `Nog ${missing} speler${missing > 1 ? 's' : ''} nodig` : `▶️ Start! (${n} spelers)`));
    } else {
      card.push(h('div', { class: 'pv-room' }, h('div', {}, h('div', { class: 'pv-label' }, 'Kamercode'), h('div', { class: 'pv-code' }, this.room))));
      card.push(this.playerList(false));
      card.push(h('p', { class: 'pv-wait' }, 'Wachten tot de host start', h('span', { class: 'pv-dots' })));
    }
    return h('div', { class: 'pv' }, this.header(), ...card, this.howTo());
  }

  viewOver() {
    const r = this.result || {};
    const scores = r.scores;
    const ranked = this.players.filter((p) => this.inRound.has(p.id) || scores?.[p.id] !== undefined).slice()
      .sort((a, b) => (scores ? (scores[b.id] ?? -1e9) - (scores[a.id] ?? -1e9) : 0) || ((r.winners || []).includes(b.id) - (r.winners || []).includes(a.id)));
    return h('div', { class: 'pv pv-over' },
      h('h1', { class: 'pv-result' }, r.title || 'Klaar!'),
      r.text ? h('p', { class: 'pv-sub' }, r.text) : null,
      h('div', { class: 'pv-ranking' }, ranked.map((p, i) => h('div', { class: 'pv-rank' + ((r.winners || []).includes(p.id) ? ' win' : ''), style: `--pc:${p.color}` },
        h('span', { class: 'pv-r-pos' }, (r.winners || []).includes(p.id) ? '👑' : `${i + 1}.`),
        h('span', { class: 'pv-p-emoji' }, p.emoji),
        h('span', { class: 'pv-p-name' }, p.name, p.id === this.me ? h('i', {}, ' (jij)') : null),
        scores ? h('b', {}, scores[p.id] ?? 0) : null,
        h('span', { class: 'pv-wins' }, '🏆' + (p.wins || 0))))),
      this.role === 'host'
        ? h('div', { class: 'pv-row' }, h('button', { class: 'pv-btn pv-primary', onclick: () => this.startRound() }, '🔁 Nog een ronde!'), h('button', { class: 'pv-btn', onclick: () => this.toLobby() }, 'Lobby'))
        : h('p', { class: 'pv-wait' }, 'Wachten op de host', h('span', { class: 'pv-dots' })));
  }

  viewError() {
    return h('div', { class: 'pv pv-center' }, this.header(), h('p', { class: 'pv-error' }, this.errorMsg || 'Er ging iets mis.'),
      h('button', { class: 'pv-btn pv-primary', onclick: () => { location.href = location.pathname + (params.get('peer') ? `?peer=${params.get('peer')}&peerport=${params.get('peerport') || ''}` : ''); } }, 'Opnieuw'));
  }
}
