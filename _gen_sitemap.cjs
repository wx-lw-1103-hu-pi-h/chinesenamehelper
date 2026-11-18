/* Generate sitemap.xml and robots.txt from the pages that actually exist.
 *
 * Two things matter here and both are easy to get wrong:
 *
 *   1. List per locale. /pt/ and /ko/ are separate URLs with their own
 *      canonicals, so a sitemap that lists only the English set never even
 *      offers the translations for crawling.
 *
 *   2. Carry the alternate set on every entry. The sitemap xhtml:link block is
 *      how a crawler learns that /pt/character/明/ and /character/明/ are the
 *      same page in two languages without having to fetch both first.
 *
 * Only pages on disk are listed — a sitemap full of 404s is worse than none —
 * and only for locales in SHIPPED, so /ja/ and /es/ stay out of the file even
 * though their strings exist.
 */
const fs = require('fs');
const path = require('path');
/* 显式带上 index.cjs：目录里的 .cjs 不会成为 require('./_i18n') 的入口。 */
const i18n = require('./_i18n/index.cjs');
const { ORIGIN, SHIPPED, getLang, href } = i18n;

const ROOT = path.join(__dirname, 'site');
/* Same single source of truth as the page generators — a sitemap pointing at a
   different host than the canonicals is a silent deindexing bug. */
const BASE = ORIGIN;
const g = globalThis;

['characters.js', 'characters2.js'].forEach(f => {
  const src = fs.readFileSync(path.join(ROOT, 'assets', 'data', f), 'utf8');
  new Function('window', src)(g);
});
const CHARS = [...new Set([].concat(g.HANZI, g.HANZI2).map(c => c.c))];

/* Page inventory: the locale-relative path plus how it should be weighted.
   `enOnly` marks the pages that have not been translated yet, so they are
   listed once rather than claimed for every language. */
const PAGES = [
  { p: '/', priority: '1.0', changefreq: 'weekly' },
  { p: '/characters/', priority: '0.8', changefreq: 'monthly' },
  { p: '/gifts/', priority: '0.8', changefreq: 'monthly' },
  { p: '/stroke-order/', priority: '0.9', changefreq: 'monthly', enOnly: true },
  { p: '/hanzi-to-pinyin/', priority: '0.9', changefreq: 'monthly', enOnly: true },
  { p: '/my-name-in-chinese/', priority: '0.8', changefreq: 'monthly', enOnly: true }
];

/* One entry per carrier page, read from the same catalogue the generator uses.
   Hard-coding them here would let the sitemap and the pages disagree after a
   carrier is added, which is exactly the kind of silent gap the earlier
   single-language sitemap had. */
require('./_gifts/catalog.cjs').forEach(function (item) {
  PAGES.push({ p: '/gifts/' + item.slug + '/', priority: '0.7', changefreq: 'monthly' });
});

function exists(code, p) {
  /* The URL is percent-encoded but the directory on disk is the literal
     character: /character/%E6%98%8E/ lives in site/character/明/. Checking the
     encoded path would report every character page missing. */
  const rel = p === '/' ? '' : decodeURIComponent(p);
  const dir = path.join(ROOT, getLang(code).prefix, rel);
  return fs.existsSync(path.join(dir, 'index.html'));
}

const urls = [];
const today = new Date().toISOString().slice(0, 10);

function entry(code, p, priority, changefreq, alternates) {
  const loc = BASE + href(code, p);
  urls.push({ loc, priority, changefreq, alternates });
}

/* The alternate set for one page, as sitemap xhtml:link entries. Includes the
   page itself, the same rule the <link rel="alternate"> block follows. */
function alternatesFor(p) {
  const out = SHIPPED.filter(function (code) { return exists(code, p); }).map(function (code) {
    return { lang: getLang(code).htmlLang, loc: BASE + href(code, p) };
  });
  const enLoc = BASE + href('en', p);
  out.push({ lang: 'x-default', loc: enLoc });
  return out;
}

/* Number of real languages in the alternate set, x-default excluded. A page
   that exists in only one language has no cluster to declare. */
function altLangCount(alts) {
  return alts.filter(function (a) { return a.lang !== 'x-default'; }).length;
}

PAGES.forEach(function (item) {
  const alts = alternatesFor(item.p);
  const langs = altLangCount(alts);
  SHIPPED.forEach(function (code) {
    if (!exists(code, item.p)) return;
    if (item.enOnly && code !== 'en') return;
    entry(code, item.p, item.priority, item.changefreq, langs > 1 ? alts : null);
  });
});

CHARS.forEach(function (ch) {
  const p = '/character/' + encodeURIComponent(ch) + '/';
  const alts = alternatesFor(p);
  const langs = altLangCount(alts);
  SHIPPED.forEach(function (code) {
    if (!exists(code, p)) return;
    entry(code, p, '0.6', 'yearly', langs > 1 ? alts : null);
  });
});

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  urls.map(function (u) {
    let block = '  <url>\n' +
      '    <loc>' + u.loc + '</loc>\n' +
      '    <lastmod>' + today + '</lastmod>\n' +
      '    <changefreq>' + u.changefreq + '</changefreq>\n' +
      '    <priority>' + u.priority + '</priority>\n';
    if (u.alternates) {
      block += u.alternates.map(function (a) {
        return '    <xhtml:link rel="alternate" hreflang="' + a.lang + '" href="' + a.loc + '"/>\n';
      }).join('');
    }
    return block + '  </url>';
  }).join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');

/* robots.txt — everything is public and static, so keep it permissive and
   just point at the sitemap. */
fs.writeFileSync(path.join(ROOT, 'robots.txt'),
  'User-agent: *\n' +
  'Allow: /\n\n' +
  'Sitemap: ' + BASE + '/sitemap.xml\n', 'utf8');

/* Per-locale counts, so a silent loss of 120 pages is visible in the build log
   rather than discovered in Search Console three weeks later. */
const counts = {};
urls.forEach(function (u) {
  const m = /^https:\/\/[^/]+\/(?:([a-z]{2})\/)?/.exec(u.loc);
  const code = m && m[1] ? m[1] : 'en';
  counts[code] = (counts[code] || 0) + 1;
});
console.log('sitemap: ' + urls.length + ' urls | ' +
  Object.keys(counts).map(function (c) { return c + '=' + counts[c]; }).join(' ') +
  ' | robots.txt written');
