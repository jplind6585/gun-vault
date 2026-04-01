// Generates icon-192.png and icon-512.png for PWA manifest
// Design: dark bg (#07071a) with yellow crosshair/target motif (#ffd43b)
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CRC32 ──────────────────────────────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const c = Buffer.allocUnsafe(4);
  c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, c]);
}

// ── Draw icon ──────────────────────────────────────────────────────────────────
function makeIcon(size) {
  const BG = [7, 7, 26];      // #07071a
  const FG = [255, 212, 59];  // #ffd43b

  const px = new Uint8Array(size * size * 3).fill(0);
  for (let i = 0; i < size * size; i++) {
    px[i * 3] = BG[0]; px[i * 3 + 1] = BG[1]; px[i * 3 + 2] = BG[2];
  }

  const set = (x, y, c) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    px[(y * size + x) * 3] = c[0];
    px[(y * size + x) * 3 + 1] = c[1];
    px[(y * size + x) * 3 + 2] = c[2];
  };

  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const r1 = Math.floor(size * 0.38);   // outer ring
  const r2 = Math.floor(size * 0.22);   // inner ring
  const lw = Math.max(2, Math.floor(size / 32));

  // Draw rings
  for (let a = 0; a < 720; a++) {
    const rad = (a / 720) * 2 * Math.PI;
    for (let w = 0; w < lw; w++) {
      for (const r of [r1, r2]) {
        set(Math.round(cx + (r + w - lw / 2) * Math.cos(rad)),
            Math.round(cy + (r + w - lw / 2) * Math.sin(rad)), FG);
      }
    }
  }

  // Draw crosshair lines (skipping the inner ring gap)
  const arm = Math.floor(size * 0.44);
  for (let w = -Math.floor(lw / 2); w <= Math.floor(lw / 2); w++) {
    for (let d = r2 + lw + 1; d <= arm; d++) {
      set(cx + d, cy + w, FG);
      set(cx - d, cy + w, FG);
      set(cx + w, cy + d, FG);
      set(cx + w, cy - d, FG);
    }
  }

  // Center dot
  for (let dy = -lw; dy <= lw; dy++) {
    for (let dx = -lw; dx <= lw; dx++) {
      if (dx * dx + dy * dy <= lw * lw + 1) set(cx + dx, cy + dy, FG);
    }
  }

  // Build PNG
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.allocUnsafe(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0; // filter = None
    for (let x = 0; x < size; x++) {
      raw[y * (1 + size * 3) + 1 + x * 3] = px[(y * size + x) * 3];
      raw[y * (1 + size * 3) + 1 + x * 3 + 1] = px[(y * size + x) * 3 + 1];
      raw[y * (1 + size * 3) + 1 + x * 3 + 2] = px[(y * size + x) * 3 + 2];
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Write files ────────────────────────────────────────────────────────────────
const outDir = join(__dirname, '..', 'web', 'public');

for (const size of [192, 512]) {
  const data = makeIcon(size);
  const path = join(outDir, `icon-${size}.png`);
  writeFileSync(path, data);
  console.log(`✓ icon-${size}.png  (${data.length} bytes)`);
}
