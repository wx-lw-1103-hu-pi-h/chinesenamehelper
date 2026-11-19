/* Is the footer's first column still indented like the rest of the file?

   _unify_nav.cjs splices toolsColumn() into the position of the old column, but
   the old code kept the leading whitespace that preceded `<div class="foot-col">`
   while the new block starts at column zero. If both survive, the opening tag
   ends up buried behind a run of spaces while its siblings are not, which is
   cosmetically wrong and makes the next diff of that file noisy.

   Reports the indent width of every foot-col opening tag, so a single odd one
   stands out. */
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

const tallies = {};
const odd = [];

for (const f of files) {
  const rel = '/' + path.relative(ROOT, f).replace(/\\/g, '/');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  let sawFooter = false;
  for (const line of lines) {
    if (line.indexOf('<footer class="site-foot">') >= 0) { sawFooter = true; continue; }
    if (!sawFooter) continue;
    if (line.indexOf('<div class="foot-col">') < 0) continue;
    const indent = line.length - line.replace(/^\s+/, '').length;
    tallies[indent] = (tallies[indent] || 0) + 1;
    if (indent !== 4 && odd.length < 8) odd.push(rel + '  indent=' + indent);
    break;
  }
}

console.log('foot-col opening indent widths across the site:');
Object.keys(tallies).sort(function (a, b) { return a - b; }).forEach(function (k) {
  console.log('  ' + k + ' spaces: ' + tallies[k]);
});
if (odd.length) {
  console.log('');
  console.log('unexpected:');
  odd.forEach(function (r) { console.log('  ' + r); });
}
