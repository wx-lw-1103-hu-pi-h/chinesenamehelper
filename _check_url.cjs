/* Verify that a shared link reproduces the exact batch it encodes.
   Mimics app.js: urlAvoid is snapshotted before the batch is generated,
   then the batch is appended to the session history. */
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

// --- simulate the live page ---
let avoid = [];
const session = [];
for (let seed = 1; seed <= 3; seed++) {
  const urlAvoid = avoid.slice();          // what generate() snapshots
  const r = E.generate({ ...base, seed, avoid: urlAvoid });
  r.names.forEach(n => avoid.push(n.given)); // render() appends
  session.push({ seed, urlAvoid: urlAvoid.slice(), names: r.names.map(n => n.given) });
}

console.log('live session:');
session.forEach(s => console.log('  seed=' + s.seed + ' a=' + (s.urlAvoid.length) + ' -> ' + s.names.join('/')));

// --- now open each link from scratch (fresh page, avoid read from URL) ---
let ok = 0;
for (const s of session) {
  const fromUrl = E.generate({ ...base, seed: s.seed, avoid: s.urlAvoid });
  const got = fromUrl.names.map(n => n.given);
  const same = JSON.stringify(got) === JSON.stringify(s.names);
  if (same) ok++;
  console.log('link seed=' + s.seed + ': ' +
    (same ? 'REPRODUCES' : 'MISMATCH') + ' -> ' + got.join('/'));
}
console.log('\nlinks reproducing their batch:', ok + '/' + session.length,

  ok === session.length ? '(pass)' : '(FAIL)');

// the failure mode we just fixed: encoding the post-render list instead
let bad = 0;
for (const s of session) {
  const r = E.generate({ ...base, seed: s.seed + 1, avoid: s.urlAvoid });
  if (r.names.length) bad++;
}
console.log('sanity: generating with a urlAvoid still returns names:', bad > 0);
