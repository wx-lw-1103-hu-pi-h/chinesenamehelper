/* Do the locale subpages carry the same nav treatment as the locale homes?

   navFor() was added to _gen_home.cjs, which only builds the four homes. The
   section pages under /ja/, /pt/, /ko/ are built by other generators, and if
   they still emit the old six bare anchors then the EN marker exists on the
   entry page and nowhere a reader actually navigates from — which is the half
   of the job that matters, since people arrive on section pages from search.

   Reports counts, plus the first few offenders, rather than a pass/fail flag
   so the scope is visible. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const q = path.join(d, e.name);
    if (e.isDirectory()) walk(q);
    else if (e.name === 'index.html') files.push(q);
  }
})(ROOT);

const navRe = /<nav class="site-nav">([\s\S]*?)<\/nav>/;
const localeSub = [];
const tab = {};

for (const f of files) {
  const rel = '/' + path.relative(ROOT, f).replace(/\\/g, '/').replace(/\\/g, '/');
  const m = rel.match(/^\/(ja|pt|ko)\//);
  if (!m) continue;
  const isHome = /^\/(ja|pt|ko)\/index\.html$/.test(rel);
  if (isHome) continue;

  const html = fs.readFileSync(f, 'utf8');
  const nav = html.match(navRe);
  if (!nav) continue;

  const locale = m[1];
  tab[locale] = tab[locale] || { pages: 0, marked: 0, bare: 0 };
  tab[locale].pages++;
  if (nav[1].indexOf('nav-en') >= 0) tab[locale].marked++;
  else {
    tab[locale].bare++;
    if (localeSub.length < 6) localeSub.push(rel);
  }
}

console.log('locale section pages, EN-marker coverage:');
Object.keys(tab).sort().forEach(function (k) {
  const v = tab[k];
  console.log('  ' + k + ': pages=' + v.pages + ' marked=' + v.marked + ' bare=' + v.bare);
});
console.log('');
if (localeSub.length) {
  console.log('sample bare navs:');
  localeSub.forEach(function (r) { console.log('  ' + r); });
} else {
  console.log('every locale section page carries the marker');
}
