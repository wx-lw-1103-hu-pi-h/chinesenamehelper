/* Every t('key') in app.js must exist in each shipped runtime bundle.
   A missing key prints the key itself into the page, which is how an English
   sentence used to leak — now it would leak a bare identifier instead. */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, 'site', 'assets', 'js', 'app.js');
const src = fs.readFileSync(APP, 'utf8');

/* t('literal') and t("literal") — dynamic keys like t('el.' + x) are handled
   separately because they resolve against known prefixes. */
const keys = new Set();
const LIT = /\bt\(\s*'([^']+)'\s*(?:,|\))/g;
let m;
while ((m = LIT.exec(src))) keys.add(m[1]);
const DBL = /\bt\(\s*"([^"]+)"\s*(?:,|\))/g;
while ((m = DBL.exec(src))) keys.add(m[1]);

/* Prefixed calls: t('el.' + name), t('zodiac.' + z) */
const PREFIXED = [['el.', ['wood', 'fire', 'earth', 'metal', 'water']],
                  ['zodiac.', ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']]];
PREFIXED.forEach(function (p) {
  p[1].forEach(function (s) { keys.add(p[0] + s); });
});

console.log('literal + expanded keys used by app.js: ' + keys.size);

let bad = 0;
require('./_i18n/index.cjs').SHIPPED.forEach(function (code) {
  const bundlePath = path.join(__dirname, 'site', 'assets', 'i18n', code + '.js');
  if (!fs.existsSync(bundlePath)) { console.log('MISSING bundle ' + code); bad++; return; }
  /* The bundle assigns window.I18N = {...}; evaluate it with a stub window. */
  const win = {};
  new Function('window', fs.readFileSync(bundlePath, 'utf8'))(win);
  const ui = (win.I18N && win.I18N.ui) || {};
  const missing = Array.from(keys).filter(function (k) { return typeof ui[k] !== 'string'; });
  console.log(code.padEnd(3) + ' ui keys ' + String(Object.keys(ui).length).padStart(3) +
    ' | missing ' + missing.length + (missing.length ? ': ' + missing.slice(0, 12).join(', ') : ''));
  if (missing.length) bad++;
});

/* Placeholders: a {v} present in English must exist in the translation, or the
   value never reaches the sentence and the reader sees a numberless claim. */
const en = {}; const stub = {};
new Function('window', fs.readFileSync(path.join(__dirname, 'site', 'assets', 'i18n', 'en.js'), 'utf8'))(stub);
Object.assign(en, stub.I18N.ui);

/* Everything except English, derived from the registry rather than typed out:
   a locale added there is covered by these two checks automatically. */
const TRANSLATED = require('./_i18n/index.cjs').SHIPPED.filter(function (c) { return c !== 'en'; });

TRANSLATED.forEach(function (code) {
  const w = {};
  new Function('window', fs.readFileSync(path.join(__dirname, 'site', 'assets', 'i18n', code + '.js'), 'utf8'))(w);
  const ui = w.I18N.ui;
  const problems = [];
  Object.keys(ui).forEach(function (k) {
    if (typeof en[k] !== 'string') return;
    const a = (en[k].match(/\{(\w+)\}/g) || []).sort().join(',');
    const b = (ui[k].match(/\{(\w+)\}/g) || []).sort().join(',');
    if (a !== b) problems.push(k + ' en[' + a + '] vs ' + code + '[' + b + ']');
  });
  console.log((problems.length ? 'FAIL ' : 'ok   ') + code + ' placeholder parity: ' +
    (problems.slice(0, 8).join(' | ') || 'match'));
  if (problems.length) bad++;
});

/* Every translated bundle needs glosses, or the card falls back to the English
   meaning from the data file. */
TRANSLATED.forEach(function (code) {
  const w = {};
  new Function('window', fs.readFileSync(path.join(__dirname, 'site', 'assets', 'i18n', code + '.js'), 'utf8'))(w);
  const n = Object.keys(w.I18N.chars || {}).length;
  const ok = n === 120;
  console.log((ok ? 'ok   ' : 'FAIL ') + code + ' gloss entries: ' + n + '/120');
  if (!ok) bad++;
});

console.log(bad ? 'RESULT: ' + bad + ' problem(s)' : 'RESULT: runtime bundles clean');
