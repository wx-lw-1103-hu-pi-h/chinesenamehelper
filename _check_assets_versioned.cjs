/* Gate: is every /assets/ URL referenced with ?v=<hash>?

   _headers gives /assets/* a one-year immutable cache, which is only honest
   while the URL is the cache key — a changed file must have a changed URL.
   _assets.cjs supplies that, but only to the templates that call u(). A hand-
   written page, or a new template that pastes a bare path, breaks the
   contract quietly: the first visitor caches the file for a year, the next
   deploy edits it, and they keep the old copy with no error anywhere.

   So this exits non-zero on a bare reference. Run it before deploying; a
   failure means either call u() at that site or stop claiming immutable.

   Two reference forms are checked because both fetch from the visitor's
   browser and both get cached:
     ="..."   attribute values: src, href, content, data-*
     ('...')  fetch() and friends in inline script

   Absolute URLs (https://.../assets/...) are skipped: og:image is read by
   crawlers, and rewriting it would break the unfurl rather than fix a cache. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const q = path.join(d, e.name);
    if (e.isDirectory()) walk(q);
    else if (e.name.endsWith('.html')) files.push(q);
  }
})(ROOT);

const ATTR = /="(\/assets\/[^"]*)"/g;
const CALL = /['"](\/assets\/[^'"]*)['"]/g;

const bare = [];

/* The stroke data is the one asset whose URL is assembled at runtime: it is a
   different file per character, so the template has no single path to wrap in
   u(). It counts as versioned when the same expression appends a ?v= — the
   injected per-character hash. Anything else concatenated onto /assets/ is a
   bare request and is reported. */
const RUNTIME_VERSIONED = /\/assets\/hanzi-data\/'\s*\+[\s\S]{0,120}?\?v='\s*\+/;

for (const f of files) {
  const rel = '/' + path.relative(ROOT, f).replace(/\\/g, '/');
  const html = fs.readFileSync(f, 'utf8');
  const runtimeOk = RUNTIME_VERSIONED.test(html);
  [ATTR, CALL].forEach(function (re) {
    let m;
    while ((m = re.exec(html))) {
      const url = m[1];
      /* A query string that is not a version is a real parameter (a JSON
         fetch with ?cb=), and hashing it is not what u() does. Only ?v= counts
         as versioned here. */
      if (/\?v=[a-f0-9]{8}$/.test(url)) continue;
      /* A prefix that the page then finishes with a versioned suffix. */
      if (runtimeOk && url === '/assets/hanzi-data/') continue;
      bare.push(rel + '  ->  ' + url);
    }
  });
}

const uniq = [...new Set(bare)];
console.log('html files scanned:', files.length);
if (uniq.length === 0) {
  console.log('every /assets/ reference carries ?v=<hash> — immutable is safe');
  process.exit(0);
}

console.log('');
console.log('BARE /assets/ REFERENCES: ' + uniq.length + ' — immutable would freeze these');
uniq.slice(0, 40).forEach(function (b) { console.log('  ' + b); });
if (uniq.length > 40) console.log('  ... and ' + (uniq.length - 40) + ' more');
process.exit(1);
