/* Verify the six character dictionaries carry the same 120 keys and the same
   four fields. A missing key would silently fall back to English mid-page. */
const path = require('path');
const dir = path.join(__dirname, '_i18n', 'chars');
const codes = ['zh', 'ko', 'ja', 'es', 'pt'];
const FIELDS = ['m', 'l', 'w', 'n'];

const maps = {};
codes.forEach((c) => { maps[c] = require(path.join(dir, c + '.cjs')); });

const en = require('./_src_en.json');
const enKeys = Object.keys(en);
console.log('english source keys:', enKeys.length);

let bad = 0;
codes.forEach((c) => {
  const keys = Object.keys(maps[c]);
  const missing = enKeys.filter((k) => !(k in maps[c]));
  const extra = keys.filter((k) => !(k in en));
  const fieldErr = [];
  keys.forEach((k) => {
    const rec = maps[c][k];
    const fs = Object.keys(rec);
    if (fs.length !== 4 || FIELDS.some((f) => typeof rec[f] !== 'string' || !rec[f])) {
      fieldErr.push(k + ' -> ' + fs.join(','));
    }
  });
  if (missing.length || extra.length || fieldErr.length) bad++;
  console.log(c.padEnd(3), 'keys', String(keys.length).padStart(3),
    '| missing', missing.length, '| extra', extra.length, '| bad fields', fieldErr.length);
  if (missing.length) console.log('   missing:', missing.join(''));
  if (extra.length) console.log('   extra  :', extra.join(''));
  if (fieldErr.length) console.log('   fields :', fieldErr.join(' | '));
});

/* Also confirm the same key order, which keeps diffs between languages readable. */
const order = codes.map((c) => Object.keys(maps[c]).join(''));
const sameOrder = order.every((o) => o === order[0]);
console.log('same key order in all five:', sameOrder);
console.log(bad ? 'RESULT: problems found' : 'RESULT: all five dictionaries clean');
