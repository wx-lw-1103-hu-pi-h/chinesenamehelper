/* Verify that a shared link reproduces the exact batch it encodes.
   Mimics app.js: urlAvoid is snapshotted before the batch is generated,
   then the batch is appended to the session history and trimmed to AVOID_MAX. */
const fs = require('fs');
const path = require('path');

const BASE = 'H:/门户/git/_nameinhanzi/site/assets';
const g = globalThis;

function load(file, key) {
  const src = fs.readFileSync(path.join(BASE, file), 'utf8');
  const fn = new Function('window', src + '\nreturn window.' + key + ';');
  return fn(g);
}

const lunarSrc = fs.readFileSync(path.join(BASE, 'lib/lunar.js'), 'utf8');
const m = { exports: {} };
new Function('module', 'exports', lunarSrc)(m, m.exports);
g.lunarjs = m.exports;

load('data/characters.js', 'HANZI');
load('data/characters2.js', 'HANZI2');
load('js/engine.js', 'NamingEngine');
const E = g.NamingEngine;

const base = { surname: '王', gender: 'male', year: 1994, month: 1, day: 27, desc: 'calm', count: 5 };

/* The window has to be read from the page, not restated: a link is only exact
   while the session remembers no more than the URL can carry, so a mismatch
   between the two numbers is the bug this guards against. */
const AVOID_MAX = (function () {
  const src = fs.readFileSync(path.join(BASE, 'js/app.js'), 'utf8');
  const m = src.match(/var AVOID_MAX = (\d+);/);
  if (!m) throw new Error('AVOID_MAX not found in app.js');
  return Number(m[1]);
})();
console.log('AVOID_MAX in app.js: ' + AVOID_MAX);

// --- simulate the live page ---
// Deep enough to cross the cap: below it every link must be exact, and at the
// boundary the trimmed window must still be the one the batch was drawn from.
const DRAW_DEPTH = Math.ceil(AVOID_MAX / 5) + 3;
let avoid = [];
const session = [];
for (let seed = 1; seed <= DRAW_DEPTH; seed++) {
  const urlAvoid = avoid.slice();          // what generate() snapshots
  const r = E.generate({ ...base, seed, avoid: urlAvoid });
  r.names.forEach(n => { if (avoid.indexOf(n.given) < 0) avoid.push(n.given); });
  if (avoid.length > AVOID_MAX) avoid = avoid.slice(-AVOID_MAX);  // what render() keeps
  session.push({ seed, urlAvoid: urlAvoid.slice(), names: r.names.map(n => n.given) });
}

console.log('live session: ' + DRAW_DEPTH + ' draws');
session.slice(0, 3).forEach(s => console.log('  seed=' + s.seed + ' a=' + (s.urlAvoid.length) + ' -> ' + s.names.join('/')));
console.log('  ...');
console.log('  seed=' + session[session.length - 1].seed + ' a=' + session[session.length - 1].urlAvoid.length);

// --- now open each link from scratch (fresh page, avoid read from URL) ---
let ok = 0;
let firstBad = null;
for (const s of session) {
  /* readURL() keeps only the last AVOID_MAX entries, so that is what a visitor
     opening the link actually gets. */
  const fromUrl = s.urlAvoid.slice(-AVOID_MAX);
  const r = E.generate({ ...base, seed: s.seed, avoid: fromUrl });
  const got = r.names.map(n => n.given);
  const same = JSON.stringify(got) === JSON.stringify(s.names);
  if (same) ok++; else if (firstBad === null) firstBad = s.seed;
}
console.log('\nlinks reproducing their batch:', ok + '/' + session.length,
  ok === session.length ? '(pass)' : '(FAIL, first mismatch at draw ' + firstBad + ')');

// the failure mode we just fixed: encoding the post-render list instead
let bad = 0;
for (const s of session) {
  const r = E.generate({ ...base, seed: s.seed + 1, avoid: s.urlAvoid });
  if (r.names.length) bad++;
}
console.log('sanity: generating with a urlAvoid still returns names:', bad > 0);

// A link that carries no history at all must still draw something.
const cold = E.generate({ ...base, seed: 1, avoid: [] });
console.log('sanity: a link with no "a" param returns names:', cold.names.length === 5);
