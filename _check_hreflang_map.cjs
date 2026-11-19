/* Where does the hreflang cluster actually live?

   The acceptance criterion is that the cluster appears only on the pages that
   were genuinely translated in four languages, and never leaks onto the
   English-only prose pages. Presence of a cluster on /ja/ is not enough —
   the check has to prove absence everywhere it does not belong, so this walks
   every generated HTML file and reports the full distribution rather than
   sampling.

   Writes to stdout; run it and compare the tallies, not individual lines. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(ROOT);

const withCluster = [];
const without = [];
const bad = [];

/* The directory name on disk is the raw character (/character/中/), but the
   generated canonical is percent-encoded (/character/%E4%B8%AD/). Compare
   against the encoded form or every CJK route reports a false mismatch. */
function encodePath(p) {
  return p.split('/').map(function (seg) {
    return seg ? encodeURIComponent(seg) : seg;
  }).join('/');
}

for (const f of files) {
  /**
   * The root index.html lives in site/ itself, so its relative dirname is '.'
   * and naive concatenation yields '//'. Treat the root as '/'.
   */
  const rawDir = path.relative(ROOT, path.dirname(f)).replace(/\\/g, '/');
  const raw = rawDir === '' ? '/' : '/' + rawDir + '/';
  const rel = encodePath(raw);
  const html = fs.readFileSync(f, 'utf8');

  const head = html.slice(0, html.indexOf('</head>'));
  const alts = head.match(/<link\s+rel="alternate"[^>]*>/gi) || [];

  // canonical must be self-referential wherever it exists
  const can = (head.match(/<link\s+rel="canonical"[^>]*href="([^"]+)"/i) || [])[1] || '';

  if (alts.length === 0) { without.push(rel); continue; }

  withCluster.push(rel);

  // A cluster is only valid if it is complete and points at itself.
  const langs = alts.map(function (a) {
    return (a.match(/hreflang="([^"]+)"/) || [])[1];
  }).filter(Boolean).sort();
  const want = ['en', 'ja', 'ko', 'pt', 'x-default'];
  if (langs.join(',') !== want.join(',')) {
    bad.push(rel + '  langset=' + langs.join(','));
  }
  const url = 'https://chinesenamehelper.com' + rel;
  if (!alts.some(function (a) { return a.indexOf('href="' + url + '"') >= 0; })) {
    bad.push(rel + '  cluster does not point at itself');
  }
  if (can !== url) {
    bad.push(rel + '  canonical=' + can + ' (expected ' + url + ')');
  }
}

/* Group by the first path segment so the shape of the distribution is
   readable at a glance: how many pages per locale and per section carry a
   cluster. Percent-encoded segments decode back to the character, so sections
   group under their real name. */
function group(list) {
  const by = {};
  for (const r of list) {
    const parts = r.split('/').filter(Boolean).map(function (s) {
      try { return decodeURIComponent(s); } catch (e) { return s; }
    });
    let k;
    if (parts.length === 0) k = '(root)';
    else if (parts.length > 1 && parts[0] === 'character') k = 'character pages';
    else k = parts[0] + '/ pages';
    by[k] = (by[k] || 0) + 1;
  }
  return by;
}

console.log('html files:', files.length);
console.log('');
console.log('WITH hreflang cluster:', withCluster.length);
console.log(JSON.stringify(group(withCluster), null, 2));
console.log('');
console.log('WITHOUT cluster:', without.length);
console.log(JSON.stringify(group(without), null, 2));
console.log('');

/* The three prose pages must be cluster-free; name them explicitly because a
   count alone would not catch a regression that moved the problem elsewhere. */
const EN_ONLY = ['/my-name-in-chinese/', '/hanzi-to-pinyin/', '/stroke-order/'];
/* `without` is keyed by the encoded path, but these three are plain ASCII so
   the lookup is unaffected. */
console.log('EN_ONLY pages cluster-free:');
EN_ONLY.forEach(function (p) {
  console.log('  ' + p + '  ' + (without.indexOf(p) >= 0 ? 'ok (no cluster)' : 'LEAKED'));
});
console.log('');
if (bad.length) {
  console.log('INVALID CLUSTERS: ' + bad.length);
  bad.forEach(function (b) { console.log('  ' + b); });
} else {
  console.log('all clusters complete, self-pointing, canonical self');
}
