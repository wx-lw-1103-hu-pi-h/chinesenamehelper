/* Spot-check the generated multilingual pages: html lang, canonical, the
   alternate set, and that the body text actually comes from the locale file
   rather than from the English record. Run after _gen_chars.cjs. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const i18n = require('./_i18n/index.cjs');
const ORIGIN = i18n.ORIGIN;
const SHIPPED = i18n.SHIPPED;

/* Built from the shipped set: a hand-written en/pt/ko list is how Japanese
   shipped without its character pages being checked at all, and it left an
   "alternates === 4" assertion that fails the moment a fourth locale lands. */
const SUBJECT = '明';
const CASES = [];
SHIPPED.forEach(function (code) {
  const p = code === 'en' ? '' : code + '/';
  CASES.push({ file: p + 'character/' + SUBJECT + '/index.html', code: code, lang: i18n.getLang(code).htmlLang });
  CASES.push({ file: p + 'characters/index.html', code: code, lang: i18n.getLang(code).htmlLang });
});

/* One alternate per shipped locale, plus x-default. */
const WANT_ALTS = SHIPPED.length + 1;

/* Locale-relative path, percent-encoded the way the template encodes it. */
function relPath(file, code) {
  let p = file.replace(/index\.html$/, '');
  if (code !== 'en' && p.indexOf(code + '/') === 0) p = p.slice(code.length + 1);
  return p.split('/').map(encodeURIComponent).join('/');
}

let bad = 0;
CASES.forEach(function (c) {
  const abs = path.join(ROOT, c.file);
  if (!fs.existsSync(abs)) { console.log('MISSING', c.file); bad++; return; }
  const s = fs.readFileSync(abs, 'utf8');

  const rel = relPath(c.file, c.code);
  const selfUrl = ORIGIN + (c.code === 'en' ? '/' : '/' + c.code + '/') + rel;
  const enUrl = ORIGIN + '/' + rel;

  const langM = /<html lang="([^"]+)"/.exec(s);
  const canM = /<link rel="canonical" href="([^"]+)"/.exec(s);
  const alts = s.match(/rel="alternate" hreflang="[^"]+"/g) || [];
  const xdef = /hreflang="x-default" href="([^"]+)"/.exec(s);
  const hasSwitch = /<details class="lang-menu">/.test(s);

  const problems = [];
  if (!langM || langM[1] !== c.lang) problems.push('html lang ' + (langM ? langM[1] : 'none'));
  if (!canM) problems.push('no canonical');
  else if (canM[1] !== selfUrl) problems.push('canonical ' + canM[1] + ' != ' + selfUrl);
  if (alts.length !== WANT_ALTS) problems.push('alternates ' + alts.length + ' (want ' + WANT_ALTS + ')');
  if (!xdef || xdef[1] !== enUrl) problems.push('x-default ' + (xdef ? xdef[1] : 'none'));
  if (!hasSwitch) problems.push('no language switcher');
  /* A double prefix (/pt/pt/) is the classic bug this guards against. */
  const LOCALE_ALT = SHIPPED.filter(function (c) { return c !== 'en'; }).join('|');
  if (new RegExp('/(' + LOCALE_ALT + ')/\\1/').test(s)) problems.push('double locale prefix');

  if (problems.length) bad++;
  console.log((problems.length ? 'FAIL ' : 'ok   ') + c.file.padEnd(34) + (problems.join(' | ') || ''));
});

/* Every page must list the same shipped languages, x-default aside. */
const koPage = path.join(ROOT, 'ko', 'character', SUBJECT, 'index.html');
if (fs.existsSync(koPage)) {
  const s = fs.readFileSync(koPage, 'utf8');
  const langs = (s.match(/hreflang="([^"]+)"/g) || [])
    .map(function (x) { return x.replace(/hreflang="|"/g, ''); })
    .filter(function (x) { return x !== 'x-default'; })
    /* the switcher repeats each language as an <a hreflang>, so dedupe */
    .filter(function (x, i, a) { return a.indexOf(x) === i; })
    .sort().join(',');
  const want = SHIPPED.slice().sort().join(',');
  console.log((langs === want ? 'ok   ' : 'FAIL ') + 'ko alternate set: ' + langs + (langs === want ? '' : ' want ' + want));
  if (langs !== want) bad++;
}

/* The Portuguese page must not be carrying the English gloss. */
const ptPage = path.join(ROOT, 'pt', 'character', SUBJECT, 'index.html');
if (fs.existsSync(ptPage)) {
  const s = fs.readFileSync(ptPage, 'utf8');
  const pt = require('./_i18n/chars/pt.cjs')[SUBJECT];
  const enHit = /A sun and a moon|bright, luminous/.test(s);
  const ptHit = s.indexOf(pt.m) >= 0;
  console.log((ptHit && !enHit ? 'ok   ' : 'FAIL ') + 'pt gloss substituted (pt=' + ptHit + ' en=' + enHit + ')');
  if (!ptHit || enHit) bad++;
}

console.log(bad ? 'RESULT: ' + bad + ' problem(s)' : 'RESULT: pages clean');
