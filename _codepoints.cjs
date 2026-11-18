/* Verify the CJK actually written to disk is what was intended.
   The console may render it as mojibake; codepoints do not lie. */
const fs = require('fs');

const s = fs.readFileSync('site/index.html', 'utf8');

const mark = s.match(/data-mark="([^"]*)"/);
console.log('watermark:', JSON.stringify(mark[1]));
console.log('  codepoints:', Array.from(mark[1]).map((c) => c.codePointAt(0).toString(16)).join(' '));

const chips = Array.from(s.matchAll(/<span class="hs"><i>([^<]*)<\/i><b>([^<]*)<\/b><\/span>/g));
console.log('sample chips:', chips.length);
chips.forEach(function (m) {
  const ch = m[2];
  console.log('  ' + m[1] + ' -> U+' + Array.from(ch).map((c) => c.codePointAt(0).toString(16).toUpperCase()).join(' '));
});

/* Expected: 名 U+540D, 澜 U+6F9C, 曦 U+66E6, 哲 U+54F2, 薇 U+8587 */
const want = ['540d', '6f9c', '66e6', '54f2', '8587'];
const got = chips.map((m) => Array.from(m[2])[0].codePointAt(0).toString(16));
console.log('expected', want.join(','), '| got', got.join(','));
console.log('match:', want.join(',') === got.join(','));
