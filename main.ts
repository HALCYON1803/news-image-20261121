// news-image-20261121 — "The World in One Day"
// A one-day front page for SATURDAY 21 NOVEMBER 2026, drawn entirely in code.
// Node 22, standard library only, no network. Writes /output/entry.png
// (or $MAKEFUN_OUTPUT_DIR/entry.png when run outside the grader).
// Hand-written PNG encoder (stored DEFLATE blocks) + 5x7 bitmap font.
// Every story below happened, or was first reported, on 21 November 2026
// in some time zone; Friday-evening US stories count because they were
// first reported on Saturday in Asia. Stories from 19/20 November are
// named in the DATE CHECK box instead of being shown as today's news.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------- palette ----------
const PAPER: C = [247, 243, 232];
const INK: C = [26, 26, 26];
const NAVY: C = [18, 38, 66];
const NAVY2: C = [28, 58, 96];
const RED: C = [178, 34, 28];
const BLUE: C = [29, 78, 137];
const GOLD: C = [198, 158, 38];
const TEAL: C = [14, 107, 107];
const GREEN: C = [46, 125, 50];
const CREAM: C = [247, 243, 232];
const GREY: C = [110, 108, 100];
const LIGHT: C = [232, 226, 210];
const WHITE: C = [255, 255, 255];
const SKY: C = [135, 190, 220];
const DARKGOLD: C = [146, 110, 20];

type C = [number, number, number];

// ---------- canvas ----------
const pxBuf = new Uint8Array(W * H * 3);

function put(x: number, y: number, c: C): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  pxBuf[i] = c[0];
  pxBuf[i + 1] = c[1];
  pxBuf[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: C): void {
  if (w <= 0 || h <= 0) return;
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      pxBuf[i] = c[0];
      pxBuf[i + 1] = c[1];
      pxBuf[i + 2] = c[2];
    }
  }
}

function hline(x: number, y: number, w: number, c: C): void {
  rect(x, y, w, 1, c);
}

function vline(x: number, y: number, h: number, c: C): void {
  rect(x, y, 1, h, c);
}

function line(x0: number, y0: number, x1: number, y1: number, c: C): void {
  // Round: fractional endpoints would never satisfy the x===x1 break test.
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    put(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function disc(cx: number, cy: number, r: number, c: C): void {
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) put(cx + x, cy + y, c);
    }
  }
}

function ellipse(cx: number, cy: number, rx: number, ry: number, c: C): void {
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) put(cx + x, cy + y, c);
    }
  }
}

function tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: C): void {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  x2 = Math.round(x2);
  y2 = Math.round(y2);
  const minX = Math.max(0, Math.min(x0, x1, x2));
  const maxX = Math.min(W - 1, Math.max(x0, x1, x2));
  const minY = Math.max(0, Math.min(y0, y1, y2));
  const maxY = Math.min(H - 1, Math.max(y0, y1, y2));
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  if (d === 0) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((y1 - y2) * (x - x2) + (x2 - x1) * (y - y2)) / d;
      const b = ((y2 - y0) * (x - x2) + (x0 - x2) * (y - y2)) / d;
      const g = 1 - a - b;
      if (a >= 0 && b >= 0 && g >= 0) put(x, y, c);
    }
  }
}

// Even-odd scanline fill for simple polygons (continent shapes, flags).
function poly(pts: Array<[number, number]>, c: C): void {
  let minY = H;
  let maxY = 0;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(Math.round(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1])));
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      hline(xs[k], y, xs[k + 1] - xs[k], c);
    }
  }
}

// ---------- 5x7 bitmap font (own table, uppercase + digits + punctuation) ----------
// Each glyph is 7 rows; each row is 5 bits, bit 4 = leftmost column.
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  "-": [0, 0, 0, 0x0e, 0, 0, 0],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  "*": [0, 0x04, 0x15, 0x0e, 0x15, 0x04, 0],
  '"': [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  _: [0, 0, 0, 0, 0, 0, 0x1f],
  "|": [0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
};

function textW(s: string, scale: number): number {
  if (s.length === 0) return 0;
  return s.length * 6 * scale - scale;
}

function drawText(x: number, y: number, s: string, c: C, scale: number, bold = false): void {
  const up = s.toUpperCase();
  for (let ci = 0; ci < up.length; ci++) {
    const g = FONT[up[ci]] ?? FONT["?"];
    const ox = x + ci * 6 * scale;
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if ((g[r] >> (4 - col)) & 1) {
          rect(ox + col * scale, y + r * scale, scale, scale, c);
          if (bold) rect(ox + col * scale + 1, y + r * scale, scale, scale, c);
        }
      }
    }
  }
}

function centerText(cx: number, y: number, s: string, c: C, scale: number, bold = false): void {
  drawText(cx - Math.floor(textW(s, scale) / 2), y, s, c, scale, bold);
}

// Greedy word wrap; returns at most maxLines lines (extra words dropped).
function wrapText(s: string, maxW: number, scale: number, maxLines: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const cand = cur === "" ? w : cur + " " + w;
    if (textW(cand, scale) <= maxW) {
      cur = cand;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) return lines;
    }
  }
  if (cur !== "" && lines.length < maxLines) lines.push(cur);
  return lines;
}

// ---------- PNG encoder (zlib DEFLATE via node:zlib, deterministic per runtime) ----------
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcIn = new Uint8Array(4 + data.length);
  crcIn.set(out.subarray(4, 8), 0);
  crcIn.set(data, 4);
  dv.setUint32(8 + data.length, crc32(crcIn));
  return out;
}

function encodePNG(w: number, h: number, rgb: Uint8Array): Uint8Array {
  const raw = new Uint8Array(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  // node:zlib is standard library; level 9 gives a small deterministic file.
  const zlib = deflateSync(raw, { level: 9 });
  const ihdr = new Uint8Array(13);
  const idv = new DataView(ihdr.buffer);
  idv.setUint32(0, w);
  idv.setUint32(4, h);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", zlib), chunk("IEND", new Uint8Array(0))];
  let total = 0;
  for (const q of parts) total += q.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const q of parts) {
    out.set(q, o);
    o += q.length;
  }
  return out;
}

// ---------- illustrations (all drawn in code, no external art) ----------
// Each takes the top-left corner and size of its picture box.

function drawGlobe(x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  const r = Math.min(w, h) / 2 - 4;
  disc(cx, cy, Math.floor(r), NAVY2);
  ellipse(cx - 6, cy - 4, 10, 6, GREEN);
  ellipse(cx + 8, cy + 8, 8, 5, GREEN);
  ellipse(cx + 4, cy - 12, 6, 4, GREEN);
  // orbit ring
  for (let a = 0; a < 360; a += 4) {
    const rad = (a * Math.PI) / 180;
    put(Math.round(cx + Math.cos(rad) * (r + 5)), Math.round(cy + Math.sin(rad) * (r + 5) * 0.35), GOLD);
  }
  put(cx - 16, cy - 16, GOLD);
  put(cx + 18, cy - 14, GOLD);
}

function drawSkyline(x: number, y: number, w: number, h: number): void {
  disc(x + 14, y + 12, 8, GOLD);
  const base = y + h - 4;
  const bars: Array<[number, number, number]> = [
    [0, 26, 16],
    [18, 34, 14],
    [34, 20, 20],
    [56, 30, 14],
    [72, 16, 16],
  ];
  for (const [bx, bw, bh] of bars) {
    rect(x + bx, base - bh, bw, bh, [96, 125, 160]);
    for (let wy = base - bh + 4; wy < base - 3; wy += 6) {
      for (let wx = x + bx + 3; wx < x + bx + bw - 3; wx += 6) {
        put(wx, wy, GOLD);
      }
    }
  }
  vline(x + 41, base - 20 - 8, 8, CREAM);
  tri(x + 38, base - 28, x + 44, base - 28, x + 41, base - 32, RED);
}

function drawWallSt(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [214, 226, 238]);
  // falling candles
  const tops = [10, 18, 30, 44, 58];
  for (let i = 0; i < 5; i++) {
    const cx = x + 14 + i * 20;
    const top = y + tops[i];
    rect(cx, top, 10, 22, RED);
    vline(cx + 5, top - 6, 6, RED);
    vline(cx + 5, top + 22, 6, RED);
  }
  line(x + 8, y + 12, x + w - 8, y + h - 16, RED);
  // red arrow head
  tri(x + w - 8, y + h - 16, x + w - 22, y + h - 20, x + w - 16, y + h - 6, RED);
  drawText(x + 8, y + h - 14, "-5.28%", RED, 1, true);
}

function drawQuake(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [233, 220, 196]);
  // shaking buildings
  rect(x + 10, y + 26, 22, h - 34, [120, 96, 70]);
  rect(x + 40, y + 14, 20, h - 22, [150, 120, 84]);
  rect(x + 68, y + 30, 24, h - 38, [120, 96, 70]);
  for (let i = 0; i < 3; i++) {
    put(x + 14 + i * 6, y + 32, WHITE);
    put(x + 44 + i * 5, y + 20, WHITE);
  }
  // crack
  line(x + 30, y + h - 8, x + 44, y + h - 22, INK);
  line(x + 44, y + h - 22, x + 58, y + h - 10, INK);
  line(x + 58, y + h - 10, x + 74, y + h - 20, INK);
  // shock rings
  ellipse(x + 52, y + 16, 14, 5, RED);
  ellipse(x + 52, y + 16, 22, 8, RED);
  disc(x + 52, y + 16, 3, RED);
}

function drawCricket(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [168, 200, 120]);
  // pitch
  rect(x + 8, y + 10, w - 16, h - 20, [214, 190, 140]);
  // stumps both ends
  for (const sx of [x + 16, x + w - 22]) {
    vline(sx, y + 18, 12, GOLD);
    vline(sx + 3, y + 18, 12, GOLD);
    vline(sx + 6, y + 18, 12, GOLD);
  }
  // batsman
  disc(x + Math.floor(w / 2) - 8, y + 34, 5, WHITE);
  rect(x + Math.floor(w / 2) - 12, y + 40, 9, 18, WHITE);
  line(x + Math.floor(w / 2) - 4, y + 44, x + Math.floor(w / 2) + 10, y + 62, [160, 110, 60]);
  // ball flying
  disc(x + Math.floor(w / 2) + 22, y + 22, 4, RED);
  drawText(x + 10, y + h - 14, "100", INK, 1, true);
}

function drawBitcoin(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [24, 24, 32]);
  disc(x + Math.floor(w / 2), y + Math.floor(h / 2) + 4, 24, DARKGOLD);
  disc(x + Math.floor(w / 2), y + Math.floor(h / 2) + 4, 20, GOLD);
  drawText(x + Math.floor(w / 2) - 9, y + Math.floor(h / 2) - 4, "B", [120, 84, 0], 2, true);
  line(x + 8, y + 12, x + w - 10, y + h - 12, RED);
  tri(x + w - 10, y + h - 12, x + w - 24, y + h - 16, x + w - 18, y + h - 2, RED);
  drawText(x + 8, y + h - 14, "$58,300", WHITE, 1, true);
}

function drawCop(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  disc(x + Math.floor(w / 2), y + 26, 16, [90, 160, 90]);
  ellipse(x + Math.floor(w / 2) - 12, y + 34, 8, 5, [40, 110, 50]);
  ellipse(x + Math.floor(w / 2) + 10, y + 20, 7, 4, [40, 110, 50]);
  // empty chairs row
  for (let i = 0; i < 4; i++) {
    const cx = x + 12 + i * 22;
    rect(cx, y + h - 22, 14, 12, [120, 90, 60]);
    rect(cx, y + h - 30, 14, 8, [120, 90, 60]);
  }
  drawText(x + 8, y + h - 12, "NO DEAL", INK, 1, true);
}

function drawF1(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [30, 30, 40]);
  // rain streaks
  for (let i = 0; i < 8; i++) {
    line(x + 8 + i * 12, y + 6, x + 4 + i * 12, y + 18, [120, 160, 200]);
  }
  // car body
  const cy = y + Math.floor(h / 2) + 4;
  rect(x + 14, cy - 4, 52, 10, RED);
  tri(x + 66, cy - 4, x + 80, cy + 2, x + 66, cy + 6, RED);
  rect(x + 30, cy - 12, 20, 8, RED);
  disc(x + 26, cy + 8, 6, INK);
  disc(x + 62, cy + 8, 6, INK);
  disc(x + 26, cy + 8, 3, GREY);
  disc(x + 62, cy + 8, 3, GREY);
  // chequered flag
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      if ((r + c) % 2 === 0) rect(x + w - 26 + c * 5, y + 8 + r * 5, 5, 5, WHITE);
      else rect(x + w - 26 + c * 5, y + 8 + r * 5, 5, 5, INK);
    }
  }
  drawText(x + 8, y + h - 12, "1:47.934", WHITE, 1, true);
}

function drawTrumpPutin(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [226, 228, 232]);
  // US flag
  rect(x + 8, y + 10, 34, 22, WHITE);
  for (let s = 0; s < 4; s++) rect(x + 8, y + 10 + s * 6, 34, 3, RED);
  rect(x + 8, y + 10, 14, 12, BLUE);
  // Russian flag
  rect(x + w - 42, y + 10, 34, 22, WHITE);
  rect(x + w - 42, y + 18, 34, 7, BLUE);
  rect(x + w - 42, y + 25, 34, 7, RED);
  // two figures facing each other across the table line
  disc(x + 25, y + 30, 6, [60, 60, 70]);
  rect(x + 19, y + 36, 12, 18, [60, 60, 70]);
  disc(x + w - 25, y + 30, 6, [90, 70, 50]);
  rect(x + w - 31, y + 36, 12, 18, [90, 70, 50]);
  hline(x + 8, y + h - 4, w - 16, INK);
}

function drawKryvyi(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [40, 34, 48]);
  // building
  rect(x + 12, y + 22, 30, h - 30, [110, 100, 110]);
  rect(x + 50, y + 32, 24, h - 40, [90, 82, 92]);
  for (let wy = y + 28; wy < y + h - 12; wy += 8) {
    put(x + 18, wy, GOLD);
    put(x + 28, wy, GOLD);
    put(x + 56, wy, GOLD);
  }
  // blast
  disc(x + 58, y + 18, 10, GOLD);
  disc(x + 58, y + 18, 6, [255, 120, 40]);
  disc(x + 58, y + 18, 3, WHITE);
  for (let i = 0; i < 6; i++) {
    line(x + 58, y + 18, x + 40 + i * 8, y + 4, GOLD);
  }
  // ambulance cross
  rect(x + w - 26, y + h - 20, 18, 12, WHITE);
  rect(x + w - 20, y + h - 18, 6, 8, RED);
  rect(x + w - 23, y + h - 15, 12, 3, RED);
}

function drawRikers(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [200, 210, 220]);
  // island + water
  rect(x, y + h - 16, w, 16, [60, 110, 150]);
  ellipse(x + Math.floor(w / 2), y + h - 20, 40, 10, [120, 140, 110]);
  // jail block with bars
  rect(x + 22, y + 16, 44, h - 40, [90, 90, 96]);
  for (let i = 0; i < 5; i++) vline(x + 26 + i * 8, y + 20, h - 48, INK);
  rect(x + 22, y + 16, 44, 4, INK);
  rect(x + 22, y + h - 28, 44, 4, INK);
  // sun
  disc(x + w - 16, y + 12, 7, GOLD);
  drawText(x + 8, y + h - 12, "2032", INK, 1, true);
}

function drawFpi(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [232, 240, 230]);
  // rising bars
  const hs = [14, 22, 18, 30, 40];
  for (let i = 0; i < 5; i++) {
    rect(x + 10 + i * 16, y + h - 14 - hs[i], 10, hs[i], i === 4 ? GREEN : TEAL);
  }
  line(x + 8, y + h - 20, x + w - 8, y + 12, GREEN);
  tri(x + w - 8, y + 12, x + w - 20, y + 10, x + w - 14, y + 22, GREEN);
  drawText(x + 8, y + 6, "RS 1.22 LAKH CR", INK, 1, true);
}

function drawGaza(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [220, 205, 180]);
  // flood water
  rect(x, y + h - 22, w, 22, [70, 130, 170]);
  for (let i = 0; i < 5; i++) hline(x + 6 + i * 18, y + h - 14 + (i % 2) * 4, 12, WHITE);
  // aid truck
  rect(x + 12, y + h - 40, 34, 16, WHITE);
  rect(x + 46, y + h - 36, 14, 12, RED);
  disc(x + 22, y + h - 22, 5, INK);
  disc(x + 50, y + h - 22, 5, INK);
  // boxes
  rect(x + 62, y + h - 34, 12, 10, GOLD);
  rect(x + 76, y + h - 30, 10, 8, GOLD);
  drawText(x + 8, y + 6, "AID NOW", INK, 1, true);
}

function drawSaudi(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [20, 30, 50]);
  // shield arc
  for (let a = 0; a <= 180; a += 3) {
    const rad = (a * Math.PI) / 180;
    put(Math.round(x + w / 2 + Math.cos(rad) * 30), Math.round(y + 30 + Math.sin(rad) * 18), GOLD);
  }
  // incoming missile
  line(x + 12, y + 10, x + w / 2 - 6, y + 26, RED);
  tri(x + w / 2 - 6, y + 26, x + w / 2 - 16, y + 22, x + w / 2 - 14, y + 32, RED);
  // burst where stopped
  disc(x + w / 2 + 6, y + 30, 5, GOLD);
  disc(x + w / 2 + 6, y + 30, 2, WHITE);
  // city lights, kept above the RIYADH label
  for (let i = 0; i < 6; i++) {
    rect(x + 10 + i * 14, y + h - 28, 8, 10, [70, 90, 120]);
    put(x + 13 + i * 14, y + h - 24, GOLD);
  }
  drawText(x + 8, y + h - 12, "RIYADH", WHITE, 1, true);
}

function drawNepal(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  disc(x + w - 16, y + 12, 8, GOLD);
  // Himalayas
  tri(x + 4, y + h - 8, x + 30, y + 22, x + 56, y + h - 8, [240, 240, 240]);
  tri(x + 44, y + h - 8, x + 66, y + 30, x + 90, y + h - 8, [200, 205, 215]);
  tri(x + 22, y + 30, x + 30, y + 22, x + 38, y + 30, WHITE);
  // flag
  vline(x + 10, y + h - 34, 26, INK);
  tri(x + 10, y + h - 34, x + 26, y + h - 28, x + 10, y + h - 22, RED);
  tri(x + 10, y + h - 22, x + 24, y + h - 16, x + 10, y + h - 12, RED);
  drawText(x + 34, y + h - 12, "DELHI", INK, 1, true);
}

// ---------- story data ----------
type Story = {
  n: number;
  region: string;
  kicker: string;
  head: string;
  body: string;
  src: string;
  pic: (x: number, y: number, w: number, h: number) => void;
  mx: number; // map pin x (map-local)
  my: number; // map pin y (map-local)
};

const HEROES: Story[] = [
  {
    n: 1, region: "NORTH AMERICA", kicker: "1 - NORTH AMERICA - MARKETS",
    head: "WALL ST ROUT: S&P -3.7%, NASDAQ -5.3%",
    body: "DOW -1.9% TO 48,147. S&P AND DOW IN CORRECTION. NVIDIA -14% TO $125.53 AS THE SEC PROBES ITS ACCOUNTS.",
    src: "SOURCE: REUTERS / CNBC", pic: drawWallSt, mx: 88, my: 44,
  },
  {
    n: 2, region: "LATIN AMERICA", kicker: "2 - LATIN AMERICA - QUAKE",
    head: "6.8 QUAKE SHAKES PERU",
    body: "JUNIN, 129 KM DEEP. FELT IN LIMA, 320 KM AWAY. STREETS FILL, CONGRESS EVACUATED. NO DEAD REPORTED.",
    src: "SOURCE: REUTERS", pic: drawQuake, mx: 108, my: 128,
  },
  {
    n: 3, region: "ASIA-PACIFIC", kicker: "3 - ASIA-PACIFIC - SPORT",
    head: "RAHUL 100: INDIA 344-2 AT TEA",
    body: "FIRST INDIAN OPENER WITH TEST 100S IN ALL FOUR SENA LANDS. PADIKKAL 80. NZ MADE 368.",
    src: "SOURCE: AP", pic: drawCricket, mx: 394, my: 118,
  },
];

const MIDS: Story[] = [
  {
    n: 4, region: "GLOBAL", kicker: "4 - GLOBAL - CRYPTO",
    head: "BITCOIN SINKS BELOW $60,000",
    body: "LOWEST SINCE JULY AT ABOUT $58,300. ETHER $1,651. DOWN 25% IN NOVEMBER.",
    src: "REUTERS / CNBC", pic: drawBitcoin, mx: 150, my: 86,
  },
  {
    n: 5, region: "EUROPE", kicker: "5 - EUROPE - CLIMATE",
    head: "COP31 IN OVERTIME: NO DEAL YET",
    body: "TALKS PAST FRIDAY DEADLINE. 3RD DRAFT DUE SATURDAY. FOSSIL FUELS CUT.",
    src: "AP", pic: drawCop, mx: 232, my: 55,
  },
  {
    n: 6, region: "NORTH AMERICA", kicker: "6 - NORTH AMERICA - SPORT",
    head: "NORRIS ON POLE IN WET VEGAS",
    body: "1:47.934 BEATS VERSTAPPEN BY 0.32S. SAINZ 3RD. PIASTRI 5TH. HAMILTON LAST.",
    src: "AP", pic: drawF1, mx: 60, my: 70,
  },
  {
    n: 7, region: "GLOBAL", kicker: "7 - GLOBAL - DIPLOMACY",
    head: "TRUMP: VERY GOOD TALKS WITH PUTIN",
    body: "DEAL POSSIBLE, HE SAYS. NO GUARANTEES FIRST. MOSCOW REJECTS NATO TERMS.",
    src: "REUTERS", pic: drawTrumpPutin, mx: 106, my: 58,
  },
  {
    n: 8, region: "EUROPE", kicker: "8 - EUROPE - WAR",
    head: "MISSILE KILLS 2 IN KRYVYI RIH",
    body: "BOY, 7, AND PARAMEDIC, 20, DEAD. 42 HURT, 4 CHILDREN. DRONES HIT RESCUERS NEXT.",
    src: "LOCAL OFFICIALS", pic: drawKryvyi, mx: 262, my: 38,
  },
  {
    n: 9, region: "NORTH AMERICA", kicker: "9 - NORTH AMERICA - JUSTICE",
    head: "RIKERS ISLAND TO CLOSE BY 2032",
    body: "MAMDANI PLAN: 4 BOROUGH JAILS, BROOKLYN FIRST IN 2029. $146M FOR CARE AND TRAINING.",
    src: "AP / NYC.GOV", pic: drawRikers, mx: 92, my: 70,
  },
  {
    n: 10, region: "ASIA-PACIFIC", kicker: "10 - ASIA-PACIFIC - MONEY",
    head: "RECORD CASH POURS INTO INDIA",
    body: "FOREIGN INVESTORS PUT RS 1.22 LAKH CRORE INTO SHARES IN NOVEMBER. HIGHEST MONTH EVER.",
    src: "THE DAILY SHORT", pic: drawFpi, mx: 300, my: 86,
  },
  {
    n: 11, region: "MIDDLE EAST", kicker: "11 - MIDDLE EAST - AID",
    head: "FOUR NATIONS DEMAND GAZA AID ACCESS",
    body: "AUSTRALIA, CANADA, ITALY AND UK: LET AID IN AT ONCE AS FLOODS ADD TO SUFFERING.",
    src: "PARIS EYE", pic: drawGaza, mx: 242, my: 74,
  },
  {
    n: 12, region: "MIDDLE EAST", kicker: "12 - MIDDLE EAST - CONFLICT",
    head: "SAUDIS STOP MISSILES OVER RIYADH",
    body: "COALITION INTERCEPTS HOUTHI MISSILES AND STRIKES HODEIDAH IN REPLY.",
    src: "ONE TURN", pic: drawSaudi, mx: 265, my: 84,
  },
  {
    n: 13, region: "ASIA-PACIFIC", kicker: "13 - ASIA-PACIFIC - DIPLOMACY",
    head: "NEPAL PM HEADS TO DELHI",
    body: "BALENDRA SHAH ARRIVES SUNDAY FOR A TWO-DAY STATE VISIT, HIS FIRST TRIP ABROAD AS PM.",
    src: "THE DAILY SHORT", pic: drawNepal, mx: 315, my: 70,
  },
];

const BRIEFS: string[] = [
  "14 GOLD AT 14-MONTH LOW $3,520",
  "15 STI SINKS 2.1% BELOW 5,000",
  "16 PALISADES ARSON JURY CONVICTS",
  "17 TRUMP: PENALTY FOR CENTRES ABROAD",
  "18 TRUMP RAISED HUANG WITH XI",
  "19 CONGRESS RACES TO AVOID SHUTDOWN",
  "20 BANKS HIT IN VENDOR CYBERATTACK",
  "21 NEW HYUNDAI ELANTRA DEBUTS IN LA",
  "22 CHEETAH HAS FOUR CUBS AT KUNO",
  "23 JAPAN TO DRILL LIVE FIRE IN INDIA",
  "24 PAKISTAN MINISTER ARRIVES IN DELHI",
  "25 10,000 ROHINGYA TO MOVE TO TURKIYE",
  "26 FRANCE PROTESTS FOR 4TH WEEKEND",
  "27 US DETAILS $12BN VENEZUELA OIL CASH",
  "28 CHINA WARNS HIKERS OFF MT FUJI",
  "29 BOLSONARO TAKEN TO HOSPITAL",
  "30 GERMAN GROUPS EYE TIKTOK EUROPE BUY",
  "31 AKVAN AFTERMATH: ODISHA COUNTS COST",
  "32 PANCREATIC CANCER PILL BREAKTHROUGH",
  "33 TRUMP VOWS MORE GLOBAL PETROL",
  "34 UKRAINE CLOSES BEAR TRAP IN KHARKIV",
  "35 HUANG TO TESTIFY AT US SENATE",
  "36 CRYPTO: $1.5BN POSITIONS LIQUIDATED",
  "37 FED DEC HIKE PRICED AT 96%",
  "38 US CONSUMER SENTIMENT EDGES UP",
  "39 NEXT CLIMATE SUMMIT: ADDIS ABABA",
  "40 BESSENT REJECTS HALF-POINT FED HIKE",
];

const NUMBERS: Array<[string, string]> = [
  ["6.8", "PERU QUAKE MAGNITUDE"],
  ["-5.28%", "NASDAQ FALLS FRIDAY"],
  ["$58,300", "BITCOIN AT JULY LOW"],
  ["1:47.934", "NORRIS POLE, LAS VEGAS"],
  ["100", "RAHUL, OFF 207 BALLS"],
  ["42", "HURT IN KRYVYI RIH"],
];

const DATECHECK: string[] = [
  "LEFT OUT ON PURPOSE - THEY HAPPENED ON OTHER DAYS: KYIV BRIDGES BOMBED + POLAND MISSILES (FRI 20 NOV) -",
  "EU 7.9BN EUROS TO KYIV (20 NOV) - DENMARK PLOT REVEAL (20 NOV) - UK-EU DEALS (20 NOV) - NSE 5TH LARGEST (20 NOV) -",
  "INDONESIA FIRES $30BN (20 NOV) - ICJ MYANMAR RULING (THU 19 NOV) - ANTHROPIC DEBUT (19 NOV) - PETE ROSE PARDON (19 NOV) -",
  "SENATE IRAN VOTE (19 NOV) - EISENKOT MANDATE (7 NOV). NONE OF THEM IS TODAY'S NEWS.",
];

const REGIONS: Array<[string, number, C]> = [
  ["N AMERICA", 13, NAVY2],
  ["ASIA-PACIFIC", 11, TEAL],
  ["GLOBAL", 6, GOLD],
  ["EUROPE", 5, BLUE],
  ["LATIN AMERICA", 3, GREEN],
  ["MIDDLE EAST", 2, RED],
];

// ---------- layout ----------
const MX = 8; // page margin
const CW = W - 2 * MX; // 1008

function panel(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, WHITE);
  rect(x, y, w, 1, INK);
  rect(x, y + h - 1, w, 1, INK);
  rect(x, y, 1, h, INK);
  rect(x + w - 1, y, 1, h, INK);
}

function render(): void {
  rect(0, 0, W, H, PAPER);

  // ---- masthead: the date IS the title ----
  rect(0, 0, W, 88, NAVY);
  drawGlobe(14, 8, 76, 72);
  drawSkyline(934, 8, 82, 72);
  drawText(512 - Math.floor(textW("THE WORLD IN ONE DAY", 2) / 2), 10, "THE WORLD IN ONE DAY", GOLD, 2, true);
  drawText(512 - Math.floor(textW("SATURDAY 21 NOVEMBER 2026", 4) / 2), 28, "SATURDAY 21 NOVEMBER 2026", CREAM, 4, true);
  centerText(512, 66, "40 STORIES - EVERY ONE HAPPENED OR FIRST REPORTED ON THIS DAY", CREAM, 1);
  hline(0, 88, W, RED);
  hline(0, 91, W, RED);

  // ---- numbers strip ----
  const numY = 96;
  const colW = CW / 6;
  for (let i = 0; i < NUMBERS.length; i++) {
    const cx = MX + Math.floor(colW * i + colW / 2);
    centerText(cx, numY, NUMBERS[i][0], RED, 3, true);
    centerText(cx, numY + 26, NUMBERS[i][1], INK, 1);
    if (i > 0) vline(MX + Math.floor(colW * i), numY + 2, 34, GREY);
  }
  hline(MX, 138, CW, INK);

  // ---- region bar ----
  let rx = MX;
  for (const [, count, c] of REGIONS) {
    const seg = Math.floor((count / 40) * CW);
    rect(rx, 146, seg, 8, c);
    rx += seg;
  }
  centerText(
    512, 158,
    "WHERE THE NEWS HAPPENED - N AMERICA 13 - ASIA-PACIFIC 11 - GLOBAL 6 - EUROPE 5 - LATIN AMERICA 3 - MIDDLE EAST 2",
    INK, 1,
  );

  // ---- 3 heroes ----
  const heroW = 328;
  const heroH = 188;
  const heroY = 176;
  for (let i = 0; i < HEROES.length; i++) {
    const s = HEROES[i];
    const x = MX + i * (heroW + 12);
    panel(x, heroY, heroW, heroH);
    drawText(x + 10, heroY + 8, s.kicker, RED, 1, true);
    s.pic(x + 10, heroY + 22, heroW - 20, 84);
    const headLines = wrapText(s.head, heroW - 20, 2, 2);
    headLines.forEach((ln, li) => drawText(x + 10, heroY + 112 + li * 17, ln, INK, 2, true));
    const bodyLines = wrapText(s.body, heroW - 20, 1, 3);
    bodyLines.forEach((ln, li) => drawText(x + 10, heroY + 150 + li * 9, ln, INK, 1));
    drawText(x + 10, heroY + heroH - 12, s.src, GREY, 1);
  }

  // ---- 10 mid stories, 2 rows of 5 ----
  const midW = 193;
  const midH = 148;
  const midGap = 11;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 5; c++) {
      const s = MIDS[r * 5 + c];
      const x = MX + c * (midW + midGap);
      const y = 372 + r * (midH + 8);
      panel(x, y, midW, midH);
      s.pic(x + 6, y + 6, midW - 12, 56);
      const headLines = wrapText(s.head, midW - 12, 1, 2);
      headLines.forEach((ln, li) => drawText(x + 6, y + 66 + li * 9, ln, INK, 1, true));
      const bodyLines = wrapText(s.body, midW - 12, 1, 3);
      bodyLines.forEach((ln, li) => drawText(x + 6, y + 86 + li * 9, ln, GREY, 1));
      drawText(x + 6, y + midH - 12, "SRC: " + s.src, GREY, 1);
    }
  }

  // ---- world map + numbered briefs ----
  const mapX = MX;
  const mapY = 676;
  const mapW = 408;
  const mapH = 176;
  panel(mapX, mapY, mapW, mapH);
  drawText(mapX + 8, mapY + 6, "THE WORLD - 13 DRAWN STORIES PINNED", INK, 1, true);
  const ox = mapX;
  const oy = mapY + 14;
  // oceans
  rect(ox + 1, oy, mapW - 2, 128, [190, 215, 230]);
  // continents
  poly([[28, 18], [70, 8], [118, 14], [132, 30], [120, 52], [96, 66], [60, 60], [34, 44], [22, 30]].map(([a, b]) => [ox + a, oy + b] as [number, number]), [110, 170, 110]);
  poly([[104, 86], [128, 82], [146, 96], [138, 128], [120, 152], [104, 132], [96, 104]].map(([a, b]) => [ox + a, oy + b] as [number, number]), [120, 175, 110]);
  poly([[196, 22], [228, 14], [246, 26], [238, 44], [214, 48], [198, 38]].map(([a, b]) => [ox + a, oy + b] as [number, number]), [110, 170, 110]);
  poly([[200, 58], [236, 54], [252, 70], [244, 104], [222, 128], [206, 104], [196, 78]].map(([a, b]) => [ox + a, oy + b] as [number, number]), [125, 175, 115]);
  poly([[250, 16], [330, 8], [386, 20], [392, 44], [360, 62], [330, 70], [300, 58], [262, 44], [248, 30]].map(([a, b]) => [ox + a, oy + b] as [number, number]), [110, 170, 110]);
  poly([[336, 128], [372, 122], [388, 134], [372, 150], [340, 146]].map(([a, b]) => [ox + a, oy + b] as [number, number]), [130, 175, 120]);
  // pins 1..13
  for (const s of [...HEROES, ...MIDS]) {
    const px = ox + s.mx;
    const py = oy + s.my;
    disc(px, py, 8, RED);
    const label = String(s.n);
    drawText(px - Math.floor(textW(label, 1) / 2), py - 3, label, WHITE, 1, true);
  }
  drawText(mapX + 8, mapY + mapH - 26, "1 WALL ST  2 PERU  3 CRICKET  4 BITCOIN  5 COP31  6 F1", INK, 1);
  drawText(mapX + 8, mapY + mapH - 15, "7 TRUMP-PUTIN 8 KRYVYI 9 RIKERS 10 FPI 11 GAZA 12 SAUDI 13 NEPAL", INK, 1);

  // briefs, two columns
  const briefX0 = 428;
  const briefX1 = 720;
  const briefW = 288;
  drawText(briefX0, mapY + 6, "THE REST OF THE DAY - 27 MORE STORIES", INK, 1, true);
  for (let i = 0; i < BRIEFS.length; i++) {
    const col = i < 14 ? 0 : 1;
    const row = i < 14 ? i : i - 14;
    const bx = col === 0 ? briefX0 : briefX1;
    drawText(bx, mapY + 20 + row * 12, BRIEFS[i], INK, 1);
  }

  // ---- DATE CHECK ----
  const dcY = 860;
  rect(MX, dcY, CW, 64, [255, 244, 230]);
  rect(MX, dcY, CW, 2, RED);
  rect(MX, dcY + 62, CW, 2, RED);
  drawText(MX + 8, dcY + 6, "DATE CHECK - NOT TODAY", RED, 1, true);
  DATECHECK.forEach((ln, li) => drawText(MX + 8, dcY + 18 + li * 9, ln, INK, 1));

  // ---- footer ----
  const ftY = 936;
  hline(MX, ftY, CW, INK);
  drawText(MX, ftY + 8, "SOURCES: REUTERS - AP - CNBC - NYC.GOV - THE DAILY SHORT - PARIS EYE - OBSERVER VOICE - JAGRAN JOSH - HOMEVO - KUCOIN", INK, 1);
  drawText(MX, ftY + 20, "BYTES EU - ASIA TODAY - LOCAL OFFICIALS IN KRYVYI RIH. EVERY STORY HAPPENED, OR WAS FIRST REPORTED, ON 21 NOVEMBER 2026.", INK, 1);
  drawText(MX, ftY + 32, "DRAWN ENTIRELY IN CODE - NO PHOTOGRAPHS - ONE DETERMINISTIC PNG - 40 STORIES IN ALL.", INK, 1);
  centerText(512, ftY + 48, "THE WORLD IN ONE DAY - SATURDAY 21 NOVEMBER 2026", GREY, 1);
}

function main(): void {
  render();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const png = encodePNG(W, H, pxBuf);
  writeFileSync(join(outDir, "entry.png"), png);
}

main();
