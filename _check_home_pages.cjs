/* Verify the generated home pages: correct lang, self canonical, full
   alternate set, switcher present, no leftover English on the translated
   pages, and no raw {bold}/{em}/{n} placeholder surviving into the HTML. */
const fs = require('fs');
const path = require('path');
const i18n = require('./_i18n/index.cjs');
const ORIGIN = i18n.ORIGIN;
const SHIPPED = i18n.SHIPPED;

const ROOT = path.join(__dirname, 'site');

/* Derived from the shipped set rather than typed out: hard-coding en/pt/ko here
   is how Japanese shipped without being checked, and it left an "alternates
   === 4" assertion that broke the moment a fourth locale appeared. */
const CASES = SHIPPED.map(function (code) {
  return { file: code === 'en' ? 'index.html' : code + '/index.html', code: code };
});

/* One alternate per shipped locale, plus x-default. */
const WANT_ALTS = SHIPPED.length + 1;

let bad = 0;
CASES.forEach(function (c) {
  const abs = path.join(ROOT, c.file);
  if (!fs.existsSync(abs)) { console.log('MISSING ' + c.file); bad++; return; }
  const s = fs.readFileSync(abs, 'utf8');
  const selfUrl = ORIGIN + (c.code === 'en' ? '/' : '/' + c.code + '/');

  const langM = /<html lang="([^"]+)"/.exec(s);
  const canM = /<link rel="canonical" href="([^"]+)"/.exec(s);
  const alts = s.match(/rel="alternate" hreflang="[^"]+"/g) || [];
  const xdef = /hreflang="x-default" href="([^"]+)"/.exec(s);
  const problems = [];

  if (!langM || langM[1] !== c.code) problems.push('html lang ' + (langM ? langM[1] : 'none'));
  if (!canM || canM[1] !== selfUrl) problems.push('canonical ' + (canM ? canM[1] : 'none'));
  if (alts.length !== WANT_ALTS) problems.push('alternates ' + alts.length + ' want ' + WANT_ALTS);
  if (!xdef || xdef[1] !== ORIGIN + '/') problems.push('x-default ' + (xdef ? xdef[1] : 'none'));
  if (!/<details class="lang-menu">/.test(s)) problems.push('no switcher');
  if (/\/(pt|ko|ja)\/\1\//.test(s)) problems.push('double prefix');

  /* A surviving placeholder means fmt() did not get a value it needed. */
  const leftover = s.match(/\{(?:bold|\/bold|em|\/em|n|s|ch|py)\}/g);
  if (leftover) problems.push('raw placeholder ' + leftover.slice(0, 3).join(' '));

  /* Exactly one nav active state per page is not required, but the switcher
     must mark the current language as current. */
  const cur = new RegExp('<a href="[^"]*" hreflang="' + c.code + '"[^>]*aria-current="true"');
  if (!cur.test(s)) problems.push('current language not marked');

  if (problems.length) bad++;
  console.log((problems.length ? 'FAIL ' : 'ok   ') + c.file.padEnd(16) + (problems.join(' | ') || ''));
});

/* English strings that must never appear on the translated pages. */
const EN_MARKERS = [
  'What&#39;s your name', "What's your name", 'Find my Chinese name',
  'Nothing leaves your device', 'Why this is not a transliteration tool',
  'Your Chinese names', 'Another set', 'Nothing you type is uploaded'
];
/* Every translated home page except English itself. */
CASES.filter(function (c) { return c.code !== 'en'; }).forEach(function (c) {
  const s = fs.readFileSync(path.join(ROOT, c.file), 'utf8');
  const hits = EN_MARKERS.filter(function (m) { return s.indexOf(m) >= 0; });
  console.log((hits.length ? 'FAIL ' : 'ok   ') + c.file + ' english leakage: ' + (hits.join(', ') || 'none'));
  if (hits.length) bad++;
});

/* And the translated submit labels must actually be there. */
CASES.filter(function (c) { return c.code !== 'en'; }).forEach(function (c) {
  const s = fs.readFileSync(path.join(ROOT, c.file), 'utf8');
  const want = require('./_i18n/ui/' + c.code + '.cjs')['form.submit'];
  const ok = s.indexOf(want) >= 0;
  console.log((ok ? 'ok   ' : 'FAIL ') + c.code + ' submit label present');
  if (!ok) bad++;
});

/* The form footer must show the real library size, not the old hard-coded 100. */
CASES.forEach(function (c) {
  const s = fs.readFileSync(path.join(ROOT, c.file), 'utf8');
  const m = /<span id="lib-note">([^<]+)</.exec(s);
  const ok = m && /30/.test(m[1]) && !/100/.test(m[1]);
  console.log((ok ? 'ok   ' : 'FAIL ') + c.code + ' lib-note: ' + (m ? m[1].trim() : 'none'));
  if (!ok) bad++;
});

console.log(bad ? 'RESULT: ' + bad + ' problem(s)' : 'RESULT: home pages clean');
