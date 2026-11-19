/* Crawl the built site over HTTP and assert what a search engine reads.
 *
 * The site is no longer English-only: /pt/ and /ko/ are real page sets with
 * their own canonicals. A crawl that only walks the root routes would pass
 * while every translated page is quietly broken, so each locale is walked on
 * its own and the language cluster is checked from both ends — a page must
 * point at its siblings, and must not claim a sibling that was never built.
 *
 * Run the generators first, then _serve.cjs, then this.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 8777;

function get(p) {
  return new Promise(resolve => {
    const req = http.get({ host: HOST, port: PORT, path: p }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body, type: res.headers['content-type'] || '' }));
    });
    req.on('error', e => resolve({ status: 0, body: '', err: e.message }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: 0, body: '', err: 'timeout' }); });
  });
}

const i18n = require('./_i18n/index.cjs');
const { SHIPPED, ORIGIN, getLang, href, isTranslated } = i18n;

const g = globalThis;
['characters.js', 'characters2.js'].forEach(f => {
  const src = fs.readFileSync(path.join(__dirname, 'site/assets/data', f), 'utf8');
  new Function('window', src)(g);
});
const CHARS = [...new Set([].concat(g.HANZI, g.HANZI2).map(c => c.c))];

/* Pages that exist in every shipped locale. */
const SHARED = ['/', '/characters/', '/gifts/']
  .concat(CHARS.map(c => '/character/' + encodeURIComponent(c) + '/'))
  .concat(require('./_gifts/catalog.cjs').map(item => '/gifts/' + item.slug + '/'));

/* Pages still written in English only. They are crawled once, from the root,
   and are the reason isTranslated() has to exist: /pt/ links back to them. */
const EN_ONLY = ['/my-name-in-chinese/', '/hanzi-to-pinyin/', '/stroke-order/'];

function pagesFor(code) {
  const list = code === 'en' ? SHARED.concat(EN_ONLY) : SHARED;
  return list.map(p => ({ code, p, url: href(code, p) }));
}

const PAGES = SHIPPED.reduce((acc, code) => acc.concat(pagesFor(code)), []);
const KNOWN = new Set(PAGES.map(x => x.url));

/* Every route a link may legitimately point at, plus the files served as
   themselves rather than as routes. The three sitemaps are here because a page
   links at none of them but the crawl requests each child below. */
const STATIC_FILES = ['/favicon.svg', '/robots.txt', '/sitemap.xml', '/sitemap-core.xml',
  '/sitemap-characters.xml', '/sitemap-gifts.xml'];

/* The alternate set a page is supposed to declare. The switcher is rendered
   from the same list, so an empty answer means "this page is English-only"
   and any <link rel="alternate"> on it is a false claim. */
function expectedAlternates(p) {
  if (!isTranslated(p)) return [];
  const out = SHIPPED.map(code => ({ lang: getLang(code).htmlLang, url: href(code, p) }));
  out.push({ lang: 'x-default', url: href('en', p) });
  /* Absolute, because that is what the page emits: both sides are compared as
     crawler-visible URLs, not as paths that happen to line up. */
  return out.map(a => a.lang + ' ' + ORIGIN + a.url).sort();
}

function actualAlternates(body) {
  const out = [];
  const re = /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g;
  let m;
  while ((m = re.exec(body))) out.push(m[1] + ' ' + m[2]);
  return out.sort();
}

(async () => {
  let ok = 0;
  const bad = [];
  const problems = [];
  const perLocale = {};

  for (const pg of PAGES) {
    const res = await get(pg.url);
    if (res.status !== 200) {
      bad.push(pg.url + ' -> ' + res.status + (res.err ? ' ' + res.err : ''));
      continue;
    }
    ok++;
    perLocale[pg.code] = (perLocale[pg.code] || 0) + 1;
    const body = res.body;

    /* --- what every page needs --- */
    if (!/<title>[^<]{10,}<\/title>/.test(body)) problems.push(pg.url + ': title missing/short');
    if (!/name="description" content="[^"]{40,}"/.test(body)) problems.push(pg.url + ': meta description missing/short');
    if (!/<h1[ >]/.test(body)) problems.push(pg.url + ': no h1');
    if (!/application\/ld\+json/.test(body)) problems.push(pg.url + ': no JSON-LD');

    /* --- canonical has to be the page itself --- */
    const canon = (body.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
    const wantCanon = ORIGIN + pg.url;
    if (!canon) problems.push(pg.url + ': canonical missing');
    else if (canon !== wantCanon) problems.push(pg.url + ': canonical is ' + canon + ', want ' + wantCanon);

    /* --- html lang --- */
    const lang = (body.match(/<html lang="([^"]+)"/) || [])[1];
    const wantLang = getLang(pg.code).htmlLang;
    if (lang !== wantLang) problems.push(pg.url + ': html lang is ' + lang + ', want ' + wantLang);

    /* --- the language cluster, both directions --- */
    const want = expectedAlternates(pg.p);
    const got = actualAlternates(body);
    if (want.join('|') !== got.join('|')) {
      problems.push(pg.url + ': hreflang [' + got.join('; ') + '] want [' + want.join('; ') + ']');
    }
    got.forEach(a => {
      const u = a.split(' ')[1];
      if (!KNOWN.has(u.replace(ORIGIN, ''))) problems.push(pg.url + ': hreflang points off-site-set ' + u);
    });

    /* Every page carries the switcher — including the English-only tool pages,
       which offer their own language as the current entry and every other
       language's home page for the rest. The menu used to be gated on
       isTranslated() alone, which left /stroke-order/ with no way to change
       language at all; a reader clicking over from the generator saw the menu
       disappear and read it as broken navigation.

       The invariant that still matters is the reverse one: a translated page
       must never be missing the menu. */
    const hasMenu = body.indexOf('class="lang-menu"') >= 0;
    if (!hasMenu) {
      problems.push(pg.url + ': language switcher missing');
    }

    /* --- a prefix applied twice --- */
    if (/\/(pt|ko)\/(pt|ko)\//.test(body)) problems.push(pg.url + ': double locale prefix');

    /* --- internal links must land on a known route --- */
    const hrefs = [...body.matchAll(/href="(\/[^"#?]*)"/g)].map(m => m[1]);
    for (const h of new Set(hrefs)) {
      if (h.startsWith('/assets/') || STATIC_FILES.includes(h)) continue;
      if (!KNOWN.has(h)) problems.push(pg.url + ': dead link ' + h);
    }
  }

  console.log('routes checked:', PAGES.length, '| 200:', ok, '| failed:', bad.length);
  console.log('  per locale:', SHIPPED.map(c => c + '=' + (perLocale[c] || 0)).join(' '));
  bad.slice(0, 10).forEach(b => console.log('  FAIL', b));

  const uniqProblems = [...new Set(problems)];
  console.log('structural/link problems:', uniqProblems.length);
  uniqProblems.slice(0, 25).forEach(p => console.log('  -', p));

  /* --- the sitemap set has to describe exactly the pages that were crawled ---

     sitemap.xml is an index, so the URLs are one level down. Reading only the
     index would report zero locs and look like a pass; reading only the children
     would hide a child that was never listed. Both levels are read, and the
     library file is allowed to exist without being listed yet — that is the
     deliberate hold, not a bug, so it is reported rather than counted wrong. */
  const smIndex = await get('/sitemap.xml');
  const childLocs = [...smIndex.body.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/g)]
    .map(m => m[1].replace(ORIGIN, ''));
  let locs = [];
  for (const child of childLocs) {
    const res = await get(child);
    if (res.status !== 200) { console.log('  FAIL sitemap child ' + child + ' -> ' + res.status); continue; }
    locs = locs.concat([...res.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(ORIGIN, '')));
  }
  const locSet = new Set(locs);
  /* Pages in a generated-but-unlisted child are excluded from "missing": they
     are intentionally withheld from the index until the core set is indexed.
     There are two such children now — the character library and the gift
     subpages — because both were split out of core for the same reason: the
     core set is what should be crawled first, and a 500-URL sitemap teaches a
     crawler nothing about which pages matter. */
  const held = [];
  for (const child of ['/sitemap-characters.xml', '/sitemap-gifts.xml']) {
    const res = await get(child);
    if (res.status !== 200) { console.log('  FAIL held-back child ' + child + ' -> ' + res.status); continue; }
    const locs = [...res.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(ORIGIN, ''));
    held.push({ file: child, locs: locs });
  }
  const heldSet = new Set([].concat.apply([], held.map(h => h.locs)));
  const notInSitemap = [...KNOWN].filter(u => !locSet.has(u) && !heldSet.has(u));
  const inSitemapOnly = locs.filter(u => !KNOWN.has(u));
  const dupeLocs = locs.filter((u, i) => locs.indexOf(u) !== i);
  const badSlash = locs.filter(u => u !== '/' && !u.endsWith('/'));
  console.log('\nsitemap index:', smIndex.status, '| children:', childLocs.length,
    '| locs:', locs.length,
    '| held back:', heldSet.size,
    '| missing from sitemap:', notInSitemap.length,
    '| extra in sitemap:', inSitemapOnly.length,
    '| duplicates:', dupeLocs.length,
    '| no trailing slash:', badSlash.length);
  notInSitemap.slice(0, 8).forEach(u => console.log('  - not listed:', u));
  inSitemapOnly.slice(0, 8).forEach(u => console.log('  - stale entry:', u));

  /* The held-back files must each be a strict subset of the real routes. A loc
     in one that no page answers is a 404 waiting to be published with a single
     edit to the index. */
  for (const h of held) {
    const unknown = h.locs.filter(u => !KNOWN.has(u));
    console.log('  held-back ' + h.file + ': ' + h.locs.length + ' locs | not a real route: ' + unknown.length);
    unknown.slice(0, 8).forEach(u => console.log('  - not a route:', u));
  }
  /* Nothing may appear in two children: the same URL listed twice is a
     duplicate signal, and it also means the split leaked. */
  const dup = [].concat.apply([], held.map(h => h.locs)).filter(u => locSet.has(u));
  console.log('  overlap between held-back and indexed:', dup.length);
  dup.slice(0, 8).forEach(u => console.log('  - listed twice:', u));

  /* --- deployment artefacts a host will read, not a visitor ---

     Checked once rather than per page. A 404 document that exists but is not
     wired up on the host is indistinguishable from a missing one until the
     first typo, and a _headers file that lost its /assets/ rule would take a
     year to notice — so both are asserted here, cheaply. */
  const nf = await get('/404.html');
  console.log('\n404.html:', nf.status,
    '| noindex:', /<meta name="robots" content="noindex/.test(nf.body),
    '| links home:', nf.body.includes('href="/"'));
  const hd = await get('/_headers');
  console.log('_headers:', hd.status,
    '| /assets rule:', /\/assets\/\*[\s\S]{0,120}?immutable/.test(hd.body),
    '| html revalidate:', /max-age=0, must-revalidate/.test(hd.body));

  /* --- spot-check one page per locale in detail --- */
  for (const code of SHIPPED) {
    const p = '/character/' + encodeURIComponent('明') + '/';
    const one = await get(href(code, p));
    const title = (one.body.match(/<title>([^<]+)<\/title>/) || [])[1];
    console.log('\n' + href(code, p) + ' :', one.status, '| bytes:', one.body.length);
    console.log('  title:', title);
    console.log('  has pinyin:', one.body.includes('míng'));
    console.log('  has stroke hook:', one.body.includes('HanziWriter.create'));
    console.log('  has source quote:', /[\u4e00-\u9fff]/.test((one.body.match(/class="quote">([^<]+)</) || [])[1] || ''));
    console.log('  links home:', one.body.includes('href="' + href(code, '/') + '"'));
  }
})();
