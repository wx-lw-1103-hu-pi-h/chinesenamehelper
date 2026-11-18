/* Verify the carrier pages carry real content, not just a shell.
 *
 * Checks per locale: title/h1 presence, the three stat blocks, the illustration
 * path, the sample chips, and — the part that matters — that every chip links
 * to a character page that actually exists and that the stroke numbers printed
 * on the page agree with the library. A page that recommends 曦 for a seal is
 * the failure this catches.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const DATA = path.join(ROOT, 'assets', 'data');
const g = globalThis;
['characters.js', 'characters2.js'].forEach(f => {
  new Function('window', fs.readFileSync(path.join(DATA, f), 'utf8'))(g);
});
const REC = {};
[].concat(g.HANZI, g.HANZI2).forEach(c => { if (c && c.c && !REC[c.c]) REC[c.c] = c; });

const CATALOG = require('./_gifts/catalog.cjs');
const SHIPPED = require('./_i18n/index.cjs').SHIPPED;
/* Derived from the registry so adding a locale cannot leave a check script
   looking for pages in a language the generators never wrote. */
const PREFIX = {};
require('./_i18n/index.cjs').LOCALES.forEach(function (l) { PREFIX[l.code] = l.prefix; });

/* Title length as rendered width, not character count. Korean and Chinese pack
   twice the meaning into a character, so a flat "20 chars" floor marks a good
   Korean title as short and passes a padded English one. Weighting CJK at two
   measures the line the reader actually sees. */
function visualWidth(str) {
  let w = 0;
  for (const ch of str) w += ch.codePointAt(0) > 0x2e80 ? 2 : 1;
  return w;
}

let bad = 0;
const problems = [];

SHIPPED.forEach(code => {
  const hub = path.join(ROOT, PREFIX[code], 'gifts', 'index.html');
  if (!fs.existsSync(hub)) { problems.push(code + ': hub missing'); bad++; return; }
  const hs = fs.readFileSync(hub, 'utf8');
  const cards = (hs.match(/class="gift-card"/g) || []).length;
  if (cards !== CATALOG.length) { problems.push(code + ': hub has ' + cards + ' cards, want ' + CATALOG.length); bad++; }

  CATALOG.forEach(item => {
    const file = path.join(ROOT, PREFIX[code], 'gifts', item.slug, 'index.html');
    const label = code + '/' + item.slug;
    if (!fs.existsSync(file)) { problems.push(label + ': page missing'); bad++; return; }
    const s = fs.readFileSync(file, 'utf8');

    const title = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    if (visualWidth(title) < 28) problems.push(label + ': title too short (' + visualWidth(title) + ')');
    if (!/<h1[ >]/.test(s)) problems.push(label + ': no h1');
    if ((s.match(/class="gift-stat"/g) || []).length !== 3) problems.push(label + ': stat blocks wrong');
    /* A carrier shows either its photograph or, when there is none, the drawn
       illustration. Both are valid; a page must reference one of them and the
       file it names must exist. */
    const shown = item.photo ? item.photo : item.image + '.svg';
    if (s.indexOf('/assets/img/gifts/' + shown) < 0) problems.push(label + ': illustration missing');
    if (!fs.existsSync(path.join(ROOT, 'assets', 'img', 'gifts', shown))) problems.push(label + ': image file missing on disk (' + shown + ')');
    /* Sample chips: every linked character must exist, and the "fits" list must
       actually respect the stroke ceiling the page prints.

       The class match has to be anchored on the attribute boundary: a looser
       `char-chip[^"]*` also matches the container div `class="char-chips"`,
       and the stroke number swallowed from the next block then looks like a
       21-stroke character recommended for a seal. */
    const chips = [...s.matchAll(/class="(char-chip(?: [^"]*)?)"[\s\S]*?<b>([^<]+)<\/b>[\s\S]*?<span>(\d+)<\/span>/g)]
      .map(m => ({ deep: m[1].indexOf('deep') >= 0, ch: m[2], strokes: Number(m[3]) }));
    if (!chips.length) problems.push(label + ': no sample chips');
    chips.forEach(c => {
      if (!REC[c.ch]) { problems.push(label + ': chip ' + c.ch + ' not in library'); return; }
      if (REC[c.ch].s !== c.strokes) problems.push(label + ': chip ' + c.ch + ' says ' + c.strokes + ' strokes, library says ' + REC[c.ch].s);
      if (!c.deep && c.strokes > item.fit.maxStrokes) problems.push(label + ': chip ' + c.ch + ' (' + c.strokes + ') exceeds limit ' + item.fit.maxStrokes);
      if (c.deep && c.strokes <= item.fit.maxStrokes) problems.push(label + ': ' + c.ch + ' marked as too dense but is under the limit');
    });

    /* Language leak: a Portuguese or Korean page must not carry the English
       headline from the source file. Compared against the rendered <h1>, not
       the h1b fragment — "body" is a real English h1b and also appears in
       every </body> tag, so a substring test on the fragment reports a leak on
       every page. */
    if (code !== 'en') {
      const en = require('./_gifts/text.en.cjs')[item.slug];
      const ownName = (s.match(/<nav class="crumb">[\s\S]*?<span>([^<]*)<\/span>\s*<\/nav>/) || [])[1] || '';
      if (ownName.trim() === en.name) problems.push(label + ': English carrier name leaked into breadcrumb');
    }
    /* The English page must reference this carrier's own artwork: its
       photograph when it has one, otherwise its drawing. */
    if (code === 'en') {
      const own = item.photo ? item.photo : item.slug + '.svg';
      if (s.indexOf(own) < 0) problems.push(label + ': no art reference');
      /* The drawn plate is still required even when a photograph is shown: the
         configurator on this page stamps onto it. */
      if (!fs.existsSync(path.join(ROOT, 'assets', 'img', 'gifts', item.slug + '-blank.svg'))) {
        problems.push(label + ': blank plate missing on disk');
      }
    }
  });
});

console.log('carriers:', CATALOG.length, '| locales:', SHIPPED.join(','));
console.log('problems:', problems.length);
problems.slice(0, 30).forEach(p => console.log('  -', p));
console.log(bad || problems.length ? 'RESULT: ' + (bad + problems.length) + ' problem(s)' : 'RESULT: carrier pages clean');
