/**
 * The not-found page: site/404.html, one file, English.
 *
 * Why generate one rather than hand-write it like the three prose pages: the
 * header and footer are the two blocks that change most often (the nav gained
 * an entry, then its label changed), and a hand-written copy is exactly the
 * page nobody remembers to update. _unify_nav.cjs rewrites the header and
 * footer of the three EN_ONLY pages, but it is a fixer aimed at a known list —
 * it would not know a new hand-written page had appeared. Building it here
 * from the same _nav.cjs and langSwitch() means it inherits the next nav change
 * the same way the generated pages do.
 *
 * One file, not one per locale. A 404 is served for an arbitrary wrong URL;
 * there is no path to prefix, so /ja/typo does not become /ja/404.html. The
 * hosting layer returns this document and the browser resolves its absolute
 * links, which keeps every one of them pointing at a page that exists.
 *
 * noindex,follow on purpose: the page itself must never be indexed, but the
 * links out of it are the whole point, so they stay followable.
 *
 * Run any time after _gen_home.cjs, before _gen_sitemap.cjs. 404.html is not a
 * route and is deliberately left out of every sitemap.
 */
const fs = require('fs');
const path = require('path');
const { u } = require('./_assets.cjs');
/* Full path needed: a directory is not resolved to index.cjs. */
const i18n = require('./_i18n/index.cjs');
const { ORIGIN, BRAND, getLang, langSwitch } = i18n;
const en = require('./_i18n/ui/en.cjs');
/* Same nav source as every other page; see _nav.cjs. */
const { navFor, footTools } = require('./_nav.cjs');

const ROOT = path.join(__dirname, 'site');
const ORIGIN_HOST = ORIGIN.replace(/^https?:\/\//, '');
const lang = getLang('en');

const MARK = `<img class="brand-mark" src="${u('/assets/img/mark.svg')}" width="34" height="34" alt="" aria-hidden="true">`;
const ICON = '<link rel="icon" href="/favicon.svg?v=7da5aa03" type="image/svg+xml">';

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Copy, kept here rather than in ui/en.cjs. It is the only string on the site
   with exactly one reader, and a 404 page does not exist per locale, so it
   would sit in the shared bundle as a key three generators never look up. */
const T = {
  title: 'Page not found — Chinese Name Helper',
  desc: 'That address does not exist. Go back to the Chinese name generator, or browse the character library and the naming guides.',
  eyebrow: 'Error 404',
  h1a: 'This page',
  h1b: 'does not exist',
  sub: 'The address is wrong, or a page that used to be here has moved. Nothing is broken on your side.',
  back: 'Back to the name generator'
};

/* The page is a dead end by definition, so it is also the one page where the
   breadcrumb would be a lie: it has no position in the tree. No canonical
   either — a 404 must not claim an identity. */
function page() {
  return `<!DOCTYPE html>
<html lang="${lang.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(T.title)}</title>
<meta name="description" content="${esc(T.desc)}">
<meta name="robots" content="noindex,follow">

${ICON}
<link rel="stylesheet" href="${u('/assets/css/main.css')}">
</head>
<body>

<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/">${MARK}<span class="brand-name">${esc(BRAND)}</span></a>
    <nav class="site-nav">
${navFor('en', en)}
    </nav>
    ${langSwitch('en', '/')}
  </div>
</header>

<main>
  <section class="page-head">
    <div class="wrap wrap-narrow">
      <div class="eyebrow">${esc(T.eyebrow)}</div>
      <h1 class="hero-title">${esc(T.h1a)} <span class="accent">${esc(T.h1b)}</span></h1>
      <p class="hero-sub">${esc(T.sub)}</p>
      <p style="margin-top:22px"><a class="btn btn-ghost" style="text-decoration:none" href="/">${esc(T.back)}</a></p>
    </div>
  </section>
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="foot-col">
      <h5>${esc(en['foot.tools'])}</h5>
${footTools('en', en)}
    </div>
    <div class="foot-col">
      <h5>${esc(en['foot.learn'])}</h5>
      <a href="/#how">${esc(en['foot.how'])}</a>
      <a href="/#generator">${esc(en['foot.generate'])}</a>
    </div>
    <div class="foot-legal">
      <div class="brand">${MARK}<span class="brand-name">${esc(BRAND)}</span></div>
      <p>${esc(en['foot.legal'])}</p>
      <p>© <span id="yr">2026</span> ${esc(BRAND)} · <a href="${ORIGIN}/">${ORIGIN_HOST}</a></p>
    </div>
  </div>
</footer>
<script src="${u('/assets/js/app-foot.js')}"></script>
</body>
</html>
`;
}

fs.writeFileSync(path.join(ROOT, '404.html'), page(), 'utf8');
console.log('wrote 404.html (noindex,follow; nav and footer from _nav.cjs)');
