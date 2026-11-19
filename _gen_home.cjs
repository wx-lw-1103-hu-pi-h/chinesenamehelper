/**
 * Landing page for every shipped locale.
 *
 * The English root used to be a hand-written file with /pt/ and /ko/ having no
 * counterpart at all. Three hand-written home pages drift — one gets a fix, the
 * other two keep the bug — so the page is built from ui/<code>.cjs here and the
 * root index.html is just another output of the same template.
 *
 * Run after _gen_chars.cjs: it reads the same data files for the character and
 * surname counts shown in the form footer.
 */
const fs = require('fs');
const path = require('path');
const { u } = require('./_assets.cjs');
/* 必须写全 index.cjs：Node 的目录解析只认 index.js / index.json / index.node。 */
const i18n = require('./_i18n/index.cjs');
const {
  ORIGIN, BRAND, SHIPPED, getLang, load, fmt, href, link, hreflang, canonical, langSwitch,
  isTranslated
} = i18n;
/* The nav is shared so every generated page agrees on it; see _nav.cjs for why
   the EN treatment has to be in one place rather than per generator. */
const { navFor, footTools } = require('./_nav.cjs');
const OG = require('./_og.cjs');

const ROOT = path.join(__dirname, 'site');
const DATA = path.join(ROOT, 'assets', 'data');
const ORIGIN_HOST = ORIGIN.replace(/^https?:\/\//, '');
const g = globalThis;

function loadData(file, key) {
  const src = fs.readFileSync(path.join(DATA, file), 'utf8');
  const fn = new Function('window', src + '\nreturn window.' + key + ';');
  return fn(g);
}

const ALL = [].concat(loadData('characters.js', 'HANZI'), loadData('characters2.js', 'HANZI2'));
const SURNAMES = loadData('characters.js', 'SURNAMES');
const REC = {};
ALL.forEach(function (c) { if (c && c.c && !REC[c.c]) REC[c.c] = c; });
const CHAR_COUNT = Object.keys(REC).length;

const MARK = `<img class="brand-mark" src="${u('/assets/img/mark.svg')}" width="34" height="34" alt="" aria-hidden="true">`;
const ICON = '<link rel="icon" href="/favicon.svg?v=7da5aa03" type="image/svg+xml">';

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Translate, then turn the {bold}/{em} markers into real tags. The escape has to
   happen first: doing it after would strip the tags we just inserted. */
function rich(str, vars) {
  return fmt(esc(str), vars)
    .replace(/\{bold\}/g, '<b>').replace(/\{\/bold\}/g, '</b>')
    .replace(/\{em\}/g, '<em>').replace(/\{\/em\}/g, '</em>');
}

/* Same strings with every marker dropped — for JSON-LD, where a literal tag
   would be invalid data rather than emphasis. */
function plain(str, vars) {
  return fmt(str, vars).replace(/\{\/?\w+\}/g, '');
}

function faqItems(t) {
  const out = [];
  for (let i = 1; i <= 7; i++) {
    const q = t['homefaq.q' + i];
    const a = t['homefaq.a' + i];
    if (!q || !a) continue;
    /* a2 carries a second paragraph, which the page renders as its own <p>. */
    const a2b = i === 2 ? t['homefaq.a2b'] : '';
    out.push({ q: q, a: a, a2b: a2b });
  }
  return out;
}

function page(code) {
  const L = load(code);
  const t = L.ui;
  const lang = getLang(code);
  const pathFor = function () { return '/'; };
  const selfPath = '/';
  const faqs = faqItems(t);
  const libnote = fmt(t['form.libnote'], { n: CHAR_COUNT, s: SURNAMES.length });

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': canonical(code, '/') + '#app',
        name: BRAND + ' — ' + t['home.eyebrow'],
        url: canonical(code, '/'),
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        inLanguage: lang.htmlLang,
        description: plain(t['home.desc']),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          t['how.f1t'], t['how.f2t'], t['how.f3t'], t['how.f4t']
        ]
      },
      {
        '@type': 'FAQPage',
        '@id': canonical(code, '/') + '#faq',
        inLanguage: lang.htmlLang,
        mainEntity: faqs.map(function (f) {
          return {
            '@type': 'Question',
            name: plain(f.q),
            acceptedAnswer: { '@type': 'Answer', text: plain(f.a) + (f.a2b ? ' ' + plain(f.a2b) : '') }
          };
        })
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t['home.eyebrow'], item: canonical(code, '/') }
        ]
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="${lang.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t['home.title'])}</title>
<meta name="description" content="${esc(t['home.desc'])}">
<link rel="canonical" href="${canonical(code, selfPath)}">
${hreflang(pathFor)}
<meta name="robots" content="index,follow,max-image-preview:large">

<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t['home.ogtitle'])}">
<meta property="og:description" content="${esc(t['home.ogdesc'])}">
<meta property="og:url" content="${canonical(code, selfPath)}">
<meta property="og:site_name" content="${esc(BRAND)}">
<meta property="og:locale" content="${lang.ogLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t['home.ogtitle'])}">
<meta name="twitter:description" content="${esc(t['home.ogdesc'])}">
${OG.tags('home-' + code, ORIGIN, esc(t['home.ogdesc']))}

${ICON}
<link rel="stylesheet" href="${u('/assets/css/main.css')}">

<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>
<body>

<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${href(code, '/')}">${MARK}<span class="brand-name">${esc(BRAND)}</span></a>
    <nav class="site-nav">
${navFor(code, t)}
    </nav>
    ${langSwitch(code, pathFor)}
  </div>
</header>

<main>
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-lede">
        <div class="eyebrow">${esc(t['home.eyebrow'])}</div>
        <h1 class="hero-title">${esc(t['home.h1a'])} <span class="accent">${esc(t['home.h1b'])}</span></h1>
        <p class="hero-sub">${esc(t['home.sub'])}</p>
        <p class="hero-note">${rich(t['home.note'])}</p>
      </div>
      <div class="hero-show" aria-hidden="true">
        <span class="hs"><i>míng</i><b>名</b></span>
        <span class="hs"><i>lán</i><b>澜</b></span>
        <span class="hs"><i>xī</i><b>曦</b></span>
        <span class="hs"><i>zhé</i><b>哲</b></span>
        <span class="hs"><i>wēi</i><b>薇</b></span>
      </div>
    </div>
  </section>

  <div class="wrap" id="generator">
    <form class="form-card" id="name-form" autocomplete="off">
      <div class="field-row">
        <div class="field">
          <label for="surname">${esc(t['form.surname'])} <small>${esc(t['form.optional'])}</small></label>
          <select id="surname" name="surname">
            <option value="">${esc(t['form.nosurname'])}</option>
          </select>
        </div>
        <div class="field">
          <label for="gender">${esc(t['form.gender'])}</label>
          <select id="gender" name="gender">
            <option value="neutral">${esc(t['form.neutral'])}</option>
            <option value="male">${esc(t['form.male'])}</option>
            <option value="female">${esc(t['form.female'])}</option>
          </select>
        </div>
      </div>

      <!-- The date row lives on its own line. Inside a third of the card the
           month and day boxes were clipping their placeholders down to "mc"
           and "da"; one full row fixes it without shrinking the type. -->
      <div class="field" style="margin-top:14px">
        <label for="birth">${esc(t['form.birth'])} <small>${esc(t['form.optional'])}</small></label>
        <div class="date-row">
          <input type="number" id="birth" name="birth" placeholder="1994" min="1900" max="2099" aria-label="${esc(t['form.year'])}">
          <input type="number" id="bm" name="bm" placeholder="${esc(t['form.month'])}" min="1" max="12" aria-label="${esc(t['form.month'])}">
          <input type="number" id="bd" name="bd" placeholder="${esc(t['form.day'])}" min="1" max="31" aria-label="${esc(t['form.day'])}">
        </div>
      </div>

      <div class="field" style="margin-top:14px">
        <label for="desc">${esc(t['form.about'])} <small>${esc(t['form.optional'])}</small></label>
        <textarea id="desc" name="desc" maxlength="240" rows="3" placeholder="${esc(t['form.descph'])}"></textarea>
        <p class="field-hint">${esc(t['form.abouthint'])}</p>
      </div>

      <button class="btn" type="submit" id="go">${esc(t['form.submit'])}</button>

      <div class="form-foot">
        <span class="privacy">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 7V5a4 4 0 118 0v2M3 7h10v7H3z" stroke="#5f7269" stroke-width="1.4" stroke-linecap="round"/></svg>
          ${esc(t['form.privacy'])}
        </span>
        <span class="dots"><i></i><i></i><i></i></span>
        <span id="lib-note">${esc(libnote)}</span>
      </div>
    </form>

    <section class="results" id="results" hidden aria-live="polite">
      <div class="results-head">
        <div>
          <h2 id="results-title">${esc(t['res.names'])}</h2>
          <p id="results-sub"></p>
        </div>
        <div class="results-actions">
          <button class="btn-ghost btn-sm" type="button" id="regen">${esc(t['res.regen'])}</button>
          <button class="btn-ghost btn-sm" type="button" id="print">${esc(t['res.print'])}</button>
          <button class="btn-ghost btn-sm" type="button" id="share">${esc(t['res.share'])}</button>
        </div>
      </div>
      <div class="chart-strip" id="chart-strip" hidden></div>
      <div id="cards"></div>
    </section>

    <div class="results" id="empty" hidden>
      <div class="empty-state">
        <div class="big">${esc(t['res.emptyhint'])}</div>
        <p>${esc(t['res.empty'])}</p>
      </div>
    </div>
  </div>

  <section class="section" id="how">
    <div class="wrap">
      <h2>${esc(t['how.h2'])}</h2>
      <p class="lede">${esc(t['how.lede'])}</p>
      <div class="feat-grid feat-grid-home">
        <div class="feat" data-n="一">
          <div class="ico" data-n="一">历</div>
          <h3>${esc(t['how.f1t'])}</h3>
          <p>${esc(t['how.f1p'])}</p>
        </div>
        <div class="feat" data-n="二">
          <div class="ico" data-n="二">意</div>
          <h3>${esc(t['how.f2t'])}</h3>
          <p>${esc(t['how.f2p'])}</p>
        </div>
        <div class="feat" data-n="三">
          <div class="ico" data-n="三">典</div>
          <h3>${esc(t['how.f3t'])}</h3>
          <p>${esc(t['how.f3p'])}</p>
        </div>
        <div class="feat" data-n="四">
          <div class="ico" data-n="四">书</div>
          <h3>${esc(t['how.f4t'])}</h3>
          <p>${esc(t['how.f4p'])}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap wrap-narrow">
      <h2>${esc(t['homefaq.h2'])}</h2>
      <div class="faq">
${faqs.map(function (f) {
    return '        <details>\n' +
      '          <summary>' + esc(f.q) + '</summary>\n' +
      '          <p>' + rich(f.a) + '</p>\n' +
      (f.a2b ? '          <p>' + esc(f.a2b) + '</p>\n' : '') +
      '        </details>';
  }).join('\n')}
      </div>
    </div>
  </section>
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="foot-col">
      <h5>${esc(t['foot.tools'])}</h5>
${footTools(code, t)}
    </div>
    <div class="foot-col">
      <h5>${esc(t['foot.learn'])}</h5>
      <a href="#how">${esc(t['foot.how'])}</a>
      <a href="#generator">${esc(t['foot.generate'])}</a>
    </div>
    <div class="foot-legal">
      <div class="brand">${MARK}<span class="brand-name">${esc(BRAND)}</span></div>
      <p>${esc(t['foot.legal'])}</p>
      <p>© <span id="yr">2026</span> ${esc(BRAND)} · <a href="${ORIGIN}/">${ORIGIN_HOST}</a></p>
    </div>
  </div>
</footer>

<div class="toast" id="toast" role="status"></div>

<script src="/assets/lib/lunar.js"></script>
<script src="${u('/assets/data/characters.js')}"></script>
<script src="${u('/assets/data/characters2.js')}"></script>
<script src="${u('/assets/js/engine.js')}"></script>
<script src="/assets/lib/hanzi-writer.min.js" defer></script>
<script src="${u('/assets/js/signature.js')}"></script>
<!-- Runtime strings for this locale: the cards, the chart strip and every toast
     are built in app.js after a click, so they cannot be baked into the HTML. -->
<script src="/assets/i18n/${code}.js"></script>
<script src="${u('/assets/js/app.js')}"></script>
<!-- A hint only: it reads the browser language and offers a link, never
     redirects. See lang-hint.js for why a redirect would cost the translations
     their indexing. -->
<script src="${u('/assets/js/lang-hint.js')}" defer></script>
</body>
</html>
`;
}

let written = 0;
SHIPPED.forEach(function (code) {
  const dir = path.join(ROOT, getLang(code).prefix);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(code), 'utf8');
  written++;
});

console.log('wrote ' + written + ' home pages across [' + SHIPPED.join(', ') + '] (' +
  CHAR_COUNT + ' characters, ' + SURNAMES.length + ' surnames)');
