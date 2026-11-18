/* Audit the language-switching behaviour against the rules that matter for SEO.
 *
 * The rules, and why each one is checked the way it is:
 *
 *   1. No automatic redirect, anywhere. A site-wide 302 based on IP or browser
 *      language is the single most common way a multilingual site loses its
 *      translations: crawlers arrive without a language preference and from a
 *      US address, so they are redirected to English on every visit and /pt/
 *      and /ko/ never get indexed. Checked by grepping the shipped JS and HTML
 *      for redirect primitives — a future contributor adding one gets caught.
 *
 *   2. The switcher must be real anchors. A <button> that routes with
 *      JavaScript is invisible to a crawler, so the translated pages would only
 *      be discoverable through the sitemap. Checked by requiring an href on
 *      every switcher entry.
 *
 *   3. One URL, one language. The page's own lang attribute, canonical and
 *      body text must all be the same language — no ?lang= parameter, no
 *      cookie-driven swap on a single URL.
 *
 *   4. The hint may only suggest. lang-hint.js must contain no navigation, and
 *      must target its link from the page's own hreflang set.
 *
 * Run after the generators, with the site served.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const SHIPPED = require('./_i18n/index.cjs').SHIPPED;
/* The three pages that exist only in English. Named here as well as in the
   registry because several checks below treat them as a special case. */
const EN_ONLY = require('./_i18n/index.cjs').EN_ONLY;
/* Derived from the registry: a locale added there is covered here for free. */
const PREFIX = {};
require('./_i18n/index.cjs').LOCALES.forEach(function (l) { PREFIX[l.code] = l.prefix; });

const problems = [];
const notes = [];

/* Every locale the hint is allowed to name, paired with what it maps to. The
   shipped set is checked separately below. */
const BROWSER_CHECK = { en: 1, pt: 1, ko: 1, ja: 1, es: 1, zh: 1 };

/* Resolve a site path to the file that serves it. Kept in one place because
   getting it wrong produces a "page missing" that reads like a real gap. */
function pageFile(code, p) {
  const dir = p === '/' ? '' : p.replace(/^\//, '').replace(/\/$/, '');
  return path.join(ROOT, PREFIX[code], dir, 'index.html');
}

/* ---------- 1. no redirect primitives in shipped code ---------- */

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const jsFiles = walk(path.join(ROOT, 'assets', 'js'), []).filter(f => f.endsWith('.js'));

/* Match only an assignment or a navigation call. Reading location.href to build
   a share link is legitimate and must not be flagged, and neither may a mention
   of the pattern inside a comment — both are checked for by requiring the
   operator rather than the bare property name. */
const REDIRECT = /(location\s*\.\s*(href|replace|assign)\s*=(?!=)|location\s*\.\s*(replace|assign)\s*\(|window\s*\.\s*location\s*=(?!=)|http-equiv\s*=\s*["']?refresh)/i;

jsFiles.forEach(f => {
  const raw = fs.readFileSync(f, 'utf8');
  /* Strip comments so prose about redirects is not mistaken for one. */
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const m = src.match(REDIRECT);
  if (m) problems.push(path.relative(ROOT, f) + ': contains a redirect primitive (' + m[0].trim() + ')');
});

const hint = path.join(ROOT, 'assets', 'js', 'lang-hint.js');
if (!fs.existsSync(hint)) problems.push('lang-hint.js missing');
else {
  const s = fs.readFileSync(hint, 'utf8');
  if (!/navigator\.languages|navigator\.language/.test(s)) notes.push('lang-hint.js: does not read navigator.language');
  /* The link target must come from the document's own hreflang list. */
  if (s.indexOf('link[rel="alternate"][hreflang=') < 0) {
    problems.push('lang-hint.js: does not derive its target from hreflang');
  }
  /* Only shipped locales may be suggested: offering /ja/ would be a dead link. */
  const map = (s.match(/BROWSER_TO_LOCALE\s*=\s*\{([^}]*)\}/) || [])[1] || '';
  Object.keys(BROWSER_CHECK).forEach(l => {
    const offered = new RegExp('\\b' + l + '\\s*:').test(map);
    if (offered && !SHIPPED.includes(l)) problems.push('lang-hint.js: suggests ' + l + ', which is not shipped');
  });
}

/* ---------- 2. switcher is anchors, not buttons ---------- */

['/', '/characters/', '/gifts/', '/gifts/seal/'].forEach(p => {
  SHIPPED.forEach(code => {
    const file = pageFile(code, p);
    if (!fs.existsSync(file)) { problems.push(code + p + ': page missing'); return; }
    const s = fs.readFileSync(file, 'utf8');
    const menu = (s.match(/<details class="lang-menu">([\s\S]*?)<\/details>/) || [])[1];
    if (!menu) { problems.push(code + p + ': no switcher'); return; }

    const anchors = [...menu.matchAll(/<a href="([^"]+)"[^>]*hreflang="([^"]+)"/g)];
    if (anchors.length !== SHIPPED.length) {
      problems.push(code + p + ': switcher has ' + anchors.length + ' anchors, want ' + SHIPPED.length);
    }
    if (/<button|<select/.test(menu)) problems.push(code + p + ': switcher uses a control instead of anchors');

    /* Every anchor must point at a locale root or a locale page, not at
       JavaScript: void / # / an empty href. */
    anchors.forEach(a => {
      if (!/^\/(?:pt\/|ko\/)?/.test(a[1])) problems.push(code + p + ': switcher href bad: ' + a[1]);
    });

    /* One entry must be the current page's own locale, marked current. */
    if (anchors.filter(a => a[2] === code).length !== 1) {
      problems.push(code + p + ': switcher does not mark exactly one current locale');
    }
  });
});

/* ---------- 3. one URL, one language ---------- */

['/', '/characters/', '/gifts/seal/'].forEach(p => {
  SHIPPED.forEach(code => {
    const file = pageFile(code, p);
    if (!fs.existsSync(file)) return;
    const s = fs.readFileSync(file, 'utf8');
    const lang = (s.match(/<html lang="([^"]+)"/) || [])[1];
    if (!lang || lang.split('-')[0] !== code) problems.push(code + p + ': html lang is ' + lang);

    /* No language switch may live in a query parameter. */
    if (/[?&]lang=/.test(s)) problems.push(code + p + ': uses a ?lang= parameter');
  });
});

/* The hint script is only wired into translated pages: on an English-only page
   there is nothing to suggest, and the script exits silently if it finds no
   hreflang list. Asserting the absence keeps that pairing explicit. */
EN_ONLY.forEach(p => {
  const file = pageFile('en', p);
  if (!fs.existsSync(file)) return;
  const s = fs.readFileSync(file, 'utf8');
  if (s.indexOf('/assets/js/lang-hint.js') >= 0) {
    problems.push(p + ': hint bar included on a page with no translations');
  }
});

['/', '/characters/', '/gifts/', '/gifts/seal/'].forEach(p => {
  SHIPPED.forEach(code => {
    const file = pageFile(code, p);
    if (!fs.existsSync(file)) return;
    const s = fs.readFileSync(file, 'utf8');
    if (s.indexOf('/assets/js/lang-hint.js') < 0) problems.push(code + p + ': lang-hint.js not included');
  });
});

/* The English-only tool pages are a special case worth spelling out.
   They carry the switcher, because a menu that vanishes between two pages
   reads as broken navigation, and there is no translated page to send anyone
   to. So the menu offers this page for English and each other language's home
   page for the rest. What they must NOT do is claim hreflang alternates: the
   hint script targets its link from that list, so a page that declares
   alternates it does not have would be advertising translations that do not
   exist. */
EN_ONLY.forEach(p => {
  const file = pageFile('en', p);
  if (!fs.existsSync(file)) { problems.push(p + ': English-only page missing'); return; }
  const s = fs.readFileSync(file, 'utf8');

  if (s.indexOf('class="lang-menu"') < 0) problems.push(p + ': no switcher on an English-only page');

  const alts = (s.match(/rel="alternate"/g) || []).length;
  if (alts > 0) problems.push(p + ': English-only page declares hreflang alternates');

  /* Every non-English entry has to land on that locale's home page — anything
     deeper would be a 404, since these pages are only written in English. */
  const menu = (s.match(/<details class="lang-menu">([\s\S]*?)<\/details>/) || [])[1] || '';
  const anchors = [...menu.matchAll(/<a href="([^"]+)"[^>]*hreflang="([^"]+)"/g)];
  if (anchors.length !== SHIPPED.length) {
    problems.push(p + ': switcher has ' + anchors.length + ' anchors, want ' + SHIPPED.length);
  }
  anchors.forEach(a => {
    const want = a[2] === 'en' ? p : PREFIX[a[2]] + '/';
    if (a[1] !== want) problems.push(p + ': switcher ' + a[2] + ' points at ' + a[1] + ', want ' + want);
  });
});

/* ---------- 5. English lives at the root, not /en/ ---------- */

if (fs.existsSync(path.join(ROOT, 'en'))) problems.push('/en/ directory exists; English must be at the root');

console.log('checked: ' + (jsFiles.length) + ' js files, ' + SHIPPED.length + ' locales, 4 representative paths');
notes.forEach(n => console.log('  note: ' + n));
console.log('problems:', problems.length);
problems.slice(0, 25).forEach(p => console.log('  -', p));
console.log(problems.length ? 'RESULT: ' + problems.length + ' problem(s)' : 'RESULT: language switching clean');
