/* Verify the five copy changes landed in the generated HTML.

   Reads the files rather than the terminal so the CJK survives whatever code
   page the shell happens to be using, and checks the acceptance criteria the
   deployment depends on rather than just presence of a string.
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }
function grab(html, re) { const m = html.match(re); return m ? m[1] : '(not found)'; }
function text(html, re) {
  return grab(html, re).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const LOCALES = [
  ['en', 'index.html'],
  ['ja', 'ja/index.html'],
  ['pt', 'pt/index.html'],
  ['ko', 'ko/index.html']
];

console.log('=== titles and H1s ===');
LOCALES.forEach(function (l) {
  const html = read(l[1]);
  const title = text(html, /<title>([\s\S]*?)<\/title>/);
  const h1 = text(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
  const eyebrow = text(html, /class="eyebrow">([\s\S]*?)<\/div>/);
  const desc = grab(html, /<meta name="description" content="([^"]*)">/);
  console.log('\n[' + l[0] + ']');
  console.log('  title  : ' + title);
  console.log('  h1     : ' + h1);
  console.log('  eyebrow: ' + eyebrow);
  console.log('  desc   : ' + desc.length + ' chars — ' + desc);
});

/* The keyword each locale is aiming at has to sit inside the H1 as one
   unbroken run of characters. Browsers render a <span> inline, so the markup
   must be stripped before looking: a space in the text is the real failure. */
console.log('\n=== keyword present in H1 as one string ===');
[
  ['en', 'index.html', 'chinese name generator'],
  ['ja', 'ja/index.html', '中国語の名前'],
  ['pt', 'pt/index.html', 'nome em chinês'],
  ['ko', 'ko/index.html', '중국어 이름']
].forEach(function (c) {
  const h1 = text(read(c[1]), /<h1[^>]*>([\s\S]*?)<\/h1>/);
  const ok = h1.toLowerCase().indexOf(c[2].toLowerCase()) >= 0;
  console.log('  ' + c[0] + ' "' + c[2] + '": ' + (ok ? 'PRESENT' : 'MISSING'));
});

console.log('\n=== /ja/ Title carries 変換 ===');
const jaTitle = text(read('ja/index.html'), /<title>([\s\S]*?)<\/title>/);
console.log('  ' + (jaTitle.indexOf('変換') >= 0 ? 'PRESENT' : 'MISSING') + ' — ' + jaTitle);

console.log('\n=== English-only nav entries on translated pages ===');
[['ja', 'ja/index.html'], ['pt', 'pt/index.html'], ['ko', 'ko/index.html'], ['en', 'index.html']]
  .forEach(function (l) {
    const html = read(l[1]);
    const nav = grab(html, /<nav class="site-nav">([\s\S]*?)<\/nav>/);
    const marks = (nav.match(/class="nav-en"/g) || []).length;
    const hrefLangEn = (nav.match(/hreflang="en"/g) || []).length;
    /* The three English-only tools are the only entries that should carry it. */
    const tools = ['/my-name-in-chinese/', '/hanzi-to-pinyin/', '/stroke-order/'];
    const wrong = tools.filter(function (p) {
      const at = nav.indexOf('href="' + p + '"');
      if (at < 0) return false;
      const tag = nav.slice(at, nav.indexOf('</a>', at));
      return tag.indexOf('nav-en') < 0;
    });
    console.log('  [' + l[0] + '] EN marks: ' + marks + ' | hreflang=en: ' + hrefLangEn +
      ' | unmarked tool links: ' + (wrong.length ? wrong.join(', ') : 'none'));
  });

console.log('\n=== English-only pages: no hreflang block, canonical self ===');
['my-name-in-chinese/index.html', 'hanzi-to-pinyin/index.html', 'stroke-order/index.html']
  .forEach(function (p) {
    const html = read(p);
    const alt = (html.match(/rel="alternate"/g) || []).length;
    const canon = grab(html, /<link rel="canonical" href="([^"]+)">/);
    const lang = grab(html, /<html lang="([^"]+)">/);
    console.log('  ' + p + ' | lang=' + lang + ' | alternates=' + alt + ' | canonical=' + canon);
  });
