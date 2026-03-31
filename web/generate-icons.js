// Run once: node generate-icons.js
// Generates icon-192.png and icon-512.png in public/ from the favicon SVG
// Requires: npm install --save-dev sharp (or just run it; sharp is common)
//
// If you don't want to install sharp, open generate-icons.html in your browser instead.

import { readFileSync, writeFileSync } from 'fs';
import { createCanvas } from 'canvas'; // npm install canvas

const svg = readFileSync('./public/favicon.svg', 'utf8');

async function generate(size, outPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#07071a';
  ctx.fillRect(0, 0, size, size);

  // Draw a simple gun vault icon (amber on dark)
  ctx.fillStyle = '#ffd43b';
  const s = size * 0.55;
  const x = (size - s) / 2;
  const y = (size - s * 0.85) / 2;

  // Simple vault door icon
  ctx.beginPath();
  ctx.roundRect(x, y, s, s * 0.85, s * 0.1);
  ctx.fill();

  ctx.fillStyle = '#07071a';
  ctx.beginPath();
  ctx.arc(size / 2, y + s * 0.42, s * 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd43b';
  ctx.beginPath();
  ctx.arc(size / 2, y + s * 0.42, s * 0.10, 0, Math.PI * 2);
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(outPath, buffer);
  console.log(`✅ Generated ${outPath}`);
}

generate(192, './public/icon-192.png').catch(() => {
  console.log('canvas module not available — use generate-icons.html instead');
});
generate(512, './public/icon-512.png').catch(() => {});
