/**
 * Build the carrier pages: /gifts/ plus one page per carrier, in every shipped
 * locale.
 *
 * The pages are written from _gifts/catalog.cjs (what exists and what it
 * demands), _gifts/text.<code>.cjs (the prose) and the character library (which
 * characters actually fit). The library is what makes these pages more than
 * affiliate copy: a carrier declares a stroke ceiling, and the page prints the
 * characters that clear it and the ones that do not, both drawn from the same
 * data the character pages use.
 *
 * Run after _gen_chars.cjs — the sample grids link into the character pages,
 * and those have to exist for the links to resolve.
 */
const fs = require('fs');
const path = require('path');
const { u } = require('./_assets.cjs');
const { execFileSync } = require('child_process');
/* Full path needed: a directory is not resolved to index.cjs. */
const i18n = require('./_i18n/index.cjs');
/* Shared with the home and character generators so every page of a locale
   marks the English-only nav entries the same way; see _nav.cjs. */
const { navFor, footTools } = require('./_nav.cjs');
const {
  ORIGIN, BRAND, SHIPPED, getLang, load: i18nLoad, fmt, href, link, hreflang, canonical, langSwitch
} = i18n;
const OG = require('./_og.cjs');

const CATALOG = require('./_gifts/catalog.cjs');
const CONTACT = CATALOG.CONTACT;
const ART = require('./_gifts/art.cjs').ART;

const ROOT = path.join(__dirname, 'site');
const DATA = path.join(ROOT, 'assets', 'data');
const ORIGIN_HOST = ORIGIN.replace(/^https?:\/\//, '');
const g = globalThis;

function loadData(file, key) {
  const src = fs.readFileSync(path.join(DATA, file), 'utf8');
  return new Function('window', src + '\nreturn window.' + key + ';')(g);
}

const ALL = [].concat(loadData('characters.js', 'HANZI'), loadData('characters2.js', 'HANZI2'));
const REC = {};
ALL.forEach(function (c) { if (c && c.c && !REC[c.c]) REC[c.c] = c; });
const CHARS = Object.keys(REC);

const MARKET = `<img class="brand-mark" src="${u('/assets/img/mark.svg')}" width="34" height="34" alt="" aria-hidden="true">`;
const ICON = '<link rel="icon" href="/favicon.svg?v=7da5aa03" type="image/svg+xml">';

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function rich(str, vars) {
  return fmt(esc(str), vars)
    .replace(/\{bold\}/g, '<b>').replace(/\{\/bold\}/g, '</b>')
    .replace(/\{em\}/g, '<em>').replace(/\{\/em\}/g, '</em>');
}

function plain(str, vars) {
  return fmt(str, vars).replace(/\{\/?\w+\}/g, '');
}

/* Text bundle for a locale. English is the source, so it is also the fallback
   if a carrier has no entry yet — better an English paragraph than a blank. */
const TEXT = {};
SHIPPED.forEach(function (code) {
  TEXT[code] = require('./_gifts/text.' + code + '.cjs');
});

/* ---------- which characters suit a carrier ----------
 *
 * The rule is a stroke ceiling, not a taste judgement, so the page can state it
 * plainly and the reader can check it against any character they like. The
 * sample set is spread across the library rather than taking the first eight
 * hits, which would otherwise all be the simple characters and make the grid
 * look like a default list. */
function samplesFor(item) {
  const max = item.fit.maxStrokes;
  const pool = CHARS.filter(function (c) { return REC[c].s <= max; });
  const dense = CHARS.filter(function (c) { return REC[c].s > max; });

  /* Even spread by stroke count: sort, then walk the list with a stride so the
     eight shown span the whole range instead of clustering at 4 strokes. */
  pool.sort(function (a, b) { return REC[a].s - REC[b].s; });
  const stride = Math.max(1, Math.floor(pool.length / 8));
  const fits = [];
  for (let i = 0; i < pool.length && fits.length < 8; i += stride) fits.push(pool[i]);

  /* The characters that do NOT fit are the more useful half of the answer:
     someone who already picked 曦 needs to know that before ordering. Sorted
     by stroke count so the densest — the clearest illustration of the limit —
     appear first. */
  dense.sort(function (a, b) { return REC[b].s - REC[a].s; });
  return { fits: fits, dense: dense.slice(0, 3) };
}

function gloss(t, code, ch) {
  const gl = t.chars && t.chars[ch];
  return gl ? gl.m : REC[ch].m;
}

/* The card name follows from the path, so the two call sites cannot disagree
   about it: /gifts/ is the hub card for that locale, /gifts/blade/ is that
   carrier's card. The generator names them exactly this way. */
function ogCard(selfPath, code) {
  const m = /^\/gifts\/([^/]+)\/$/.exec(selfPath);
  return m ? 'gift-' + m[1] + '-' + code : 'gifts-' + code;
}

function head(code, selfPath, title, desc, lang, jsonld) {
  const pathFor = function () { return selfPath; };
  return `<!DOCTYPE html>
<html lang="${lang.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical(code, selfPath)}">
${hreflang(pathFor)}
<meta name="robots" content="index,follow,max-image-preview:large">

<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical(code, selfPath)}">
<meta property="og:site_name" content="${esc(BRAND)}">
<meta property="og:locale" content="${lang.ogLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
${OG.tags(ogCard(selfPath, code), ORIGIN, esc(title))}

${ICON}
<link rel="stylesheet" href="${u('/assets/css/main.css')}">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>`;
}

/* Nav and footer strings come from the shared ui bundle, not from the gift
   text: the header is identical on every page of the site, and duplicating
   "Generate a name" into nine carrier files would be nine places to fix a typo.
   Only `nav.gifts` lives in the gift bundle, because that label exists solely
   for this section. */
function header(ui, gt, code, pathFor) {
  return `<body>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${href(code, '/')}">${MARKET}<span class="brand-name">${esc(BRAND)}</span></a>
    <nav class="site-nav">
${navFor(code, ui, '/gifts/', gt['nav.gifts'])}
    </nav>
    ${langSwitch(code, pathFor)}
  </div>
</header>`;
}

function footer(ui, gt, code) {
  return `<footer class="site-foot">
  <div class="wrap">
    <div class="foot-col">
      <h5>${esc(ui['foot.tools'])}</h5>
${footTools(code, ui)}
    </div>
    <div class="foot-col">
      <h5>${esc(ui['foot.learn'])}</h5>
      <a href="${href(code, '/characters/')}">${esc(ui['nav.characters'])}</a>
      <a href="${href(code, '/gifts/')}">${esc(gt['nav.gifts'])}</a>
    </div>
    <div class="foot-legal">
      <div class="brand">${MARKET}<span class="brand-name">${esc(BRAND)}</span></div>
      <p>${esc(ui['foot.legal'])}</p>
      <p>© <span id="yr">2026</span> ${esc(BRAND)} · <a href="${ORIGIN}/">${ORIGIN_HOST}</a></p>
    </div>
  </div>
</footer>
<script src="${u('/assets/js/lang-hint.js')}" defer></script>
</body>
</html>
`;
}

/* ---------- hub ---------- */
function hubPage(code) {
  const t = TEXT[code];
  const L = i18nLoad(code);
  const lang = getLang(code);
  const selfPath = '/gifts/';

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': canonical(code, selfPath),
        name: plain(t['hub.title']),
        description: plain(t['hub.desc']),
        url: canonical(code, selfPath),
        inLanguage: lang.htmlLang,
        isPartOf: { '@type': 'WebSite', name: BRAND, url: ORIGIN + href(code, '/') },
        hasPart: CATALOG.map(function (item) {
          return {
            '@type': 'Article',
            name: plain(t[item.slug].title),
            url: canonical(code, '/gifts/' + item.slug + '/'),
            inLanguage: lang.htmlLang
          };
        })
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: L.ui['nav.generator'], item: canonical(code, '/') },
          { '@type': 'ListItem', position: 2, name: t['label.crumb'], item: canonical(code, selfPath) }
        ]
      }
    ]
  };

  const cards = CATALOG.map(function (item) {
    const c = t[item.slug];
    /* u() not the bare path: _headers gives /assets/* a one-year immutable
       cache, so the URL has to be the cache key. A carrier whose photo is
       replaced keeps its filename, and a bare /assets/img/gifts/tea.jpg would
       then be frozen in every returning browser for a year. Hashing costs one
       read per distinct file and makes the swap visible immediately. */
    const thumb = u(item.photo
      ? '/assets/img/gifts/' + item.photo
      : '/assets/img/gifts/' + item.image + '.svg');
    return `        <a class="gift-card" href="${href(code, '/gifts/' + item.slug + '/')}">
          <div class="gift-thumb"><img class="${item.photo ? 'gift-photo' : ''}" src="${thumb}" width="400" height="300" alt="${esc(plain(c.title))}" loading="lazy"></div>
          <div class="gift-card-body">
            <div class="gift-card-head">
              <span class="gift-ico" aria-hidden="true">${esc(item.icon)}</span>
              <h3>${esc(c.name)}</h3>
            </div>
            <p>${esc(c.blurb)}</p>
            <span class="gift-more">${esc(t['label.view'])} →</span>
          </div>
        </a>`;
  }).join('\n');

  return head(code, selfPath, t['hub.title'], t['hub.desc'], lang, jsonld) + '\n' +
    header(L.ui, t, code, '/gifts/') + `

<main>
  <section class="page-head">
    <div class="wrap">
      <nav class="crumb">
        <a href="${href(code, '/')}">${esc(L.ui['nav.generator'])}</a><span>/</span><span>${esc(t['label.crumb'])}</span>
      </nav>
      <div class="eyebrow">${esc(t['hub.eyebrow'])}</div>
      <h1 class="hero-title">${esc(t['hub.h1a'])} <span class="accent">${esc(t['hub.h1b'])}</span></h1>
      <p class="hero-sub">${esc(t['hub.sub'])}</p>
      <p class="hero-note">${rich(t['hub.note'])}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="gift-grid">
${cards}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap wrap-narrow">
      <h2>${esc(t['hub.pick.head'])}</h2>
      <p class="lede">${esc(t['hub.pick.body'])}</p>
      <a class="btn-ghost btn-sm" href="${href(code, '/')}">${esc(t['hub.pick.cta'])}</a>
    </div>
  </section>

  <section class="section">
    <div class="wrap wrap-narrow">
      <h2>${esc(t['hub.more.head'])}</h2>
      <p class="lede">${esc(t['hub.more.p1'])}</p>
      <p class="lede">${esc(t['hub.more.p2'])}</p>
      <p class="lede">${esc(t['hub.more.p3'])}</p>
    </div>
  </section>
</main>

` + footer(L.ui, t, code);
}

/* ---------- one carrier ---------- */
function carrierPage(code, item) {
  const t = TEXT[code];
  const c = t[item.slug];
  const L = i18nLoad(code);
  const lang = getLang(code);
  const selfPath = '/gifts/' + item.slug + '/';
  const s = samplesFor(item);

  const charsLabel = item.fit.chars === 1 ? '1' : '1–' + item.fit.chars;
  /* Same cache-key rule as the hub cards: the photo on this page is the one
     most likely to be replaced later, and a bare path would pin the old one in
     every returning browser for a year once _headers ships. */
  const hero = u(item.photo
    ? '/assets/img/gifts/' + item.photo
    : '/assets/img/gifts/' + item.image + '.svg');

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': canonical(code, selfPath),
        name: plain(c.title),
        description: plain(c.desc),
        url: canonical(code, selfPath),
        inLanguage: lang.htmlLang,
        isPartOf: { '@type': 'WebSite', name: BRAND, url: ORIGIN + href(code, '/') }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: L.ui['nav.generator'], item: canonical(code, '/') },
          { '@type': 'ListItem', position: 2, name: t['label.crumb'], item: canonical(code, '/gifts/') },
          { '@type': 'ListItem', position: 3, name: plain(c.name), item: canonical(code, selfPath) }
        ]
      }
    ]
  };

  function chips(list, cls) {
    return list.map(function (ch) {
      return `        <a class="char-chip${cls}" href="${href(code, '/character/' + encodeURIComponent(ch) + '/')}">
          <b>${esc(ch)}</b>
          <i>${esc(REC[ch].p)}</i>
          <span>${esc(REC[ch].s)}</span>
        </a>`;
    }).join('\n');
  }

  /* The form is only emitted when a real address is configured. A button that
     opens a pre-filled mail to nobody is worse than no button, so the whole
     block disappears instead of shipping as decoration. */
  const formBlock = CONTACT ? `
  <section class="section" id="enquire">
    <div class="wrap wrap-narrow">
      <h2>${esc(t['form.head'])}</h2>
      <p class="lede">${esc(t['form.lead'])}</p>
      <form class="gift-form" id="gift-form" data-contact="${esc(CONTACT)}"
            data-carrier="${esc(plain(c.name))}" data-lang="${esc(lang.htmlLang)}">
        <div class="form-row">
          <label for="gf-name">${esc(t['form.name'])}</label>
          <input id="gf-name" name="name" type="text" autocomplete="name" required>
        </div>
        <div class="form-row">
          <label for="gf-email">${esc(t['form.email'])}</label>
          <input id="gf-email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="form-row">
          <span class="form-static">${esc(t['form.carrier'])}</span>
          <b class="form-value">${esc(plain(c.name))}</b>
        </div>
        <div class="form-row">
          <label for="gf-cn">${esc(t['form.chinese'])}</label>
          <input id="gf-cn" name="chinese" type="text">
        </div>
        <div class="form-row">
          <label for="gf-msg">${esc(t['form.message'])}</label>
          <textarea id="gf-msg" name="message" rows="4" placeholder="${esc(t['form.messageph'])}"></textarea>
        </div>
        <button class="btn" type="submit">${esc(t['form.send'])}</button>
        <p class="gift-form-note">${esc(t['form.note'])}</p>
        <p class="gift-form-fallback">${esc(t['form.fallback'])}
          <a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a></p>
      </form>
    </div>
  </section>` : '';

  const others = CATALOG.filter(function (o) { return o.slug !== item.slug; }).slice(0, 5).map(function (o) {
    return `        <a class="gift-mini" href="${href(code, '/gifts/' + o.slug + '/')}">
          <span class="gift-ico" aria-hidden="true">${esc(o.icon)}</span>
          <b>${esc(plain(TEXT[code][o.slug].name))}</b>
        </a>`;
  }).join('\n');

  /* ---------- the workshop ----------
   * The panel that lets a visitor order something other than a generated name:
   * their own characters, nothing at all, or a picture reduced to a seal mark.
   *
   * The controls are plain HTML and the preview is a canvas, so the page is
   * usable with no JavaScript at all: the illustration above already shows the
   * carrier, and the enquiry form below still works. The panel only adds the
   * ability to see your own content on the object before asking a price. */
  var cwStrings = {};
  ['cw.eyebrow', 'cw.head', 'cw.lead', 'cw.mode.name', 'cw.mode.none', 'cw.mode.motif',
   'cw.name.label', 'cw.name.ph', 'cw.name.hint', 'cw.count', 'cw.none.hint',
   'cw.motif.hint', 'cw.motif.pick', 'cw.motif.drop', 'cw.motif.thumb',
   'cw.motif.err.type', 'cw.motif.err.size', 'cw.motif.err.empty',
   'cw.proof', 'cw.download', 'cw.confirm', 'cw.tip'].forEach(function (k) {
    cwStrings[k] = t[k] || '';
  });

  /* The name hint names both the limit and the layout, and every locale writes
     those into its own sentence, so the values are substituted at build time
     rather than assembled in the browser. */
  cwStrings['cw.name.hint'] = fmt(t['cw.name.hint'], {
    n: charsLabel,
    layout: t['fit.layout.' + item.fit.layout]
  });
  cwStrings['cw.name.ph'] = fmt(t['cw.name.ph'], { n: charsLabel });

  var workshopBlock = `
  <section class="section" id="workshop">
    <div class="wrap">
      <div class="cw-head">
        <div class="eyebrow">${esc(t['cw.eyebrow'])}</div>
        <h2>${esc(t['cw.head'])}</h2>
        <p class="lede">${esc(t['cw.lead'])}</p>
      </div>

      <div class="cw" id="cw" data-slug="${esc(item.slug)}"
           data-chars="${item.fit.chars}" data-layout="${esc(item.fit.layout)}"
           data-layout-name="${esc(t['fit.layout.' + item.fit.layout])}">
        <div class="cw-controls">
          <div class="cw-modes" role="group" aria-label="${esc(t['cw.head'])}">
            <button type="button" class="cw-mode" data-mode="name" aria-pressed="true">${esc(t['cw.mode.name'])}</button>
            <button type="button" class="cw-mode" data-mode="none" aria-pressed="false">${esc(t['cw.mode.none'])}</button>
            <button type="button" class="cw-mode" data-mode="motif" aria-pressed="false">${esc(t['cw.mode.motif'])}</button>
          </div>

          <div class="cw-pane" data-pane="name">
            <label class="cw-label" for="cw-text">${esc(t['cw.name.label'])}</label>
            <div class="cw-input-row">
              <input id="cw-text" type="text" autocomplete="off" spellcheck="false"
                     placeholder="${esc(fmt(t['cw.name.ph'], { n: charsLabel }))}">
              <span class="cw-count" id="cw-count"></span>
            </div>
            <p class="cw-hint">${esc(fmt(t['cw.name.hint'], { n: charsLabel, layout: t['fit.layout.' + item.fit.layout] }))}</p>
          </div>

          <div class="cw-pane" data-pane="none" hidden>
            <p class="cw-hint">${esc(t['cw.none.hint'])}</p>
          </div>

          <div class="cw-pane" data-pane="motif" hidden>
            <p class="cw-hint">${esc(t['cw.motif.hint'])}</p>
            <div class="cw-drop" id="cw-drop">
              <label class="cw-pick" for="cw-file">${esc(t['cw.motif.pick'])}</label>
              <input id="cw-file" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml">
              <span class="cw-or">${esc(t['cw.motif.drop'])}</span>
            </div>
            <div class="cw-thumb" id="cw-thumb-wrap" hidden>
              <canvas id="cw-thumb" width="96" height="96"></canvas>
              <span>${esc(t['cw.motif.thumb'])}</span>
            </div>
            <p class="cw-err" id="cw-err" role="alert" hidden></p>
          </div>
        </div>

        <div class="cw-proof">
          <div class="cw-proof-head"><span>${esc(t['cw.proof'])}</span></div>
          <canvas id="cw-canvas" width="800" height="600" role="img"
                  aria-label="${esc(plain(c.title))}"></canvas>
          <p class="cw-tip">${esc(t['cw.tip'])}</p>
          <div class="cw-actions">
            <button type="button" class="btn-ghost btn-sm" id="cw-download">${esc(t['cw.download'])}</button>
            <button type="button" class="btn btn-sm cw-send" id="cw-confirm">${esc(t['cw.confirm'])}</button>
          </div>
        </div>
      </div>
    </div>
  </section>`;

  return head(code, selfPath, c.title, c.desc, lang, jsonld) + '\n' +
    header(L.ui, t, code, selfPath) + `

<main>
  <section class="page-head">
    <div class="wrap">
      <nav class="crumb">
        <a href="${href(code, '/')}">${esc(L.ui['nav.generator'])}</a><span>/</span><a href="${href(code, '/gifts/')}">${esc(t['label.crumb'])}</a><span>/</span><span>${esc(plain(c.name))}</span>
      </nav>
      <h1 class="hero-title">${esc(c.h1a)} <span class="accent">${esc(c.h1b)}</span></h1>
      <p class="hero-sub">${esc(c.sub)}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <figure class="gift-fig">
        <img class="${item.photo ? 'gift-photo' : ''}" src="${hero}" width="400" height="300" alt="${esc(plain(c.title))}">
        <figcaption>${esc(c.aside)}${item.photo ? '' : ' · ' + esc(t['label.placeholder'])}</figcaption>
      </figure>
      <div class="gift-stats">
        <div class="gift-stat"><span>${esc(t['fit.charslabel'])}</span><b>${esc(charsLabel)}</b></div>
        <div class="gift-stat"><span>${esc(t['fit.strokeslabel'])}</span><b>≤ ${item.fit.maxStrokes}</b></div>
        <div class="gift-stat"><span>${esc(t['fit.layoutlabel'])}</span><b>${esc(t['fit.layout.' + item.fit.layout])}</b></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap wrap-narrow">
      <h2>${esc(t['label.which'])}</h2>
      <p class="lede">${esc(c.which)}</p>
      <h2>${esc(t['label.layout'])}</h2>
      <p class="lede">${esc(c.layout)}</p>
      <h2>${esc(t['label.qualify'])}</h2>
      <p class="lede">${esc(c.qualify)}</p>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <h2>${esc(t['label.samples'])}</h2>
      <p class="lede">${esc(fmt(t['fit.rule'], { strokes: item.fit.maxStrokes }))}</p>
      <div class="char-chips">
${chips(s.fits, '')}
      </div>
      <p class="lede gift-dense-note">${esc(fmt(t['fit.deepnote'], { strokes: item.fit.maxStrokes }))}</p>
      <div class="char-chips">
${chips(s.dense, ' char-chip-deep')}
      </div>
    </div>
  </section>
${formBlock}
${workshopBlock}
  <section class="section">
    <div class="wrap">
      <h2>${esc(t['label.more'])}</h2>
      <div class="gift-minis">
${others}
      </div>
      <p><a class="btn-ghost btn-sm" href="${href(code, '/gifts/')}">${esc(t['label.all'])}</a></p>
    </div>
  </section>
</main>

<script src="${u('/assets/data/gift-anchors.js')}"></script>
<script src="${u('/assets/js/configurator.js')}"></script>
<script>
window.CW_I18N = ${JSON.stringify(cwStrings, null, 2).replace(/<\//g, '<\\/')};
</script>
<script src="${u('/assets/js/workshop.js')}"></script>
<script src="${u('/assets/js/gifts.js')}"></script>
` + footer(L.ui, t, code);
}

/* ---------- write ---------- */
fs.mkdirSync(path.join(ROOT, 'assets', 'img', 'gifts'), { recursive: true });
let artCount = 0;
Object.keys(ART).forEach(function (slug) {
  fs.writeFileSync(path.join(ROOT, 'assets', 'img', 'gifts', slug + '.svg'), ART[slug], 'utf8');
  artCount++;
});

/* Blank plates for the configurator: the same drawing with every engraved
   glyph removed, so the browser can stamp the visitor's own content into the
   real recess. ANCHORS says where.

   ART is built once at require time, so a blank plate cannot be produced by
   flipping a flag in this process. A small child process runs with BLANK=1 and
   writes all ten files itself, then exits. Doing it here would have to
   re-evaluate a 400-line module for every carrier. */
const ANCHORS = require('./_gifts/art.cjs').ANCHORS;

/* The blank plates must be built in a clean process — see the note above. */
execFileSync(process.execPath, [path.join(__dirname, '_gen_giftblanks.cjs')], {
  cwd: __dirname,
  env: Object.assign({}, process.env, { BLANK: '1' }),
  stdio: 'inherit'
});

const anchorFile = path.join(ROOT, 'assets', 'data', 'gift-anchors.js');
fs.writeFileSync(
  anchorFile,
  '/* Where a visitor\'s name or motif lands on each carrier, in the 400x300\n' +
  '   viewBox of its illustration. Emitted by _gen_gifts.cjs from the anchor\n' +
  '   table in _gifts/art.cjs, so the preview and the drawing cannot drift. */\n' +
  'window.GIFT_ANCHORS = ' + JSON.stringify(ANCHORS, null, 2) + ';\n',
  'utf8'
);

let pages = 0;
SHIPPED.forEach(function (code) {
  const hubDir = path.join(ROOT, getLang(code).prefix, 'gifts');
  fs.mkdirSync(hubDir, { recursive: true });
  fs.writeFileSync(path.join(hubDir, 'index.html'), hubPage(code), 'utf8');
  pages++;

  CATALOG.forEach(function (item) {
    const dir = path.join(hubDir, item.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), carrierPage(code, item), 'utf8');
    pages++;
  });
});

if (!CONTACT) {
  console.log('NOTE: enquiry form skipped — set CONTACT in _gifts/catalog.cjs to enable it');
}
console.log('wrote ' + pages + ' gift pages across [' + SHIPPED.join(', ') + '] (' +
  CATALOG.length + ' carriers, ' + artCount + ' illustrations, ' + CHARS.length + ' characters to draw from)');
