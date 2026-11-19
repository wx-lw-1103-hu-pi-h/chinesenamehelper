/* Build one static page per character: /character/<char>/index.html
 *
 * Why static files instead of one dynamic page: a URL that exists on disk is
 * crawlable without executing JavaScript, and every character gets its own
 * title, description and canonical. That is the difference between a site that
 * ranks and a site that is one page pretending to be a hundred.
 *
 * Every shipped locale gets its own full set under its prefix (/pt/character/明/).
 * The page is built from ui/<code>.cjs strings and chars/<code>.cjs glosses, not
 * from the English text, so /pt/ is Portuguese HTML in the crawler's eyes and
 * not English HTML with strings swapped after load.
 */
const fs = require('fs');
const path = require('path');
const { u } = require('./_assets.cjs');
/* 必须写全 index.cjs：Node 的目录解析只认 index.js / index.json / index.node，
   不会把 index.cjs 当作目录入口，require('./_i18n') 会直接抛 MODULE_NOT_FOUND。 */
const i18n = require('./_i18n/index.cjs');
const {
  ORIGIN, BRAND, SHIPPED, getLang, load: i18nLoad, fmt, href, link, hreflang, canonical, langSwitch
} = i18n;
/* Shared with the home and gift generators so every page of a locale marks the
   English-only nav entries the same way; see _nav.cjs. */
const { navFor, footTools } = require('./_nav.cjs');
const OG = require('./_og.cjs');

const ROOT = path.join(__dirname, 'site');
const DATA = path.join(ROOT, 'assets', 'data');
const ORIGIN_HOST = ORIGIN.replace(/^https?:\/\//, '');
const g = globalThis;

function load(file, key) {
  const src = fs.readFileSync(path.join(DATA, file), 'utf8');
  const fn = new Function('window', src + '\nreturn window.' + key + ';');
  return fn(g);
}

const ALL = [].concat(load('characters.js', 'HANZI'), load('characters2.js', 'HANZI2'));
const SURNAMES = load('characters.js', 'SURNAMES');

/* de-duplicate by character, first record wins */
const REC = {};
ALL.forEach(function (c) { if (c && c.c && !REC[c.c]) REC[c.c] = c; });
const CHARS = Object.keys(REC);

const ELEM_EN = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };
const ELEM_PR = { '木': 'Mù', '火': 'Huǒ', '土': 'Tǔ', '金': 'Jīn', '水': 'Shuǐ' };
const GENDER_EN = { m: 'more often a masculine name', f: 'more often a feminine name', n: 'unisex' };
/* Element keys in the ui files are the English names: el.wood, el.fire, ... */
function elemKey(elem) { return ELEM_EN[elem] || elem; }

/* The index is grouped by element rather than listed as 120 identical cards.
   Wood, fire, earth, metal, water is the order the five are always recited in,
   so the sections read as a known sequence instead of an arbitrary cut. */
const ELEM_ORDER = ['木', '火', '土', '金', '水'];
const GROUPS = ELEM_ORDER.map(function (elem) {
  return { elem: elem, en: ELEM_EN[elem], chars: CHARS.filter(function (c) { return REC[c].wx === elem; }) };
}).filter(function (g) { return g.chars.length; });

const HANZI_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Stroke-count band, as a key into the freq.* strings rather than an English
   sentence — the same band has to read as Portuguese on /pt/. */
function freqKey(rec) {
  if (rec.s <= 5) return 'simple';
  if (rec.s <= 10) return 'common';
  if (rec.s <= 16) return 'dense';
  return 'complex';
}

/* The mark is the character's own outlines, so it never depends on a system
   serif being installed. */
const MARK = `<img class="brand-mark" src="${u('/assets/img/mark.svg')}" width="34" height="34" alt="" aria-hidden="true">`;
const ICON = '<link rel="icon" href="/favicon.svg?v=7da5aa03" type="image/svg+xml">';

function page(ch, code) {
  const rec = REC[ch];
  const py = rec.p;
  const elem = rec.wx;
  const elemEn = ELEM_EN[elem] || elem;
  const strokes = rec.s;

  /* Strings for this locale. English is the source language, so its ui file is
     also the fallback when a gloss is missing. */
  const L = i18nLoad(code);
  const t = L.ui;
  const gl = (L.chars && L.chars[ch]) || null;
  const lang = getLang(code);

  /* The gloss fields: m meaning, l the classical line in the local language,
     w the Western parallel, n the naming note. English reads them straight off
     the data file; every other locale has its own rewritten set. */
  const meaning = gl ? gl.m : rec.m;
  const lineLoc = gl ? gl.l : rec.lineEn;
  const west = gl ? gl.w : rec.west;
  const note = gl ? gl.n : rec.note;

  const title = fmt(t['char.title'], { ch: ch, py: py });
  const desc = fmt(t['char.desc'], {
    ch: ch, py: py, meaning: meaning, strokes: strokes, elem: t['el.' + elemKey(elem)] || elemEn
  });

  const siblings = CHARS.filter(function (o) { return o !== ch && REC[o].wx === elem; }).slice(0, 10);

  /* One path per locale, so the canonical, the hreflang set and the body links
     are all derived from the same expression and cannot drift apart. */
  const pathFor = function (c) { return '/character/' + encodeURIComponent(ch) + '/'; };
  const selfPath = pathFor(code);
  const crumbGen = fmt(t['char.crumbgen'], {});
  const crumbChars = fmt(t['char.crumbchars'], {});

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm',
        name: ch,
        description: py + ' — ' + meaning,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: t['chars.title'],
          url: canonical(code, '/')
        },
        url: canonical(code, selfPath)
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: crumbGen, item: canonical(code, '/') },
          { '@type': 'ListItem', position: 2, name: crumbChars, item: canonical(code, '/characters/') },
          { '@type': 'ListItem', position: 3, name: ch + ' ' + py }
        ]
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="${lang.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical(code, selfPath)}">
${hreflang(pathFor)}
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(fmt(t['char.title'], { ch: ch, py: py }))}">
<meta property="og:description" content="${esc(meaning)}">
<meta property="og:url" content="${canonical(code, selfPath)}">
<meta property="og:locale" content="${lang.ogLocale}">
${OG.tags(OG.charName(ch), ORIGIN, esc(ch + ' (' + py + ') — ' + meaning))}
<link rel="stylesheet" href="${u('/assets/css/main.css')}">
${ICON}
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
<style>
  /* The character page used to open on the ink band, so its facts were built
     from translucent white-on-black tokens. The band is paper now; these are
     the same blocks re-cut against the page. */
  .hz-hero { display:flex; gap:28px; align-items:center; flex-wrap:wrap; margin:0; }
  /* 米字格. The plate used to draw only the centre cross and its outer edges,
     which is a 田字格 — and this is the largest character on the site, so the
     missing diagonals were the most visible version of the same mistake the
     result card had. The diagonals are painted as a second gradient layer over
     the quarter rules; they stop at the frame because background-size is the
     full plate. */
  .hz-plate {
    width:198px; height:198px; flex:none;
    border:1px solid var(--line); border-radius:2px; position:relative;
    /* quarter rules, then the two diagonals, then the celadon sheet under them */
    background-image:
      linear-gradient(to right, #bccfc2 1px, transparent 1px),
      linear-gradient(to bottom, #bccfc2 1px, transparent 1px),
      linear-gradient(to bottom right, transparent calc(50% - .5px), #bccfc2 calc(50% - .5px), #bccfc2 calc(50% + .5px), transparent calc(50% + .5px)),
      linear-gradient(to bottom left, transparent calc(50% - .5px), #bccfc2 calc(50% - .5px), #bccfc2 calc(50% + .5px), transparent calc(50% + .5px)),
      linear-gradient(180deg,#fcfffd,#e0eae2);
    background-size:50% 100%, 100% 50%, 100% 100%, 100% 100%, 100% 100%;
  }
  .hz-facts { flex:1; min-width:260px; }
  .hz-big {
    font-family:var(--serif); font-size:clamp(46px,8vw,82px); margin:0 0 2px;
    line-height:1; color:var(--ink); letter-spacing:.01em;
  }
  .hz-py { font-size:18px; color:var(--cinnabar); font-family:var(--serif); margin:0 0 7px; letter-spacing:.05em; }
  .hz-def { font-size:17px; color:var(--ink-soft); margin:0 0 18px; line-height:1.6; max-width:520px; }
  .hz-fact-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(122px,1fr)); gap:10px; margin-bottom:20px; }
  .hz-fact {
    background:var(--card); border:1px solid var(--line);
    border-radius:var(--radius-sm); padding:10px 12px;
  }
  .hz-fact span { display:block; font-size:10.5px; text-transform:uppercase; letter-spacing:.11em; color:var(--ink-mute); margin-bottom:3px; font-weight:700; }
  .hz-fact b { font-size:16px; font-family:var(--serif); color:var(--ink); }
  .hz-fact i { font-size:12px; color:var(--ink-mute); font-style:normal; display:block; margin-top:2px; }
  .hz-body { padding-top:0; }
  .hz-src {
    background:var(--card); border:1px solid var(--line);
    border-radius:var(--radius); padding:22px 24px 20px;
    margin:0 0 16px; position:relative; z-index:1;
    box-shadow: var(--shadow-sm);
  }
  .hz-src .cite { font-family:var(--serif); font-size:14px; color:var(--cinnabar); margin:0 0 7px; font-weight:600; }
  .hz-src .quote { font-family:var(--serif); font-size:23px; color:var(--ink); margin:0 0 9px; line-height:1.72; letter-spacing:.05em; }
  .hz-src .en { font-size:14px; color:var(--ink-soft); margin:0 0 9px; font-style:italic; }
  .hz-src .west { font-size:13.5px; color:var(--jade); margin:0; padding:9px 12px; background:var(--paper-2); border:1px solid rgba(47,109,89,.16); border-left:2px solid var(--jade); border-radius:var(--radius-sm); }
  .hz-note {
    background:var(--paper-2);
    border:1px solid var(--line); border-radius:var(--radius-sm); padding:13px 16px;
    font-size:13.5px; color:var(--ink-soft); margin:0 0 16px;
  }
  .hz-note b { color:var(--cinnabar); }
  .hz-cta { display:flex; gap:10px; flex-wrap:wrap; margin:0 0 14px; }
  /* Desktop leaves only ~0.6px between the hint's last line and the source
     card, which the -46px bite eats into. Reclaim the room here. */
  .hz-hint { margin-top:2px; padding-bottom:6px; }
  .hz-sib { display:flex; flex-wrap:wrap; gap:9px; margin-top:14px; }
  .hz-sib a {
    display:grid; place-items:center; width:46px; height:46px;
    background:var(--card);
    border:1px solid var(--line); border-radius:var(--radius-sm); font-family:var(--serif);
    font-size:21px; color:var(--ink); text-decoration:none; transition:.18s;
  }
  .hz-sib a:hover {
    background:var(--cinnabar); color:var(--card);
    border-color:var(--cinnabar);
  }
  /* Below the band the page used to be bare document flow: three blocks of
     unstyled body copy. These give it the same ruled rhythm the rest of the
     site has. */
  .hz-sec { margin:0; padding:26px 0; border-top:1px solid var(--line); }
  .hz-sec h2 {
    font-family:var(--serif); font-size:23px; font-weight:600; letter-spacing:-.012em;
    margin:0 0 11px; position:relative; padding-left:15px;
  }
  .hz-sec h2::before {
    content:""; position:absolute; left:0; top:.36em; bottom:.36em; width:3px;
    border-radius:0; background:var(--cinnabar);
  }
  .hz-sec p { font-size:14.5px; color:var(--ink-soft); max-width:640px; margin:0 0 13px; }
  .hz-sec p:last-child { margin-bottom:0; }
  .hz-sec .btn-ghost { margin-right:8px; }
  @media (max-width:620px) {
    .hz-plate { width:132px; height:132px; border-radius:2px; }
    .hz-hero { gap:16px; }
    .hz-py { font-size:17px; }
    .hz-def { font-size:15.5px; margin-bottom:14px; }
    .hz-src { padding:18px 18px; }
    .hz-src .quote { font-size:19px; }
    /* The band was 808px tall on a 844px viewport — the source card needed a
       scroll to reach. Tighten the frame and let the fact grid run three up
       rather than two, which also stops the buttons from stacking. */
    .page-head-hz { padding:18px 0 30px; }
    .hz-big { font-size:40px; }
    .hz-fact-grid { grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:15px; }
    .hz-fact { padding:9px 10px; }
    .hz-fact span { font-size:9.5px; letter-spacing:.07em; }
    .hz-fact b { font-size:13.5px; }
    .hz-fact i { font-size:11px; }
    .hz-cta { gap:8px; margin-bottom:11px; }
    .hz-cta .btn-sm { font-size:12.5px; padding:8px 13px; }
    /* The hint is the only explanation of what the two colours mean, so it
       stays on a phone — it just folds to a shorter line. */
    .hz-hint { font-size:11.5px; margin-top:2px; }
  }
  /* hanzi-writer draws an SVG at a fixed pixel size and only scales through
     its own viewBox, so a container that shrinks in a media query leaves the
     drawing hanging outside it (and the quiz hit-test lands in the wrong
     place). Force the SVG to fill whatever the plate is. */
  .hz-plate svg { width:100% !important; height:100% !important; display:block; }
  /* The plate sits in the page head. On paper the character is the whole
     point, so keep the head and drop the chrome around it. */
  @media print {
    .page-head-hz {
      display: block !important; background: var(--paper) !important;
      color: #111 !important; padding: 0 0 10px; overflow: visible;
    }
    .crumb, .hz-cta, .hz-hint { display: none !important; }
    .hz-big, .hz-py, .hz-def, .hz-fact b { color: #111 !important; }
    .hz-py { color: #a8342a !important; }
    .hz-fact {
      background: #fff !important; border-color: #ccc !important;
      box-shadow: none !important; backdrop-filter: none !important;
    }
    .hz-fact span, .hz-fact i { color: #666 !important; }
    .hz-plate { box-shadow: none !important; border-color: #ccc !important; }
  }
</style>
</head>
<body>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${href(code, '/')}">${MARK}<span class="brand-name">${BRAND}</span></a>
    <nav class="site-nav">
${navFor(code, t)}
    </nav>
    ${langSwitch(code, pathFor)}
  </div>
</header>

<section class="page-head page-head-hz">
  <div class="wrap">
    <nav class="crumb">
      <a href="${href(code, '/')}">${esc(crumbGen)}</a><span>/</span><a href="${href(code, '/characters/')}">${esc(crumbChars)}</a><span>/</span><span>${esc(ch)} ${esc(py)}</span>
    </nav>
    <div class="hz-hero">
      <div class="hz-plate" id="plate" aria-label="${esc(fmt(t['char.replay'], { ch: ch }))}"></div>
      <div class="hz-facts">
        <h1 class="hz-big">${esc(ch)}</h1>
        <p class="hz-py">${esc(py)} · ${strokes} ${esc(t['char.strokes'])}</p>
        <p class="hz-def">${esc(meaning)}</p>
        <div class="hz-fact-grid">
          <div class="hz-fact"><span>${esc(t['char.strokes'])}</span><b>${strokes}</b><i>${esc(t['freq.' + freqKey(rec)])}</i></div>
          <div class="hz-fact"><span>${esc(t['char.element'])}</span><b>${esc(t['el.' + elemKey(elem)])} ${esc(elem)}</b><i>${esc(ELEM_PR[elem] || '')}</i></div>
          <div class="hz-fact"><span>${esc(t['char.naming'])}</span><b>${esc(rec.g === 'n' ? t['char.unisex'] : rec.g === 'm' ? t['char.masculine'] : t['char.feminine'])}</b><i>${esc(t['gender.' + rec.g])}</i></div>
          <div class="hz-fact"><span>${esc(t['char.tone'])}</span><b>${rec.t ? esc(fmt(t['char.toneN'], { n: rec.t })) : '—'}</b><i>${esc(rec.t ? t['tone.' + toneHint(rec.t)] : '')}</i></div>
        </div>
        <div class="hz-cta">
          <button class="btn-ghost btn-sm" id="replay">${esc(t['char.replay'])}</button>
          <button class="btn-ghost btn-sm" id="practice">${esc(t['char.practice'])}</button>
          <button class="btn-ghost btn-sm" id="sheet">${esc(t['char.sheet'])}</button>
        </div>
        <p class="hz-hint">${esc(t['char.hint'])}</p>
      </div>
    </div>
  </div>
</section>

<main class="wrap hz-body">
  <div class="hz-src">
    <p class="cite">${esc(rec.book)}</p>
    <p class="quote">${esc(rec.line)}</p>
    <p class="en">${esc(lineLoc)}</p>
    <p class="west">${esc(west)}</p>
  </div>

  <div class="hz-note"><b>${esc(t['char.ina'])}</b> ${esc(note)}</div>

  <section class="hz-sec">
    <h2>${esc(fmt(t['char.usetitle'], { ch: ch }))}</h2>
    <p>${esc(fmt(t['char.usep'], { ch: ch }))}</p>
    <p>
      <a class="btn-ghost btn-sm" href="${href(code, '/')}" style="text-decoration:none">${esc(t['char.gencta'])}</a>
      <a class="btn-ghost btn-sm" href="${link(code, '/hanzi-to-pinyin/')}" style="text-decoration:none">${esc(t['char.pycta'])}</a>
    </p>
  </section>

  <section class="hz-sec">
    <h2>${esc(fmt(t['char.sibt'], { en: t['el.' + elemKey(elem)] }))}</h2>
    <p>${esc(fmt(t['char.sibp'], { cn: elem, en: t['el.' + elemKey(elem)] }))}</p>
    <div class="hz-sib">
      ${siblings.map(function (o) { return '<a href="' + href(code, '/character/' + encodeURIComponent(o) + '/') + '">' + esc(o) + '</a>'; }).join('\n      ')}
    </div>
  </section>

  <section class="hz-sec" style="margin-bottom:40px">
    <h2>${esc(t['char.faq'])}</h2>
    <div class="faq">
      <details>
        <summary>${esc(fmt(t['char.q1'], { ch: ch }))}</summary>
        <p>${esc(fmt(t['char.a1'], { n: strokes, freq: t['freq.' + freqKey(rec)] }))}</p>
      </details>
      <details>
        <summary>${esc(fmt(t['char.q2'], { ch: ch }))}</summary>
        <p>${fmt(esc(t['char.a2']), {
      py: esc(py),
      tone: esc(rec.t ? ', ' + t['tone.' + toneHint(rec.t)] : ''),
      link: '<a href="' + link(code, '/hanzi-to-pinyin/') + '">' + esc(t['char.a2link']) + '</a>'
    })}</p>
      </details>
      <details>
        <summary>${esc(fmt(t['char.q3'], { ch: ch }))}</summary>
        <p>${esc(fmt(t['char.a3'], { note: note, meaning: meaning }))}</p>
      </details>
      <details>
        <summary>${esc(t['char.q4'])}</summary>
        <p>${esc(fmt(t['char.a4'], { book: rec.book, line: rec.line, lineEn: lineLoc }))}</p>
      </details>
    </div>
  </section>
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="foot-col">
      <h5>${esc(t['foot.tools'])}</h5>
${footTools(code, t)}
    </div>
    <div class="foot-legal">
      <div class="brand">${MARK}<span class="brand-name">${BRAND}</span></div>
      <p>${esc(t['foot.strokelicense'])} © <span id="yr">2026</span> ${BRAND} · <a href="${ORIGIN}/">${ORIGIN_HOST}</a></p>
    </div>
  </div>
</footer>

<script src="/assets/lib/hanzi-writer.min.js"></script>
<script>
(function () {
  var CH = ${JSON.stringify(ch)};
  var PY = ${JSON.stringify(py)};
  /* Print-window strings come from the locale file, injected as JSON so the
     inline script never carries an English sentence on a Portuguese page. */
  var T = ${JSON.stringify({
    practisetitle: t['char.practisetitle'],
    practiseh1: t['char.practiseh1'],
    practisesub: t['char.practisesub'],
    perfect: t['char.perfect'],
    donecorr: t['char.donecorr'],
    host: ORIGIN_HOST
  })};
  /* Both are library constants, but the print window is built from strings, so
     they are escaped before insertion like any other value. */
  var CH_HTML = CH.replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
  var PY_HTML = PY.replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
  var plate = document.getElementById('plate');
  if (!plate) return;

  var writer = null;
  if (window.HanziWriter) {
    /* The drawing is sized from the plate rather than from a constant, so the
       animation and the quiz hit-area always match the box the visitor sees —
       including after the plate shrinks in a media query. */
    var side = plate.clientWidth || 200;
    writer = window.HanziWriter.create(plate, CH, {
      width: side, height: side, padding: Math.round(side * 0.04),
      strokeColor: '#17241f',
      radicalColor: '#b23a2a',
      showOutline: true,
      outlineColor: '#bccfc2',
      strokeAnimationSpeed: 1.1,
      delayBetweenStrokes: 120,
      charDataLoader: function (c, onComplete, onError) {
        /* Shipped with the site — no third-party request at runtime. */
        fetch('/assets/hanzi-data/' + encodeURIComponent(c) + '.json')
          .then(function (r) { if (!r.ok) throw new Error('404'); return r.json(); })
          .then(onComplete)
          .catch(onError);
      }
    });
  } else {
    plate.style.display = 'grid';
    plate.style.placeItems = 'center';
    plate.style.fontFamily = 'var(--serif)';
    plate.style.fontSize = '120px';
    plate.textContent = CH;
  }

  function play() { if (writer) writer.animateCharacter(); }

  document.getElementById('replay').addEventListener('click', play);

  /* If the window is resized across the breakpoint the plate changes size;
     keep the writer in step so the quiz stays aligned with the grid. */
  var lastSide = plate.clientWidth;
  window.addEventListener('resize', function () {
    var now = plate.clientWidth;
    if (writer && now && Math.abs(now - lastSide) > 8) {
      lastSide = now;
      writer.cancelQuiz && writer.cancelQuiz();
      writer.updateDimensions({ width: now, height: now, padding: Math.round(now * 0.04) });
    }
  });
  document.getElementById('practice').addEventListener('click', function () {
    if (!writer) return;
    writer.quiz({
      onMistake: function () { /* correction is the lesson */ },
      onComplete: function (s) {
        document.getElementById('practice').textContent =
          s.totalMistakes === 0 ? T.perfect : T.donecorr.replace('{n}', s.totalMistakes);
      }
    });
  });
  document.getElementById('sheet').addEventListener('click', function () {
    var w = window.open('', '_blank');
    if (!w) return;
    var cells = '';
    for (var i = 0; i < 8; i++) {
      cells += '<div class="c">' + (i === 0
        ? '<span class="t" style="color:#a3bbaa">' + CH_HTML + '</span>'
        : i === 1 ? '<span class="t" style="color:#bccfc2;opacity:.55">' + CH_HTML + '</span>' : '') + '</div>';
    }
    w.document.write('<!DOCTYPE html><html lang="' + ${JSON.stringify(lang.htmlLang)} + '"><head><meta charset="utf-8"><title>' + T.practisetitle.replace('{ch}', CH_HTML) + '</title>' +
      '<style>@page{margin:14mm}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'body{font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#17241f;margin:0}' +
      'h1{font-size:16px;margin:0 0 2px}' +
      'p.sub{font-size:11px;color:#52645b;margin:0 0 16px}' +
      '.row{display:flex;gap:8px;align-items:center;margin-bottom:14px}' +
      '.lbl{width:70px;flex:none;text-align:center}.lbl b{display:block;font-size:28px;font-family:serif}' +
      '.lbl i{font-size:11px;color:#b23a2a;font-style:normal}' +
      '.c{width:66px;height:66px;border:1px solid #a3bbaa;position:relative;flex:none;' +
      'background-image:' +
      'linear-gradient(to right,#bccfc2 1px,transparent 1px),' +
      'linear-gradient(to bottom,#bccfc2 1px,transparent 1px),' +
      'linear-gradient(to bottom right,transparent calc(50% - .5px),#bccfc2 calc(50% - .5px),#bccfc2 calc(50% + .5px),transparent calc(50% + .5px)),' +
      'linear-gradient(to bottom left,transparent calc(50% - .5px),#bccfc2 calc(50% - .5px),#bccfc2 calc(50% + .5px),transparent calc(50% + .5px));' +
      'background-size:50% 100%,100% 50%,100% 100%,100% 100%}' +
      '.t{position:absolute;inset:0;display:grid;place-items:center;font-size:48px;font-family:serif}' +
      'footer{margin-top:14px;font-size:10px;color:#52645b;border-top:1px solid #bccfc2;padding-top:6px}' +
      '</style></head><body><h1>' + T.practiseh1 + '</h1>' +
      '<p class="sub">' + T.practisesub + '</p>' +
      '<div class="row"><div class="lbl"><b>' + CH_HTML + '</b><i>' + PY_HTML + '</i></div>' + cells + '</div>' +
      '<footer>' + T.practisesub + '</footer></body></html>');
    w.document.close();
    setTimeout(function () { w.print(); }, 350);
  });

  setTimeout(play, 420);
})();
</script>
<script src="${u('/assets/js/app-foot.js')}"></script>
<script src="${u('/assets/js/lang-hint.js')}" defer></script>
</body>
</html>
`;
}

function toneHint(t) {
  const k = ['', 'high', 'rising', 'dipping', 'falling'][t];
  return k || '';
}

/* ---- write every page ---- */
let written = 0;
const skipped = [];

SHIPPED.forEach(function (code) {
  CHARS.forEach(function (ch) {
    if (!HANZI_RE.test(ch)) { skipped.push(ch); return; }
    /* English stays at the root; every other locale carries its own prefix. */
    const dir = path.join(ROOT, getLang(code).prefix, 'character', ch);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), page(ch, code), 'utf8');
    written++;
  });
});
if (skipped.length) console.log('skipped non-hanzi keys:', skipped.join(' '));

/* three-letter / pinyin landing pages are out of scope here; the index below
   is what search engines and humans use to reach the individual pages. */
function indexHtml(code) {
  const L = i18nLoad(code);
  const t = L.ui;
  const gl = L.chars || {};
  const lang = getLang(code);
  const selfPath = '/characters/';
  const pathFor = function () { return selfPath; };
  const meaningOf = function (ch) { return (gl[ch] && gl[ch].m) || REC[ch].m; };
  const libnote = t['chars.desc'] || t['chars.sub'];

  return `<!DOCTYPE html>
<html lang="${lang.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t['chars.title'])}</title>
<meta name="description" content="${esc(t['chars.desc'])}">
<link rel="canonical" href="${canonical(code, selfPath)}">
${hreflang(pathFor)}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t['chars.title'])}">
<meta property="og:description" content="${esc(t['chars.desc'])}">
<meta property="og:url" content="${canonical(code, selfPath)}">
<meta property="og:locale" content="${lang.ogLocale}">
${OG.tags('characters-' + code, ORIGIN, esc(t['chars.desc']))}
<script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t['chars.eyebrow'],
    url: canonical(code, selfPath),
    description: t['chars.desc'],
    hasPart: CHARS.map(function (ch) {
      return {
        '@type': 'DefinedTerm',
        name: ch,
        url: canonical(code, '/character/' + encodeURIComponent(ch) + '/')
      };
    })
  }, null, 2)}
</script>
<link rel="stylesheet" href="${u('/assets/css/main.css')}">
${ICON}
<style>
  .ch-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; margin:0 0 40px; }
  /* The index opens on one white sheet, the same surface as the generator's
     form card. The old -46px bite belonged to a dark hero band; with the band
     gone it would pull the sheet over the page heading. */
  .ch-sheet {
    position:relative; z-index:1; margin-top:30px;
    background:var(--card);
    border:1px solid var(--line); border-radius:var(--radius);
    box-shadow: var(--shadow-sm);
    padding:24px 22px 18px;
  }
  /* The card's own background carries four layers: the small practice plate in
     the top-right corner, the ink wash behind it, then the paper. They all live
     on the card because a pseudo-element at z-index:-1 would slide underneath
     the card's background and disappear. */
  .ch-card {
    position:relative; overflow:hidden;
    border:1px solid var(--line);
    border-radius:12px; padding:14px 15px; text-decoration:none; color:inherit; display:block;
    transition:border-color .18s, box-shadow .18s;
    background:var(--card);
  }
  .ch-card:hover { border-color:rgba(178,58,42,.38); box-shadow:var(--shadow-md); }
  .ch-card .c {
    font-family:var(--serif); font-size:38px; line-height:1.06; display:block;
    color:var(--ink);
    transition:color .18s;
  }
  .ch-card .p { font-size:12px; color:var(--cinnabar); display:block; margin:3px 0 5px; font-weight:600; letter-spacing:.03em; }
  .ch-card .m { font-size:11.5px; color:var(--ink-soft); line-height:1.4; display:block; }
  .ch-card .s { font-size:10.5px; color:var(--ink-mute); margin-top:6px; display:block; padding-top:6px; border-top:1px solid var(--line); }
  .lib-note {
    font-size:12.5px; color:var(--ink-mute); margin:0 0 18px;
    display:flex; align-items:center; gap:9px; flex-wrap:wrap;
  }
  .lib-note::after {
    content:""; flex:1; min-width:40px; height:1px; background:var(--line);
  }
  /* Five sections instead of one 120-card wall. The element character leads
     each heading, so the page reads as a sequence rather than a dump. */
  .ch-sec { margin-bottom:26px; }
  .ch-sec:last-child { margin-bottom:0; }
  /* A rule under the heading, so a 3-screen-long section still announces
     itself when its top has scrolled away. */
  .ch-h {
    display:flex; align-items:center; gap:10px; margin:0 0 12px; padding-bottom:10px;
    border-bottom:1px solid var(--line);
    font-family:var(--sans); font-size:13px; font-weight:700;
    letter-spacing:.13em; text-transform:uppercase; color:var(--ink-soft);
  }
  /* The section glyph is a mini 朱文印, matching the home page's sample seals
     and the feature icons — the same object at a third the size, so the page
     keeps one vocabulary instead of a different chip per component. */
  .ch-h-glyph {
    width:30px; height:30px; flex:none; display:grid; place-items:center;
    font-family:var(--serif); font-size:16px; letter-spacing:0; text-transform:none;
    color:var(--cinnabar); background:transparent;
    border:1px solid var(--cinnabar); border-radius:2px;
  }
  .ch-h-n {
    margin-left:auto; font-family:var(--mono); font-size:11.5px; font-weight:400;
    letter-spacing:.04em; color:var(--ink-mute);
    border:1px solid var(--line-2); border-radius:2px; padding:1px 9px;
  }
  @media (max-width:820px) {
    .ch-sheet { padding:20px 16px 16px; }
    /* 140px needs 289px of inner width — a 375px phone has 288 and drops to a
       single column, which turns the page into 22 screens of scrolling. */
    .ch-grid { grid-template-columns:repeat(auto-fill,minmax(124px,1fr)); gap:9px; }
    .ch-sec { margin-bottom:22px; }
    .ch-h { font-size:12px; letter-spacing:.1em; margin-bottom:10px; padding-bottom:8px; }
  }
</style>
</head>
<body>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${href(code, '/')}">${MARK}<span class="brand-name">${BRAND}</span></a>
    <nav class="site-nav">
${navFor(code, t)}
    </nav>
    ${langSwitch(code, pathFor)}
  </div>
</header>

<section class="page-head">
  <div class="wrap">
    <div class="eyebrow">${esc(t['chars.eyebrow'])}</div>
    <h1 class="hero-title">${esc(t['chars.h1a'])} <span class="accent">${esc(t['chars.h1b'])}</span></h1>
    <p class="hero-sub">
      ${esc(fmt(t['chars.sub'], { n: CHARS.length }))}
    </p>
  </div>
</section>

<main class="wrap" style="padding-top:0">
  <div class="ch-sheet">
    <p class="lib-note">${esc(fmt(libnote, { n: CHARS.length }))}</p>
    ${GROUPS.map(function (g) {
      return '    <section class="ch-sec">' +
        '<h2 class="ch-h"><span class="ch-h-glyph">' + esc(g.elem) + '</span>' +
        esc(t['el.' + g.en]) + '<span class="ch-h-n">' + g.chars.length + '</span></h2>' +
        '<div class="ch-grid">' + g.chars.map(function (ch) {
          const r = REC[ch];
          return '<a class="ch-card" href="' + href(code, '/character/' + encodeURIComponent(ch) + '/') + '">' +
            '<span class="c">' + esc(ch) + '</span>' +
            '<span class="p">' + esc(r.p) + '</span>' +
            '<span class="m">' + esc(meaningOf(ch)) + '</span>' +
            '<span class="s">' + esc(fmt(t['chars.cardstrokes'], { n: r.s, elem: r.wx, en: t['el.' + g.en] })) + '</span></a>';
        }).join('') + '</div></section>';
    }).join('\n')}
  </div>
</main>
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-col">
      <h5>${esc(t['foot.tools'])}</h5>
${footTools(code, t)}
    </div>
    <div class="foot-legal">
      <div class="brand">${MARK}<span class="brand-name">${BRAND}</span></div>
      <p>${esc(t['foot.strokelicense'])} © <span id="yr">2026</span> ${BRAND} · <a href="${ORIGIN}/">${ORIGIN_HOST}</a></p>
    </div>
  </div>
</footer>
<script src="${u('/assets/js/app-foot.js')}"></script>
<script src="${u('/assets/js/lang-hint.js')}" defer></script>
</body>
</html>
`;
}

SHIPPED.forEach(function (code) {
  const dir = path.join(ROOT, getLang(code).prefix, 'characters');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), indexHtml(code), 'utf8');
});

console.log('wrote ' + written + ' character pages + ' + SHIPPED.length +
  ' indexes across [' + SHIPPED.join(', ') + '] (' + CHARS.length + ' characters, ' +
  SURNAMES.length + ' surnames)');
