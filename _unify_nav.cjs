/* The three tool pages are hand-written HTML: they never pass through a
   generator, so their header and footer drift away from the rest of the site.
   They had a five-item nav with no /gifts/ entry and no language menu, and a
   reader who clicked from the generator to /stroke-order/ watched two of the
   six links disappear — it read as the navigation breaking rather than as a
   page that happens to be narrower.

   This script rewrites only those three pages, and only the two blocks that
   must match: the header (nav + language menu) and the footer's first column.
   It used to rewrite the nav on every page including the generated ones, with
   a five-item list typed out here; running it would silently undo /gifts/ on
   the whole site. Everything is now derived from _i18n, so a locale or a nav
   entry added there reaches these pages too.

   Run after _gen_home.cjs, or any time the nav changes. */
const fs = require('fs');
const path = require('path');
const i18n = require('./_i18n/index.cjs');
const { EN_ONLY, ORIGIN, langSwitch } = i18n;
const en = require('./_i18n/ui/en.cjs');
const { u } = require('./_assets.cjs');
/* The English tool pages use the shared nav too. For code='en' the markers are
   never emitted — the target is already in the reader's language — but going
   through the same function means there is no second list of six anchors to
   drift out of order. */
const { navFor, footTools } = require('./_nav.cjs');
const OG = require('./_og.cjs');

const ROOT = path.join(__dirname, 'site');

const BRAND = 'Chinese Name Helper';
const MARK = '<img class="brand-mark" src="/assets/img/mark.svg" width="34" height="34" alt="" aria-hidden="true">';

function headerFor(pagePath, eol) {
  return [
    '<header class="site-head">',
    '  <div class="wrap">',
    '    <a class="brand" href="/">' + MARK + '<span class="brand-name">' + BRAND + '</span></a>',
    '    <nav class="site-nav">',
    navFor('en', en),
    '    </nav>',
    '    ' + langSwitch('en', pagePath),
    '  </div>',
    '</header>'
  ].join(eol);
}

/* The footer keeps each page's own legal line; only the first column is
   rewritten, because that is the one that lists the tools. */
function toolsColumn(eol) {
  return [
    '    <div class="foot-col">',
    '      <h5>' + en['foot.tools'] + '</h5>',
    footTools('en', en),
    '    </div>'
  ].join(eol);
}

/* A second column so the footer has two lists on these pages too. The anchors
   point at the generator with a fragment, since the explanation sections live
   on the home page, not here. */
function learnColumn(eol) {
  return [
    '    <div class="foot-col">',
    '      <h5>' + en['foot.learn'] + '</h5>',
    '      <a href="/#how">' + en['foot.how'] + '</a>',
    '      <a href="/#generator">' + en['foot.generate'] + '</a>',
    '    </div>'
  ].join(eol);
}

/* These pages had a canonical link and a stylesheet but not one social tag,
   while the generated pages had carried og:title since the start — so the
   three links that get shared the most, because they are the ones people
   bookmark, were the only ones that unfurled as a bare grey line.

   The copy is lifted from the page's own title and description rather than
   retyped here: a second copy of the same sentence is a second place for it
   to drift. */
function ogBlock(slug, html, eol) {
  if (html.indexOf('property="og:title"') >= 0) return '';
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '';
  if (!title) return '';
  return [
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' + title + '">',
    '<meta property="og:description" content="' + desc + '">',
    '<meta property="og:url" content="' + ORIGIN + '/' + slug + '/">',
    '<meta property="og:site_name" content="' + BRAND + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + title + '">',
    '<meta name="twitter:description" content="' + desc + '">',
    OG.tags('tool-' + slug, ORIGIN, title)
  ].filter(Boolean).join(eol);
}

let changed = 0;
for (const pagePath of EN_ONLY) {
  const file = path.join(ROOT, pagePath.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) { console.log('  missing ' + pagePath); continue; }
  const original = fs.readFileSync(file, 'utf8');
  const eol = original.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
  /* All three pages are written with CRLF; normalise so the injected blocks
     match the surrounding file instead of producing a mixed-ending diff. */
  let s = original.split('\r\n').join('\n');

  /* ---- header ---- */
  const hs = s.indexOf('<header class="site-head">');
  const he = s.indexOf('</header>', hs);
  if (hs < 0 || he < 0) { console.log('  no header ' + pagePath); continue; }
  s = s.slice(0, hs) + headerFor(pagePath, '\n') + s.slice(he + '</header>'.length);

  /* ---- footer: first column + learn column ---- */
  const fs0 = s.indexOf('<footer class="site-foot">');
  const fe = s.indexOf('</footer>', fs0);
  if (fs0 >= 0 && fe >= 0) {
    let foot = s.slice(fs0, fe);
    const colStart = foot.indexOf('<div class="foot-col">');
    const colEnd = foot.indexOf('</div>', colStart);
    if (colStart >= 0 && colEnd >= 0) {
      /* colStart sits after the indentation that introduced the old column.
         Splicing the replacement in at that offset would keep those spaces and
         then add the block's own indent, so the opening tag ends up at column
         36 while every sibling is at column 4. Step back over the run of
         whitespace so the new block starts its own line. */
      let from = colStart;
      while (from > 0 && (foot[from - 1] === ' ' || foot[from - 1] === '\t')) from--;
      if (foot[from - 1] === '\n') from--;
      foot = foot.slice(0, from) + '\n' + toolsColumn('\n') + foot.slice(colEnd + '</div>'.length);
    }
    if (foot.indexOf('foot.learn') < 0 && foot.indexOf('>Learn<') < 0) {
      const legal = foot.indexOf('<div class="foot-legal">');
      if (legal > 0) foot = foot.slice(0, legal) + learnColumn('\n') + '\n' + foot.slice(legal);
    }
    s = s.slice(0, fs0) + foot + s.slice(fe);
  }

  /* ---- social tags, once ---- */
  const slug = pagePath.replace(/^\//, '').replace(/\/$/, '');
  const canonRe = /(<link rel="canonical" href="[^"]+">)/;
  if (canonRe.test(s)) {
    const block = ogBlock(slug, s, '\n');
    /* Function replacement, not a $-string: the block contains slashes and
       other characters that a replacement string would interpret. */
    if (block) s = s.replace(canonRe, function (m) { return m + '\n' + block; });
  }

  /* ---- stylesheet: same versioned URL as the generated pages ----
     These three were hand-written and point at the bare path. The generator
     emits ?v=<hash> so a changed stylesheet invalidates cache without a purge;
     leaving these on the bare path means a returning visitor keeps the old CSS
     and a newly added rule silently does nothing on exactly the pages that
     carry the most prose. Idempotent: the u() call yields one canonical URL. */
  s = s.replace(/<link rel="stylesheet" href="\/assets\/css\/main\.css(?:\?v=[a-f0-9]+)?">/g,
    '<link rel="stylesheet" href="' + u('/assets/css/main.css') + '">');

  /* ---- the hero watermark attribute is no longer styled ---- */
  s = s.replace(/<div class="wrap" data-mark="[^"]*">/g, '<div class="wrap">');

  if (eol === '\r\n') s = s.split('\n').join('\r\n');

  if (s !== original) {
    fs.writeFileSync(file, s, 'utf8');
    changed++;
    console.log('  updated ' + pagePath);
  } else {
    console.log('  unchanged ' + pagePath);
  }
}

console.log('tool pages updated: ' + changed + ' of ' + EN_ONLY.length);
