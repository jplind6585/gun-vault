#!/usr/bin/env node
/**
 * syncLegal.mjs — Regenerates the website's privacy.html and terms.html
 * from the single source of truth: src/legalContent.json
 *
 * Usage: npm run sync-legal
 *
 * Run this any time you edit legalContent.json, then deploy the website.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');
const websiteDir = resolve(root, '../../lindcott-armory-web');

const legal = JSON.parse(readFileSync(resolve(root, 'src/legalContent.json'), 'utf8'));
const { meta } = legal;

// ── Block → HTML renderer ──────────────────────────────────────────────────────

function blocksToHtml(blocks) {
  return blocks.map(block => {
    if (block.type === 'ul') {
      const items = block.items.map(item => `      <li>${item}</li>`).join('\n');
      return `    <ul>\n${items}\n    </ul>`;
    }
    const strong = block.strong ? `<strong>${block.strong}</strong> ` : '';
    return `    <p>${strong}${block.text}</p>`;
  }).join('\n');
}

// ── Page template ──────────────────────────────────────────────────────────────

function buildPage({ title, metaDesc, canonicalPath, heroTitle, heroIntro, shortVersion, sections }) {
  const sectionsHtml = sections.map(s => {
    return `    <h2>${s.heading}</h2>\n${blocksToHtml(s.blocks)}`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Lindcott Armory</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="https://lindcottarmory.com${canonicalPath}">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>

<nav class="site-nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo">Lindcott <span>Armory</span></a>
    <button class="nav-mobile-toggle" onclick="document.querySelector('.nav-links').classList.toggle('open')">☰</button>
    <ul class="nav-links">
      <li><a href="/field-guide/">Field Guide</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/contact.html">Contact</a></li>
      <li><a href="/contact.html" class="nav-cta">Download App</a></li>
    </ul>
  </div>
</nav>

<div class="page-hero">
  <div class="wrap">
    <div class="label">Legal</div>
    <h1>${heroTitle}</h1>
    <p>Effective date: ${meta.effectiveDateFull}. ${heroIntro}</p>
  </div>
</div>

<div style="max-width:720px;margin:0 auto;padding:48px 24px 80px;">
  <div class="prose">

    <h2>The Short Version</h2>
    <p>${shortVersion}</p>

${sectionsHtml}

  </div>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-logo">Lindcott Armory · ${meta.company}</div>
    <div class="footer-links">
      <a href="/field-guide/">Field Guide</a>
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/terms.html">Terms of Service</a>
    </div>
    <div class="footer-copy">© 2026 ${meta.company}. All rights reserved.</div>
  </div>
</footer>

</body>
</html>
`;
}

// ── Generate privacy.html ──────────────────────────────────────────────────────

const privacyHtml = buildPage({
  title: 'Privacy Policy',
  metaDesc: `Lindcott Armory's privacy policy. Your firearm data stays on your device by default. No ads, no data sales, no analytics tracking.`,
  canonicalPath: '/privacy.html',
  heroTitle: 'Privacy Policy',
  heroIntro: `${meta.company} operates the Lindcott Armory mobile application and website. This policy explains what data we collect, how we use it, and your rights regarding that data.`,
  shortVersion: legal.privacy.shortVersion,
  sections: legal.privacy.sections,
});

writeFileSync(resolve(websiteDir, 'privacy.html'), privacyHtml);
console.log('✅ Wrote privacy.html');

// ── Generate terms.html ────────────────────────────────────────────────────────

const termsHtml = buildPage({
  title: 'Terms of Service',
  metaDesc: `Terms of Service for Lindcott Armory. The app is for lawful gun owners 18 and older. Record-keeping only — no facilitation of illegal activity.`,
  canonicalPath: '/terms.html',
  heroTitle: 'Terms of Service',
  heroIntro: `These Terms of Service ("Terms") govern your use of the Lindcott Armory mobile application and website operated by ${meta.company}.`,
  shortVersion: legal.terms.shortVersion,
  sections: legal.terms.sections,
});

writeFileSync(resolve(websiteDir, 'terms.html'), termsHtml);
console.log('✅ Wrote terms.html');

console.log(`\nBoth files updated from legalContent.json.`);
console.log(`Company: ${meta.company}`);
console.log(`Contact: ${meta.contactEmail}`);
console.log(`Effective: ${meta.effectiveDateFull}`);
