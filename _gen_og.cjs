/* Social cards for og:image / twitter:image.
 *
 * Why this exists: every page already emits `twitter:card=summary_large_image`
 * and `max-image-preview:large`, but no page emitted an image URL at all. A
 * link shared into Discord, WhatsApp or Slack therefore rendered as a bare line
 * of text — the card design in signature.js and downloadNameCard() only ever
 * reaches someone who is already on the site. This closes that gap.
 *
 * Why headless Chrome rather than a drawing library: the card has to render
 * Chinese. Rasterising glyphs through a canvas library means bundling a CJK
 * font, and generating the image with a model produces melted characters. The
 * site is already HTML+CSS, so the card is written as HTML using the same
 * tokens as main.css, then photographed at a fixed viewport. What ships is a
 * PNG of the real design, with real glyphs from the system serif.
 *
 *   node _gen_og.cjs          -> hub pages + character cards
 *   node _gen_og.cjs hubs     -> home / index / gifts / tools only
 *   node _gen_og.cjs chars    -> the 120 language-neutral character cards
 *   node _gen_og.cjs one      -> a single probe card, for checking the design
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const OUT = path.join(SITE, 'assets', 'og');
const TMP = path.join(os.tmpdir(), 'cnh-og');

const W = 1200;
const H = 630;

/* ---------- chrome ---------- */

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

const CHROME = findChrome();
if (!CHROME) {
  console.error('No Chrome or Edge found. Set CHROME_PATH to a Chromium binary.');
  process.exit(1);
}

/* ---------- shared card shell ---------- */

const FONT_SERIF = "Georgia, 'Times New Roman', 'Songti SC', 'Source Han Serif SC', 'Noto Serif SC', SimSun, serif";
const FONT_SANS = "'Segoe UI', -apple-system, 'Helvetica Neue', Arial, 'Microsoft YaHei', sans-serif";

/* The tokens are copied from main.css rather than imported, because the card
   is rendered from a temp file outside the site tree and a relative stylesheet
   link would not resolve. Keep the two in step if the palette changes. */
const INK = '#17241f';
const INK_SOFT = '#3c4d46';
const INK_MUTE = '#52645b';
const PAPER = '#e0eae2';
const LINE = '#bccfc2';
const CINNABAR = '#b23a2a';

function shell(inner) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'html,body{width:' + W + 'px;height:' + H + 'px;overflow:hidden}' +
    'body{background:' + PAPER + ';color:' + INK + ';font-family:' + FONT_SANS +
      ';-webkit-font-smoothing:antialiased}' +
    '.card{position:relative;width:' + W + 'px;height:' + H + 'px;padding:64px 72px;' +
      'display:flex;flex-direction:column}' +
    /* A single hairline inset from the edge reads as a frame; a border on the
       element itself would sit flush against the screenshot edge. */
    '.card:after{content:"";position:absolute;left:34px;right:34px;top:34px;bottom:34px;' +
      'border:1px solid ' + LINE + ';border-radius:14px;pointer-events:none}' +
    '.top{display:flex;align-items:center;gap:14px}' +
    '.mark{width:46px;height:46px;display:grid;place-items:center;flex:none}' +
    '.mark svg{width:46px;height:46px}' +
    '.brand{font-size:23px;font-weight:600;letter-spacing:-.01em}' +
    '.eyebrow{margin-top:44px;font-size:16px;font-weight:700;letter-spacing:.2em;' +
      'text-transform:uppercase;color:' + INK_MUTE + ';display:flex;align-items:center;gap:14px}' +
    '.eyebrow:before{content:"";width:34px;height:2px;background:' + CINNABAR + ';opacity:.75}' +
    'h1{margin-top:18px;font-family:' + FONT_SERIF + ';font-weight:600;color:' + INK + ';' +
      'letter-spacing:-.018em;line-height:1.1}' +
    'h1 .accent{color:' + CINNABAR + '}' +
    '.sub{margin-top:18px;font-size:24px;line-height:1.5;color:' + INK_SOFT + ';max-width:940px}' +
    '.chips{margin-top:auto;display:flex;gap:16px;align-items:flex-end}' +
    '.chip{background:#fff;border:1px solid ' + LINE + ';border-radius:12px;' +
      'padding:12px 18px 10px;text-align:center}' +
    '.chip i{display:block;font-family:' + FONT_SERIF + ';font-style:normal;font-size:14px;' +
      'color:' + CINNABAR + ';letter-spacing:.04em;margin-bottom:4px}' +
    '.chip b{display:block;font-family:' + FONT_SERIF + ';font-size:40px;font-weight:600;' +
      'line-height:1;color:' + INK + '}' +
    '.foot{margin-top:26px;padding-top:20px;border-top:1px solid ' + LINE + ';' +
      'display:flex;align-items:center;justify-content:space-between;' +
      'font-size:17px;color:' + INK_MUTE + '}' +
    '.foot b{color:' + INK_SOFT + ';font-weight:600}' +
    /* character card */
    '.charwrap{margin-top:auto;margin-bottom:auto;display:flex;align-items:center;gap:64px}' +
    '.glyph{font-family:' + FONT_SERIF + ';font-size:300px;line-height:.9;color:' + INK + ';' +
      'font-weight:600}' +
    '.charmeta .py{font-family:' + FONT_SERIF + ';font-size:64px;color:' + CINNABAR + ';' +
      'letter-spacing:.04em;line-height:1}' +
    '.charmeta .st{margin-top:22px;font-size:26px;color:' + INK_SOFT + ';font-family:' + FONT_SERIF + '}' +
    '.charmeta .rule{margin-top:26px;width:110px;height:2px;background:' + CINNABAR + ';opacity:.55}' +
    '</style></head><body><div class="card">' + inner + '</div></body></html>';
}

function markSvg() {
  /* The card used to knock the glyph out of a cinnabar tile, matching what the
     header did. The header no longer has a tile — its mark is a bordered seal —
     so the card doesn't either: the mark is drawn in cinnabar on the same paper
     the card itself is printed on, which is also why there is no fill override
     here any more. */
  const file = path.join(SITE, 'assets', 'img', 'mark.svg');
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8');
}

function topBar() {
  return '<div class="top"><div class="mark">' + markSvg() + '</div>' +
    '<div class="brand">Chinese Name Helper</div></div>';
}

/* ---------- hub cards ---------- */

function hubCard(o) {
  const chips = (o.chips || []).map(function (c) {
    return '<div class="chip"><i>' + c.py + '</i><b>' + c.ch + '</b></div>';
  }).join('');
  return shell(
    topBar() +
    '<div class="eyebrow">' + o.eyebrow + '</div>' +
    '<h1 style="font-size:' + (o.h1size || 82) + 'px">' + o.h1 + '</h1>' +
    (o.sub ? '<p class="sub">' + o.sub + '</p>' : '') +
    (chips ? '<div class="chips">' + chips + '</div>' : '') +
    '<div class="foot"><span>' + o.foot + '</span><b>chinesenamehelper.com</b></div>'
  );
}

function charCard(rec) {
  return shell(
    topBar() +
    '<div class="charwrap">' +
      '<div class="glyph">' + rec.c + '</div>' +
      '<div class="charmeta">' +
        '<div class="py">' + rec.p + '</div>' +
        '<div class="st">' + rec.s + ' 画</div>' +
        '<div class="rule"></div>' +
      '</div>' +
    '</div>' +
    '<div class="foot"><span>Chinese character · meaning, stroke order and classical source</span>' +
      '<b>chinesenamehelper.com</b></div>'
  );
}

/* ---------- shoot ---------- */

function shoot(name, html) {
  fs.mkdirSync(TMP, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const htmlFile = path.join(TMP, name + '.html');
  const pngFile = path.join(OUT, name + '.png');
  fs.writeFileSync(htmlFile, html, 'utf8');
  try {
    execFileSync(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--disable-extensions',
      '--force-device-scale-factor=1',
      '--window-size=' + W + ',' + H,
      /* Give the renderer time to lay out and rasterise the glyphs before the
         screenshot is taken; without it the first paint can be blank. */
      '--virtual-time-budget=1500',
      '--screenshot=' + pngFile,
      'file:///' + htmlFile.replace(/\\/g, '/')
    ], { stdio: 'pipe' });
  } catch (e) {
    return { ok: false, err: (e.stderr || '').toString().slice(0, 300) || e.message };
  }
  if (!fs.existsSync(pngFile)) return { ok: false, err: 'no output file' };
  return { ok: true, bytes: fs.statSync(pngFile).size };
}

/* ---------- job list ---------- */

const LOCALES = require('./_i18n/index.cjs').LOCALES;
const SHIPPED = require('./_i18n/index.cjs').SHIPPED;

/* Sample glyphs for the home card. Chosen for a spread of tones and shapes:
   a flat high tone, a rising tone, a dipping tone, a light tone and a
   first-tone with the difficult x initial. */
const SAMPLES = [
  { ch: '明', py: 'míng' },
  { ch: '澜', py: 'lán' },
  { ch: '曦', py: 'xī' },
  { ch: '哲', py: 'zhé' },
  { ch: '薇', py: 'wēi' }
];

/* Per-locale copy for the home card. Only the four shipped locales need it. */
const HOME_COPY = {
  en: { eyebrow: 'Chinese name generator', a: "What's your name ", b: 'in Chinese?' },
  ja: { eyebrow: '中国名ジェネレーター', a: 'あなたの名前を', b: '中国語に' },
  pt: { eyebrow: 'Gerador de nomes chineses', a: 'Qual é o seu nome ', b: 'em chinês?' },
  ko: { eyebrow: '중국 이름 생성기', a: '당신의 이름을 ', b: '중국어로' }
};

const FOOT = {
  en: 'Pinyin · Meanings · Classical sources · Calligraphy · Stroke order',
  ja: 'ピンイン・意味・古典出典・書道・筆順',
  pt: 'Pinyin · Significados · Fontes clássicas · Caligrafia · Ordem dos traços',
  ko: '병음 · 의미 · 고전 출처 · 서예 · 필순'
};

const INDEX_COPY = {
  en: { eyebrow: 'Character library', a: '120 characters, ', b: 'one page each',
        foot: 'Meaning · Pinyin · Stroke order · Classical source' },
  ja: { eyebrow: '漢字一覧', a: '厳選した 120 字を', b: '一字ずつ',
        foot: '意味・ピンイン・筆順・古典出典' },
  pt: { eyebrow: 'Biblioteca de caracteres', a: '120 caracteres, ', b: 'um por página',
        foot: 'Significado · Pinyin · Traços · Fonte clássica' },
  ko: { eyebrow: '한자 목록', a: '엄선한 120자, ', b: '한 자씩',
        foot: '의미 · 병음 · 필순 · 고전 출처' }
};

const GIFT_COPY = {
  en: { eyebrow: 'Carriers', a: 'A Chinese name, ', b: 'made into an object',
        sub: 'Seal, jewellery, tea, stationery — how a name travels when it becomes something you can hold.',
        foot: 'Ten carriers · Materials, cost and what each one suits' },
  ja: { eyebrow: '工芸', a: '中国名を、', b: 'かたちにする',
        sub: '印鑑・アクセサリー・茶・文具。名前が手に取れるものになったときの運び方。',
        foot: '10 の工芸 · 素材、費用、向いている場面' },
  pt: { eyebrow: 'Suportes', a: 'Um nome chinês ', b: 'feito objeto',
        sub: 'Selo, joia, chá, papelaria — como um nome viaja quando vira algo que se pode segurar.',
        foot: 'Dez suportes · Materiais, custo e para que serve cada um' },
  ko: { eyebrow: '공예', a: '중국 이름을 ', b: '사물로',
        sub: '도장, 장신구, 차, 문구 — 이름이 손에 잡히는 것이 될 때의 쓰임.',
        foot: '10가지 공예 · 재료, 비용, 어울리는 자리' }
};

const TOOL_COPY = {
  myname: { eyebrow: 'My name in Chinese', a: 'Your name, ', b: 'not transliterated',
    sub: 'Michael becomes 麦克 — a label chosen for sound. A chosen name means something before it sounds like anything.',
    foot: 'Transliteration vs. a chosen name · What each is for' },
  pinyin: { eyebrow: 'Hanzi to pinyin', a: 'Chinese to pinyin, ', b: 'with the tones right',
    sub: '行 and 长 change reading by word, not by character. Context resolves them instead of guessing.',
    foot: 'Tone marks · Polyphonic characters · Copy as plain pinyin' },
  stroke: { eyebrow: 'Stroke order', a: 'Watch the character ', b: 'write itself',
    sub: 'Every stroke in order, then a grid to print and practise on paper.',
    foot: 'Animated stroke order · Practice sheet · Five rules' }
};

function hubJobs() {
  const jobs = [];
  SHIPPED.forEach(function (code) {
    const c = HOME_COPY[code] || HOME_COPY.en;
    jobs.push({
      name: 'home-' + code,
      html: hubCard({
        eyebrow: c.eyebrow,
        h1: c.a + '<span class="accent">' + c.b + '</span>',
        chips: SAMPLES,
        foot: FOOT[code] || FOOT.en
      })
    });
  });

  /* The character index. Its card shows a spread of the library rather than
     the same five samples as the home card, so two links from the same site
     do not look identical in a feed. */
  const INDEX = [
    { ch: '山', py: 'shān' }, { ch: '水', py: 'shuǐ' }, { ch: '风', py: 'fēng' },
    { ch: '月', py: 'yuè' }, { ch: '云', py: 'yún' }
  ];
  SHIPPED.forEach(function (code) {
    const c = INDEX_COPY[code] || INDEX_COPY.en;
    jobs.push({
      name: 'characters-' + code,
      html: hubCard({
        eyebrow: c.eyebrow, h1: c.a + '<span class="accent">' + c.b + '</span>',
        h1size: 74, chips: INDEX, foot: c.foot
      })
    });
  });

  /* Gift hub. */
  SHIPPED.forEach(function (code) {
    const c = GIFT_COPY[code] || GIFT_COPY.en;
    jobs.push({
      name: 'gifts-' + code,
      html: hubCard({
        eyebrow: c.eyebrow, h1: c.a + '<span class="accent">' + c.b + '</span>',
        sub: c.sub, h1size: 72, foot: c.foot
      })
    });
  });

  /* The three English-only tool pages each get their own card, because a
     shared card would misdescribe two of the three links. */
  [['my-name-in-chinese', TOOL_COPY.myname],
   ['hanzi-to-pinyin', TOOL_COPY.pinyin],
   ['stroke-order', TOOL_COPY.stroke]].forEach(function (pair) {
    const slug = pair[0], c = pair[1];
    jobs.push({
      name: 'tool-' + slug,
      html: hubCard({
        eyebrow: c.eyebrow, h1: c.a + '<span class="accent">' + c.b + '</span>',
        sub: c.sub, h1size: 70, foot: c.foot
      })
    });
  });

  return jobs;
}

/* Carrier pages. Each one already carries a single-character icon and a
two-part headline, so the card reuses both rather than inventing copy. */
function giftJobs() {
  const catalog = require('./_gifts/catalog.cjs');
  const jobs = [];
  SHIPPED.forEach(function (code) {
    let text;
    try { text = require('./_gifts/text.' + code + '.cjs'); } catch (e) { text = require('./_gifts/text.en.cjs'); }
    catalog.forEach(function (item) {
      const g = text[item.slug];
      if (!g) return;
      jobs.push({
        name: 'gift-' + item.slug + '-' + code,
        html: shell(
          topBar() +
          '<div class="charwrap">' +
            '<div class="glyph" style="font-size:210px">' + item.icon + '</div>' +
            '<div class="charmeta">' +
              '<div class="eyebrow" style="margin:0 0 14px">' + g.name + '</div>' +
              '<h1 style="font-family:' + FONT_SERIF + ';font-size:56px;margin:0">' +
                g.h1a + ' <span class="accent">' + g.h1b + '</span></h1>' +
            '</div>' +
          '</div>' +
          '<div class="foot"><span>Chinese Name Helper · Carriers</span>' +
            '<b>chinesenamehelper.com</b></div>'
        )
      });
    });
  });
  return jobs;
}

function charJobs() {
  const g = globalThis;
  ['characters.js', 'characters2.js'].forEach(function (f) {
    const src = fs.readFileSync(path.join(SITE, 'assets', 'data', f), 'utf8');
    new Function('window', src)(g);
  });
  const seen = new Set();
  const out = [];
  [].concat(g.HANZI || [], g.HANZI2 || []).forEach(function (r) {
    if (!r || !r.c || seen.has(r.c)) return;
    seen.add(r.c);
    out.push({ name: 'char-' + r.c.codePointAt(0).toString(16), html: charCard(r) });
  });
  return out;
}

/* ---------- run ---------- */

const mode = process.argv[2] || 'all';
let jobs;
if (mode === 'hubs') jobs = hubJobs();
else if (mode === 'chars') jobs = charJobs();
else if (mode === 'gifts') jobs = giftJobs();
else if (mode === 'one') jobs = hubJobs().slice(0, 1);
else jobs = hubJobs().concat(giftJobs()).concat(charJobs());

console.log('chrome: ' + CHROME);
console.log('writing ' + jobs.length + ' card(s) to site/assets/og\n');

let ok = 0;
const failed = [];
jobs.forEach(function (j) {
  const r = shoot(j.name, j.html);
  if (r.ok) { ok++; process.stdout.write('  ok  ' + j.name + '  ' + Math.round(r.bytes / 1024) + 'KB\n'); }
  else { failed.push(j.name + ': ' + r.err); process.stdout.write('  FAIL ' + j.name + '\n'); }
});

console.log('\nwrote ' + ok + ' of ' + jobs.length);
if (failed.length) failed.slice(0, 5).forEach(function (f) { console.log('  - ' + f); });
