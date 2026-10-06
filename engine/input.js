// Besturing voor elk apparaat: touch (joystick + knoppen), toetsenbord en gamepad.
// De engine leest dit uit en stuurt het naar de host. Een game hoeft hier niets mee te doen.
//
// Toetsenbord:  bewegen = WASD of pijltjes
//               knop 1 = spatie / J / Enter, knop 2 = K / Shift, knop 3 = L, knop 4 = I
//               cijfers 1-4 = knop 1-4
// Gamepad:      linker stick / d-pad, knoppen A B X Y = knop 1-4

import { vibrate } from './juice.js';

const KEYMAP = {
  ' ': 0, j: 0, enter: 0, '1': 0,
  k: 1, shift: 1, '2': 1,
  l: 2, '3': 2,
  i: 3, '4': 3,
};
const DIRS = {
  arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r', arrowup: 'u', w: 'u', arrowdown: 'd', s: 'd',
};

export function isTouchDevice() {
  return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export class Controls {
  /**
   * @param {HTMLElement} root  container voor de touch-besturing
   * @param {object|false} cfg  { joystick: true, buttons: ['Dash'] } of false
   * @param {boolean} forceTouch
   */
  constructor(root, cfg, forceTouch = false) {
    this.cfg = cfg === false ? { joystick: false, buttons: [] } : { joystick: cfg?.joystick ?? true, buttons: cfg?.buttons ?? [] };
    this.n = Math.max(4, this.cfg.buttons.length);
    this.root = root;
    this.dirs = new Set();
    this.keyB = new Array(this.n).fill(false);
    this.touchB = new Array(this.n).fill(false);
    this.padB = new Array(this.n).fill(false);
    this.k = new Array(this.n).fill(0);
    this.stick = { x: 0, y: 0 };
    this.touchVisible = forceTouch || isTouchDevice();
    this.enabled = false;

    addEventListener('keydown', (e) => this.key(e, true));
    addEventListener('keyup', (e) => this.key(e, false));
    addEventListener('blur', () => { this.dirs.clear(); this.keyB.fill(false); });

    if (this.touchVisible) this.buildTouch();
  }

  key(e, down) {
    if (!this.enabled) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    if (k in DIRS) {
      down ? this.dirs.add(DIRS[k]) : this.dirs.delete(DIRS[k]);
      e.preventDefault();
    } else if (k in KEYMAP) {
      const i = KEYMAP[k];
      if (down && !e.repeat && !this.keyB[i]) this.k[i]++;
      this.keyB[i] = down;
      e.preventDefault();
    }
  }

  buildTouch() {
    const { joystick, buttons } = this.cfg;
    this.root.classList.toggle('pc-only-buttons', !joystick);
    if (joystick) {
      const zone = document.createElement('div');
      zone.className = 'pc-stick-zone';
      const base = document.createElement('div');
      base.className = 'pc-stick-base';
      const knob = document.createElement('div');
      knob.className = 'pc-stick-knob';
      base.append(knob);
      zone.append(base);
      this.root.append(zone);
      const R = 55;
      let pid = null, cx = 0, cy = 0;
      const place = (x, y) => {
        const r = zone.getBoundingClientRect();
        base.style.left = (x - r.left) + 'px';
        base.style.top = (y - r.top) + 'px';
      };
      zone.addEventListener('pointerdown', (e) => {
        if (pid !== null) return;
        pid = e.pointerId; cx = e.clientX; cy = e.clientY;
        zone.setPointerCapture(pid);
        place(cx, cy);
        base.classList.add('active');
        e.preventDefault();
      });
      zone.addEventListener('pointermove', (e) => {
        if (e.pointerId !== pid) return;
        let dx = e.clientX - cx, dy = e.clientY - cy;
        const d = Math.hypot(dx, dy);
        if (d > R) { dx *= R / d; dy *= R / d; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.stick = { x: dx / R, y: dy / R };
      });
      const end = (e) => {
        if (e.pointerId !== pid) return;
        pid = null;
        knob.style.transform = '';
        base.classList.remove('active');
        base.style.left = base.style.top = '';
        this.stick = { x: 0, y: 0 };
      };
      zone.addEventListener('pointerup', end);
      zone.addEventListener('pointercancel', end);
    }
    if (buttons.length) {
      const wrap = document.createElement('div');
      wrap.className = 'pc-buttons';
      buttons.forEach((label, i) => {
        const b = document.createElement('button');
        b.className = 'pc-btn';
        b.dataset.i = i;
        b.textContent = label;
        const down = (e) => {
          e.preventDefault();
          if (!this.touchB[i]) this.k[i]++;
          this.touchB[i] = true;
          b.classList.add('down');
          vibrate(12);
        };
        const up = (e) => { e.preventDefault(); this.touchB[i] = false; b.classList.remove('down'); };
        b.addEventListener('pointerdown', down);
        b.addEventListener('pointerup', up);
        b.addEventListener('pointercancel', up);
        b.addEventListener('pointerleave', up);
        b.addEventListener('contextmenu', (e) => e.preventDefault());
        wrap.append(b);
      });
      this.root.append(wrap);
    }
  }

  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = [...pads].find((p) => p && p.connected);
    if (!pad) return { x: 0, y: 0 };
    for (let i = 0; i < 4 && i < this.n; i++) {
      const pressed = !!pad.buttons[i]?.pressed;
      if (pressed && !this.padB[i]) this.k[i]++;
      this.padB[i] = pressed;
    }
    let x = pad.axes[0] || 0, y = pad.axes[1] || 0;
    if (Math.hypot(x, y) < 0.2) { x = 0; y = 0; }
    if (pad.buttons[14]?.pressed) x = -1;
    if (pad.buttons[15]?.pressed) x = 1;
    if (pad.buttons[12]?.pressed) y = -1;
    if (pad.buttons[13]?.pressed) y = 1;
    return { x, y };
  }

  /** Huidige besturing: { x, y, b: [ingedrukt...], k: [aantal keer ingedrukt...] } */
  read() {
    if (!this.enabled) return { x: 0, y: 0, b: new Array(this.n).fill(false), k: this.k.slice() };
    const pad = this.pollPad();
    let x = (this.dirs.has('r') ? 1 : 0) - (this.dirs.has('l') ? 1 : 0) + this.stick.x + pad.x;
    let y = (this.dirs.has('d') ? 1 : 0) - (this.dirs.has('u') ? 1 : 0) + this.stick.y + pad.y;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    const b = this.keyB.map((v, i) => v || this.touchB[i] || this.padB[i]);
    return { x, y, b, k: this.k.slice() };
  }

  /** Touch-besturing tonen of verbergen (alleen tijdens het spelen). */
  setActive(on) {
    this.enabled = on;
    this.root.classList.toggle('show', on && this.touchVisible && (this.cfg.joystick || this.cfg.buttons.length > 0));
    if (!on) { this.dirs.clear(); this.keyB.fill(false); this.touchB.fill(false); this.stick = { x: 0, y: 0 }; }
  }
}
