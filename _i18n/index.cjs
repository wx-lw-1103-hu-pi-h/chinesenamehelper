/**
 * Locale registry and the helpers every generator shares.
 *
 * The site is generated, not fetched: each language is a full set of static
 * pages, so a crawler sees /ja/ as Japanese HTML rather than English HTML that
 * swaps strings after load. That is the only version of "multilingual" that
 * earns its own search entries.
 *
 * English lives at the root, every other language sits under its own prefix.
 * `href()` is the single place that knows this, so a page built for Japanese
 * never hand-writes a path that drops the prefix.
 *
 *   const { LOCALES, load, href } = require('./_i18n');
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;

/* Order matters: it is the order of the switcher and of the hreflang block. */
const LOCALES = [
  { code: 'en', name: 'English', htmlLang: 'en', prefix: '', ogLocale: 'en_US' },
  { code: 'zh', name: '中文', htmlLang: 'zh-Hans', prefix: '/zh', ogLocale: 'zh_CN' },
  { code: 'ko', name: '한국어', htmlLang: 'ko', prefix: '/ko', ogLocale: 'ko_KR' },
  { code: 'ja', name: '日本語', htmlLang: 'ja', prefix: '/ja', ogLocale: 'ja_JP' },
  { code: 'es', name: 'Español', htmlLang: 'es', prefix: '/es', ogLocale: 'es_ES' },
  { code: 'pt', name: 'Português', htmlLang: 'pt', prefix: '/pt', ogLocale: 'pt_BR' }
];

const BY_CODE = {};
LOCALES.forEach((l) => { BY_CODE[l.code] = l; });

/* Which locales are actually generated and linked. A hreflang pointing at a page
   that was never built is worse than no hreflang at all: it tells the crawler
   the cluster is broken and the whole set gets discounted.

   Adding a language is three steps: write ui/<code>.cjs, _i18n/chars/<code>.cjs
   and _gifts/text.<code>.cjs, add the code here, re-run the generators. Until
   then the locale stays in LOCALES (so href() still knows its prefix) but is
   not advertised.

   es and zh stay held back. Spanish queries that match this tool are too small
   to be worth a page set, and zh is the source language of the name library
   rather than a market: Chinese speakers do not need their own names explained
   to them. */
const SHIPPED = ['en', 'ja', 'pt', 'ko'];

const ACTIVE = LOCALES.filter((l) => SHIPPED.indexOf(l.code) >= 0);

function getLang(code) {
  const l = BY_CODE[code];
  if (!l) throw new Error('unknown locale: ' + code);
  return l;
}

/* Root-relative path for a locale. `href('ja', '/characters/')` -> /ja/characters/ */
function href(code, p) {
  const prefix = getLang(code).prefix;
  /* The home page is the prefix itself, so /ja/ does not become /ja// */
  const clean = p === '/' ? '/' : p;
  if (!prefix) return clean;
  if (clean === '/') return prefix + '/';
  return prefix + clean;
}

/* Does a real file sit behind this URL? Reading the disk at build time is what
   keeps a link from pointing at a page that was never generated. Only the
   generators call this, never a visitor. */
function built(code, p) {
  const prefix = getLang(code).prefix;
  const rel = p === '/' || p === '' ? '' : p.replace(/^\//, '');
  const dir = path.join(__dirname, '..', 'site', prefix, rel);
  return fs.existsSync(path.join(dir, 'index.html'));
}

/* Routes that exist in every shipped locale. Kept as an explicit list rather
   than a disk check because the generators write in different passes: asking
   the filesystem mid-run would make a page's nav depend on which generator ran
   first. Anything not listed here is still English-only, so link() sends the
   visitor to the English page instead of a 404 under /pt/ or /ko/. */
const TRANSLATED = ['/', '/characters/', '/gifts/'];

/* Pages that will not be translated. They are long explanatory articles, not
   tools: the reader who lands on one is reading English prose, and a machine
   translation of prose about language is worse than the English original.

   They still get the full navigation and the language menu. Dropping the menu
   on three of six nav entries made the site feel like it fell apart halfway
   through, and a visitor who could not read the article had no way out of it.
   Each entry lands on that language's home page rather than a 404, so the menu
   keeps working without claiming a translation that does not exist. */
const EN_ONLY = ['/my-name-in-chinese/', '/hanzi-to-pinyin/', '/stroke-order/'];

function isTranslated(p) {
  if (TRANSLATED.indexOf(p) >= 0) return true;
  /* Character pages are generated per locale for the whole library. */
  if (/^\/character\/[^/]+\/$/.test(p)) return true;
  /* Carrier pages are generated per locale from _gifts/catalog.cjs. */
  return /^\/gifts\/[a-z]+\/$/.test(p);
}

/* A nav link on /pt/ must not land on /pt/my-name-in-chinese/ while that page
   is still English-only: a 404 is worse than a language switch. Point at the
   English page until the translation ships, then add the route to TRANSLATED
   and every existing link starts resolving locally with no template edit. */
function link(code, p) {
  return isTranslated(p) ? href(code, p) : href('en', p);
}

/* Load the UI strings and, when asked, the character translations. */
const cache = {};
function load(code) {
  if (cache[code]) return cache[code];
  const uiPath = path.join(DIR, 'ui', code + '.cjs');
  const charPath = path.join(DIR, 'chars', code + '.cjs');
  const out = {
    lang: getLang(code),
    ui: require(uiPath),
    chars: code === 'en' ? null : (fs.existsSync(charPath) ? require(charPath) : null)
  };
  cache[code] = out;
  return out;
}

/* {name} placeholders, so translated strings stay readable in the data file. */
function fmt(str, vars) {
  if (!vars) return str;
  return String(str).replace(/\{(\w+)\}/g, function (m, k) {
    return vars[k] === undefined || vars[k] === null ? m : String(vars[k]);
  });
}

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Single source of truth for the site origin. Every canonical, hreflang,
   sitemap URL and switcher link is built from this, so moving to another
   domain is a one-line change here (plus the generators that import it). */
const ORIGIN = 'https://chinesenamehelper.com';

/* Site-wide public brand name. Kept next to ORIGIN so a rebrand is a two-line
   change here rather than a search-and-replace across a hundred pages. */
const BRAND = 'Chinese Name Helper';

/* Every page carries the full alternate set, itself included. Search engines
   treat a missing self-reference as a hint that a cluster is incomplete.

   An English-only page gets no alternate block at all. Declaring /pt/ and /ko/
   copies of a page that has only been written in English is a false claim, and
   a cluster that points at 404s is discounted as a whole — worse than silence. */
function hreflang(pathForLocale) {
  const enPath = typeof pathForLocale === 'function' ? pathForLocale('en') : pathForLocale;
  if (!isTranslated(enPath)) return '';
  const lines = ACTIVE.map(function (l) {
    const p = typeof pathForLocale === 'function' ? pathForLocale(l.code) : pathForLocale;
    return '<link rel="alternate" hreflang="' + l.htmlLang + '" href="' + ORIGIN + href(l.code, p) + '">';
  });
  lines.push('<link rel="alternate" hreflang="x-default" href="' + ORIGIN + href('en', enPath) + '">');
  return lines.join('\n');
}

function canonical(code, p) {
  return ORIGIN + href(code, p);
}

/* The switcher is a details/summary menu built from real anchors: crawlers
   follow links, and a <select> would need JavaScript to navigate.

   An English-only page gets the menu too, with every other entry pointing at
   that language's home page. The alternative — leaving the menu off — read as
   the navigation breaking, and left a reader stranded on prose they may not
   understand. */
function langSwitch(code, pathForLocale) {
  const enPath = typeof pathForLocale === 'function' ? pathForLocale('en') : pathForLocale;
  const enOnly = EN_ONLY.indexOf(enPath) >= 0;
  if (!enOnly && !isTranslated(enPath)) return '';
  const current = getLang(code);
  const items = ACTIVE.map(function (l) {
    /* On an English-only page the current locale keeps the reader where they
       are; the others can only offer their own front door. */
    const p = enOnly
      ? (l.code === 'en' ? enPath : '/')
      : (typeof pathForLocale === 'function' ? pathForLocale(l.code) : pathForLocale);
    const on = l.code === code ? ' aria-current="true"' : '';
    return '<a href="' + href(l.code, p) + '" hreflang="' + l.htmlLang + '" lang="' + l.htmlLang + '"' + on + '>' +
      esc(l.name) + '</a>';
  }).join('\n        ');

  return '<details class="lang-menu">\n' +
    '      <summary aria-label="' + esc(current.name) + '">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" stroke="currentColor" stroke-width="1.5"/>' +
    '</svg><span>' + esc(current.name) + '</span></summary>\n' +
    '      <div class="lang-list">\n        ' + items + '\n      </div>\n    </details>';
}

module.exports = {
  LOCALES, ACTIVE, SHIPPED, EN_ONLY, getLang, href, link, built, TRANSLATED, isTranslated,
  load, fmt, esc, hreflang, canonical, langSwitch, ORIGIN, BRAND
};
