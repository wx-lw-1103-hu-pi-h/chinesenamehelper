/* Confirm the home-page keys exist in every shipped locale and that the
   placeholder markers match. A missing key or a changed marker would leave
   raw {bold}/{em} text on the page or an English sentence on a translated page. */
const codes = require('./_i18n/index.cjs').SHIPPED;
const NEED = [
  'home.title', 'home.desc', 'home.ogtitle', 'home.ogdesc',
  'home.eyebrow', 'home.h1a', 'home.h1b', 'home.sub', 'home.note',
  'form.surname', 'form.optional', 'form.nosurname', 'form.gender',
  'form.neutral', 'form.male', 'form.female', 'form.birth', 'form.year',
  'form.month', 'form.day', 'form.about', 'form.abouthint', 'form.descph',
  'form.submit', 'form.privacy', 'form.libnote',
  'res.names', 'res.regen', 'res.print', 'res.share', 'res.empty',
  'how.h2', 'how.lede', 'how.f1t', 'how.f1p', 'how.f2t', 'how.f2p',
  'how.f3t', 'how.f3p', 'how.f4t', 'how.f4p',
  'homefaq.h2', 'homefaq.a2b',
  'foot.tools', 'foot.learn', 'foot.how', 'foot.generate',
  'foot.legal', 'foot.strokelicense'
];
for (let i = 1; i <= 7; i++) NEED.push('homefaq.q' + i, 'homefaq.a' + i);
NEED.push('nav.generator', 'nav.myname', 'nav.pinyin', 'nav.stroke', 'nav.characters');

/* Values carrying inline markup markers must agree across locales. */
const MARKED = ['home.note', 'homefaq.a7'];

const ui = {};
codes.forEach(function (c) { ui[c] = require('./_i18n/ui/' + c + '.cjs'); });

let bad = 0;
codes.forEach(function (c) {
  const miss = NEED.filter(function (k) { return typeof ui[c][k] !== 'string' || !ui[c][k]; });
  console.log(c.padEnd(3) + ' missing ' + miss.length + (miss.length ? ': ' + miss.join(', ') : ''));
  if (miss.length) bad++;
});

MARKED.forEach(function (k) {
  const en = ui.en[k] || '';
  const marks = (en.match(/\{\/?\w+\}/g) || []).sort().join(',');
  codes.forEach(function (c) {
    const v = ui[c][k] || '';
    const m = (v.match(/\{\/?\w+\}/g) || []).sort().join(',');
    const ok = m === marks;
    console.log((ok ? 'ok   ' : 'FAIL ') + c + ' ' + k + ' markers: ' + m);
    if (!ok) bad++;
  });
});

console.log(bad ? 'RESULT: ' + bad + ' problem(s)' : 'RESULT: home keys clean');
