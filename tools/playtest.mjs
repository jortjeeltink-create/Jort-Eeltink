// Automatische speltest: meerdere apparaten (laptop, telefoons, tablet) spelen
// tegelijk één game via de lokale server, zonder internet.
//
//   npm run playtest -- <game-map> [--players 4] [--bots 0] [--seconds 25] [--out test]
//
// Schrijft screenshots en rapport.json naar games/<game>/<out>/ en geeft
// exit-code 1 als er iets echt mis is.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';
import { startServers } from './serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const slug = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const opt = (name, d) => { const i = args.indexOf('--' + name); return i >= 0 ? +args[i + 1] : d; };
const PLAYERS = Math.max(2, opt('players', 4));
const BOTS = opt('bots', 0);
const SECONDS = opt('seconds', 25);
const OUT = (() => { const i = args.indexOf('--out'); return i >= 0 ? args[i + 1].replace(/[^a-z0-9-]/gi, '') : 'test'; })();

if (!slug || !fs.existsSync(path.join(ROOT, 'games', slug, 'index.html'))) {
  console.error(`Gebruik: npm run playtest -- <game-map>\nBeschikbaar: ${fs.readdirSync(path.join(ROOT, 'games')).filter((d) => fs.existsSync(path.join(ROOT, 'games', d, 'index.html'))).join(', ')}`);
  process.exit(2);
}

const dev = (name) => { const { defaultBrowserType, ...o } = devices[name]; return o; };
const DEVICES = [
  { name: 'laptop', ctx: { viewport: { width: 1280, height: 720 } } },
  { name: 'iphone', ctx: dev('iPhone 13') },
  { name: 'android-liggend', ctx: dev('Pixel 7 landscape') },
  { name: 'ipad', ctx: dev('iPad Mini') },
  { name: 'android', ctx: dev('Galaxy S9+') },
  { name: 'laptop-klein', ctx: { viewport: { width: 1024, height: 640 } } },
];

const outDir = path.join(ROOT, 'games', slug, OUT);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const report = { game: slug, players: PLAYERS, bots: BOTS, seconds: SECONDS, ok: true, problems: [], warnings: [], devices: [], rounds: 0, screenshots: [] };
const problem = (m) => { report.ok = false; report.problems.push(m); };
const warn = (m) => report.warnings.push(m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const servers = await startServers({ port: 0, peerPort: 0, quiet: true });
const base = `http://localhost:${servers.port}/games/${slug}/?peer=local&peerport=${servers.peerPort}`;
const browser = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--autoplay-policy=no-user-gesture-required'] });
const pages = [];

async function openDevice(i, url) {
  const d = DEVICES[i % DEVICES.length];
  const context = await browser.newContext(d.ctx);
  const page = await context.newPage();
  const info = { name: `${i === 0 ? 'host' : 'speler' + (i + 1)}-${d.name}`, errors: [], page, context, manual: false };
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const u = m.location()?.url || '';
    if (m.text().startsWith('Failed to load resource') && !u.includes('localhost')) return; // bijv. Google Fonts offline
    info.errors.push(m.text());
  });
  page.on('pageerror', (e) => info.errors.push(String(e.stack || e)));
  await page.goto(url);
  pages.push(info);
  return info;
}

const shot = async (info, label) => {
  const file = `${label}-${info.name}.png`;
  try { await info.page.screenshot({ path: path.join(outDir, file) }); report.screenshots.push(file); } catch {}
};
const party = (info, expr) => info.page.evaluate(expr).catch(() => null);

try {
  // 1. host opent een kamer
  const host = await openDevice(0, `${base}&autohost=1&name=Host&autopilot=1&bots=${BOTS}`);
  await host.page.waitForFunction(() => window.__party?.room, null, { timeout: 15000 }).catch(() => problem('Host kon geen kamer openen.'));
  const room = await party(host, () => window.__party.room);
  if (!room) throw new Error('geen kamer');

  // 2. spelers doen mee; speler 2 bestuurt met echte touch/muis, de rest met autopilot
  for (let i = 1; i < PLAYERS; i++) {
    const manual = i === 1;
    const info = await openDevice(i, `${base}&room=${room}&autojoin=1&name=Speler${i + 1}${manual ? '' : '&autopilot=1'}`);
    info.manual = manual;
  }
  const want = PLAYERS + BOTS;
  await host.page.waitForFunction((n) => window.__party.players.filter((p) => p.connected).length >= n, want, { timeout: 25000 })
    .catch(() => problem(`Niet alle spelers kwamen in de lobby (verwacht ${want}).`));
  await sleep(800);
  await shot(host, '1-lobby');
  await shot(pages[1], '1-lobby');

  // 3. starten
  await party(host, () => window.__party.start());
  const t0 = Date.now();
  for (const info of pages) info.statesAtStart = (await party(info, () => window.__party.stats.statesIn)) || 0;
  let midShot = false, leftEarly = false;
  const seen = new Map();
  const sawOver = new Set();
  while (Date.now() - t0 < SECONDS * 1000) {
    const el = (Date.now() - t0) / 1000;
    for (const info of pages) {
      if (info.closed) continue;
      const ph = await party(info, () => window.__party.phase);
      if (ph) seen.set(info.name, new Set([...(seen.get(info.name) || []), ph]));
    }
    // echte besturing op het touch-apparaat
    const m = pages[1];
    if (m && !m.closed && (await party(m, () => window.__party.phase)) === 'playing') {
      const vp = m.page.viewportSize();
      const zone = await m.page.$('.party-controls.show .pc-stick-zone');
      if (zone) {
        const sx = vp.width * 0.18, sy = vp.height * 0.8;
        await m.page.mouse.move(sx, sy); await m.page.mouse.down();
        await m.page.mouse.move(sx + (Math.random() - 0.5) * 100, sy + (Math.random() - 0.5) * 100, { steps: 4 });
        await sleep(200);
        await m.page.mouse.up();
      }
      const btns = await m.page.$$('.party-controls.show .pc-btn');
      if (btns.length) await btns[Math.floor(Math.random() * btns.length)].tap().catch(() => {});
      const uiButtons = await m.page.$$('.party-ui button:not([disabled])');
      if (uiButtons.length) await uiButtons[Math.floor(Math.random() * uiButtons.length)].tap().catch(() => {});
      if (!btns.length && !zone && !uiButtons.length) await m.page.touchscreen.tap(vp.width * Math.random(), vp.height * (0.2 + Math.random() * 0.6)).catch(() => {});
    }
    // ronde voorbij? screenshot en nog een ronde
    const hp = await party(host, () => window.__party.phase);
    if (hp === 'over') {
      report.rounds++;
      if (!sawOver.size) { await sleep(600); for (const info of pages) if (!info.closed) { sawOver.add(info.name); await shot(info, '3-einde'); } }
      await sleep(1200);
      await party(host, () => window.__party.start());
    }
    if (!midShot && el > SECONDS * 0.4) { midShot = true; for (const info of pages) await shot(info, '2-spel'); }
    // één speler gaat weg (telefoon dicht)
    if (!leftEarly && PLAYERS > 2 && el > SECONDS * 0.7) {
      leftEarly = true;
      const last = pages[pages.length - 1];
      last.closed = true;
      await last.context.close();
    }
    await sleep(400);
  }
  await sleep(500);

  // 4. resultaten verzamelen
  const elapsed = (Date.now() - t0) / 1000;
  report.elapsed = +elapsed.toFixed(1);
  for (const info of pages) {
    const st = info.closed ? null : await party(info, () => ({ ...window.__party.stats, phase: window.__party.phase, players: window.__party.players.length }));
    const blank = info.closed ? null : await party(info, () => {
      const c = document.querySelector('.party-canvas');
      const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const colors = new Set();
      for (let i = 0; i < x.length; i += 4 * 997) colors.add(`${x[i] >> 4},${x[i + 1] >> 4},${x[i + 2] >> 4}`);
      return colors.size;
    });
    const isHost = info === pages[0];
    const d = { name: info.name, manual: info.manual, left: !!info.closed, phases: [...(seen.get(info.name) || [])], errors: [...info.errors, ...(st?.errors || [])].slice(0, 10) };
    if (st) Object.assign(d, { statesAtStart: info.statesAtStart, statesTotal: st.statesIn, statesPerSec: isHost ? null : +((st.statesIn - info.statesAtStart) / elapsed).toFixed(1), maxStateBytes: st.maxStateBytes, colors: blank });
    report.devices.push(d);
    if (d.errors.length) problem(`${info.name}: ${d.errors.length} fout(en), eerste: ${d.errors[0].split('\n')[0]}`);
    if (!d.phases.includes('playing')) problem(`${info.name} is nooit in het spel gekomen (fases: ${d.phases.join(', ') || 'geen'}).`);
    if (!isHost && st && d.statesPerSec < 8) problem(`${info.name} kreeg maar ${d.statesPerSec} updates per seconde (verwacht ±20).`);
    if (st && st.maxStateBytes > 60000) problem(`${info.name}: spelstand is ${st.maxStateBytes} bytes; veel te groot voor live spelen (max ±16000).`);
    else if (st && st.maxStateBytes > 16000) warn(`${info.name}: spelstand is ${st.maxStateBytes} bytes. Kleiner maken voorkomt haperen op mobiel.`);
    if (blank !== null && blank < 3) warn(`${info.name}: het canvas lijkt leeg (bijna één kleur).`);
  }
  if (!report.rounds) warn(`Geen enkele ronde afgerond binnen ${SECONDS} s. Duurt een ronde langer? Dan is dat prima, anders klopt het einde van de ronde niet.`);
} catch (e) {
  problem('Test gecrasht: ' + (e.stack || e));
} finally {
  fs.writeFileSync(path.join(outDir, 'rapport.json'), JSON.stringify(report, (k, v) => (k === 'page' || k === 'context' ? undefined : v), 2));
  await browser.close().catch(() => {});
  servers.close();
}

console.log(`\n${report.ok ? '✅ GESLAAGD' : '❌ PROBLEMEN'}  ${slug}: ${PLAYERS} apparaten + ${BOTS} bots, ${SECONDS} s, ${report.rounds} ronde(s) afgerond`);
for (const d of report.devices) console.log(`   ${d.left ? '🚪' : '📱'} ${d.name.padEnd(26)} fases: ${d.phases.join('→').padEnd(22)} ${d.statesPerSec != null ? d.statesPerSec + ' upd/s' : ''} ${d.maxStateBytes ? d.maxStateBytes + ' B' : ''} ${d.errors.length ? '⚠️ ' + d.errors.length + ' fouten' : ''}`);
for (const p of report.problems) console.log('   ❌ ' + p);
for (const w of report.warnings) console.log('   ⚠️  ' + w);
console.log(`   Screenshots en rapport: games/${slug}/${OUT}/\n`);
process.exit(report.ok ? 0 : 1);
