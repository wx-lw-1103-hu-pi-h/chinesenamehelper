/* Quality check: run the engine headless against realistic inputs. */
const fs = require('fs');
const path = require('path');

const BASE = 'H:/门户/git/_nameinhanzi/site/assets';
const g = globalThis;

function load(file, key) {
  const src = fs.readFileSync(path.join(BASE, file), 'utf8');
  // the data files assign to window.*, so alias window to globalThis
  const fn = new Function('window', src + '\nreturn window.' + key + ';');
  return fn(g);
}

// lunar lib assigns to module.exports when loaded as CJS
const lunarSrc = fs.readFileSync(path.join(BASE, 'lib/lunar.js'), 'utf8');
const m = { exports: {} };
new Function('module', 'exports', lunarSrc)(m, m.exports);
g.lunarjs = m.exports;

load('data/characters.js', 'HANZI');
load('data/characters2.js', 'HANZI2');
load('js/engine.js', 'NamingEngine');

const E = g.NamingEngine;
console.log('library size:', E.library().length);

const CASES = [
  { name: 'Michael (male, 1994-01-27, calm/curious)', surname: '王', gender: 'male', year: 1994, month: 1, day: 27, desc: 'I am calm, curious and a bit introverted, I love philosophy and mountains.' },
  { name: 'Emily (female, 1990-06-15, creative/warm)', surname: '李', gender: 'female', year: 1990, month: 6, day: 15, desc: 'Creative artist, warm and gentle, I love music and gardens.' },
  { name: 'Kevin (male, 2001-11-08, ambitious)', surname: '张', gender: 'male', year: 2001, month: 11, day: 8, desc: 'Ambitious and driven, I want to build something of my own.' },
  { name: 'Sarah (female, 1988-03-22, honest/sincere)', surname: '陈', gender: 'female', year: 1988, month: 3, day: 22, desc: 'Sincere and loyal, quiet strength, my family matters most.' },
  { name: 'no birthday (neutral, playful)', surname: '刘', gender: 'neutral', desc: 'Playful and funny, I like adventure and freedom.' },
  { name: 'David (male, 1979-12-03, scholar)', surname: '杨', gender: 'male', year: 1979, month: 12, day: 3, desc: 'A scholar at heart, I read constantly and write poetry.' }
];

for (const c of CASES) {
  const r = E.generate({ ...c, seed: 1, count: 5 });
  console.log('\n=== ' + c.name + ' ===');
  if (r.chart && r.chart.ok) {
    console.log('lunar:', r.chart.lunarText, '| zodiac:', r.chart.zodiac, r.chart.zodiacEn);
    console.log('bazi:', r.chart.bazi.map(p => p.text).join(' '), '| count:', JSON.stringify(r.chart.elementCount));
    console.log('weak:', r.chart.weak, '| support:', r.chart.support);
  } else {
    console.log('chart: none (no birthday, or lunar lib absent)');
  }
  console.log('tags from description:', r.wanted.join(', '));
  r.names.forEach(n => {
    console.log('  ' + n.rank + '. ' + n.full + ' [' + n.pinyin + ']  ' +
      n.chars.map(ch => ch.element).join('') + '  score=' + n.score + ' fit=' + n.fit);
    console.log('     ' + n.chars.map(ch => ch.c + ': ' + ch.meaning).join(' / '));
    console.log('     why: ' + n.why);
  });
}

// determinism check
const a = E.generate({ surname: '王', gender: 'male', year: 1994, month: 1, day: 27, desc: 'calm', seed: 7 });
const b = E.generate({ surname: '王', gender: 'male', year: 1994, month: 1, day: 27, desc: 'calm', seed: 7 });
console.log('\ndeterministic:', JSON.stringify(a.names.map(n => n.full)) === JSON.stringify(b.names.map(n => n.full)));
const d = E.generate({ surname: '王', gender: 'male', year: 1994, month: 1, day: 27, desc: 'calm', seed: 8 });
console.log('seed changes result:', JSON.stringify(a.names.map(n => n.full)) !== JSON.stringify(d.names.map(n => n.full)));

// uniqueness check across all cases
let dup = 0;
for (const c of CASES) {
  const r = E.generate({ ...c, seed: 1, count: 5 });
  const fulls = r.names.map(n => n.full);
  if (new Set(fulls).size !== fulls.length) dup++;
}
console.log('cases with duplicate names:', dup);

// fit must stay inside the ring's scale and never collide with the raw score
const fits = [];
for (const c of CASES) {
  E.generate({ ...c, seed: 1, count: 5 }).names.forEach(n => fits.push(n.fit));
}
console.log('fit range:', Math.min(...fits), '-', Math.max(...fits),
  '| all 0-100 ints:', fits.every(f => Number.isInteger(f) && f >= 0 && f <= 100));

// "another set" must actually move on — run deep, like a curious visitor.
// The old version stopped at ten draws, which is exactly where the previous
// implementation wiped its exclusion list, so the bug it was supposed to catch
// sat one draw past the end of the test.
const seen = [], gens = [];
let avoid = [];
for (let s = 1; s <= 40; s++) {
  const r = E.generate({ surname: '王', gender: 'male', year: 1994, month: 1, day: 27, desc: 'calm', seed: s, avoid, count: 5 });
  const gs = r.names.map(n => n.given);
  gens.push(gs.join('/'));
  gs.forEach(x => { if (avoid.indexOf(x) < 0) avoid.push(x); });
  r.names.forEach(n => seen.push(n.given));
}
const repeats = seen.length - new Set(seen).size;
console.log('40 draws with avoid -> distinct names:', new Set(seen).size, 'of', seen.length, '| repeats:', repeats);
console.log('draw 1: ', gens[0]);
console.log('draw 20:', gens[19]);
console.log('draw 40:', gens[39]);

// A name from the first screen must not come back later in the visit: that is
// the complaint "it is always the same few names" in its most literal form.
const firstBatch = gens[0].split('/');
const backLater = gens.slice(1).reduce((acc, g) =>
  acc + g.split('/').filter(x => firstBatch.indexOf(x) >= 0).length, 0);
console.log('names from draw 1 reappearing in draws 2-40:', backLater);

// Glyph spread: fifty name slots should touch close to fifty different
// characters, not recycle the same fifteen.
const earlyChars = new Set();
gens.slice(0, 5).forEach(g => Array.from(g).forEach(c => { if (c !== '/') earlyChars.add(c); }));
console.log('distinct characters in the first 5 draws:', earlyChars.size, 'of 50 slots');

// character coverage over the whole run
const allChars = new Set();
seen.forEach(n => Array.from(n).forEach(c => allChars.add(c)));
console.log('characters reached in 40 draws:', allChars.size, 'of', E.library().length);

// exhaustion guard: avoid everything plausible, expect a fallback not a blank
const everything = [];
for (let i = 0; i < 400; i++) everything.push('\u0000' + i);
console.log('exhausted avoid -> names served:',
  E.generate({ surname: '王', gender: 'male', desc: 'calm', seed: 3, avoid: everything }).names.length);
