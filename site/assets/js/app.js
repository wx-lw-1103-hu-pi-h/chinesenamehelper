/**
 * Page controller.
 *
 * Wiring only — the naming logic lives in engine.js, the calligraphy in
 * signature.js. This file owns the DOM, the URL state and the small
 * interactions that make the page worth staying on: expanding a name,
 * switching signature style, drawing stroke order, exporting a card.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var E = window.NamingEngine;
  var S = window.Signature;

  /* Brand strings that get burned into exported images. Kept in one place so a
     domain or brand change does not leave stale text inside downloaded PNGs. */
  var SITE_HOST = 'chinesenamehelper.com';
  var SITE_NAME = 'CHINESE NAME HELPER';

  /* ---------------- runtime strings ----------------
     Every sentence this page prints after a click comes from /assets/i18n/<code>.js,
     generated from the same ui/<code>.cjs the HTML was built from. Without it a
     Portuguese visitor would get a Portuguese page and an English result card.
     The bundle is loaded by the page, not fetched here, so there is no race. */
  var I18N = window.I18N || null;
  var UI = (I18N && I18N.ui) || {};
  var GLOSS = (I18N && I18N.chars) || {};

  /* Missing key returns the key itself rather than 'undefined': a visible
     res.names on the page is an obvious bug report, a blank button is not. */
  function t(key, vars) {
    var s = UI[key];
    if (s === undefined || s === null) return key;
    if (!vars) return s;
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] === undefined || vars[k] === null ? m : String(vars[k]);
    });
  }

  /* Prefixed paths so /pt/ links stay inside /pt/. A page that was generated for
     every locale is safe to prefix; the still-English tools are not, so they keep
     the English path the HTML already links to. */
  var LOCALE_PREFIX = (I18N && I18N.prefix) || '';
  function href(p) { return LOCALE_PREFIX ? LOCALE_PREFIX + p : p; }

  var els = {
    form: $('#name-form'),
    surname: $('#surname'),
    gender: $('#gender'),
    by: $('#birth'),
    bm: $('#bm'),
    bd: $('#bd'),
    desc: $('#desc'),
    go: $('#go'),
    results: $('#results'),
    empty: $('#empty'),
    title: $('#results-title'),
    sub: $('#results-sub'),
    cards: $('#cards'),
    strip: $('#chart-strip'),
    regen: $('#regen'),
    print: $('#print'),
    share: $('#share'),
    toast: $('#toast'),
    libNote: $('#lib-note')
  };

  if (!E || !S) return;

  /* ---------------- toast ---------------- */
  var toastTimer;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, 2100);
  }

  /* ---------------- surname select ---------------- */
  (function fillSurnames() {
    if (!els.surname || !window.SURNAMES) return;
    var frag = document.createDocumentFragment();
    window.SURNAMES.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.c;
      o.textContent = s.c + ' · ' + s.p + ' (' + s.en + ')';
      frag.appendChild(o);
    });
    els.surname.appendChild(frag);
  })();

  (function noteCounts() {
    if (!els.libNote) return;
    var n = E.library().length;
    var sn = (window.SURNAMES || []).length;
    /* The HTML already carries this string; rewriting it here only matters when
       the data files disagree with what the generator counted at build time. */
    els.libNote.textContent = t('form.libnote', { n: n, s: sn });
  })();

  /* ---------------- state ---------------- */
  /* `avoid` holds the given names already shown in this session, so "Another
     set" explores instead of re-dealing the same top pair every time. It is
     carried in the URL as well, otherwise a shared link would restore a
     different list from the one the sharer saw. */
  var state = { seed: 1, data: null, inputs: null, avoid: [], urlAvoid: [] };
  var AVOID_MAX = 60;

  function readInputs() {
    var y = parseInt(els.by.value, 10);
    var m = parseInt(els.bm.value, 10);
    var d = parseInt(els.bd.value, 10);
    var dateOk = y >= 1900 && y <= 2099 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
    /* reject impossible dates rather than silently shifting them */
    if (dateOk) {
      var probe = new Date(y, m - 1, d);
      if (probe.getFullYear() !== y || probe.getMonth() !== m - 1 || probe.getDate() !== d) dateOk = false;
    }
    return {
      surname: els.surname.value || '',
      gender: els.gender.value,
      year: dateOk ? y : null,
      month: dateOk ? m : null,
      day: dateOk ? d : null,
      desc: els.desc.value.trim()
    };
  }

  function generate(seed) {
    var inp = state.inputs || readInputs();
    state.inputs = inp;

    /* Snapshot the exclusion list *before* this batch is added to it. The URL
       must carry what was excluded to produce this result — not what has been
       seen afterwards — otherwise opening someone's link skips the very names
       it was supposed to show. */
    state.urlAvoid = state.avoid.slice();

    return E.generate({
      surname: inp.surname,
      gender: inp.gender,
      year: inp.year, month: inp.month, day: inp.day,
      desc: inp.desc,
      seed: seed,
      avoid: state.urlAvoid,
      count: 5
    });
  }

  /* ---------------- URL state ---------------- */
  /* The whole result is reproducible from these params, so a link is enough. */
  function writeURL(seed) {
    var i = state.inputs;
    var p = new URLSearchParams();
    if (i.surname) p.set('s', i.surname);
    if (i.gender && i.gender !== 'neutral') p.set('g', i.gender);
    if (i.year) { p.set('y', i.year); p.set('m', i.month); p.set('d', i.day); }
    if (i.desc) p.set('q', i.desc);
    if (seed > 1) p.set('n', seed);
    var used = state.urlAvoid || [];
    if (used.length) p.set('a', used.slice(-AVOID_MAX).join('.'));
    var url = location.pathname + (p.toString() ? '?' + p.toString() : '');
    try { history.replaceState(null, '', url); } catch (e) { /* file:// */ }
  }

  function readURL() {
    var p = new URLSearchParams(location.search);
    if (p.get('s')) els.surname.value = p.get('s');
    if (p.get('g')) els.gender.value = p.get('g');
    if (p.get('y')) els.by.value = p.get('y');
    if (p.get('m')) els.bm.value = p.get('m');
    if (p.get('d')) els.bd.value = p.get('d');
    if (p.get('q')) els.desc.value = p.get('q');
    var n = parseInt(p.get('n'), 10);
    state.seed = n > 0 ? n : 1;
    state.avoid = (p.get('a') || '').split('.').filter(Boolean).slice(-AVOID_MAX);
    return p.toString().length > 0;
  }

  /* ---------------- render ---------------- */
  function render(data) {
    state.data = data;

    /* Remember what the visitor has just been shown so the next draw moves on. */
    data.names.forEach(function (nm) {
      if (state.avoid.indexOf(nm.given) < 0) state.avoid.push(nm.given);
    });
    if (state.avoid.length > AVOID_MAX) state.avoid = state.avoid.slice(-AVOID_MAX);

    els.results.hidden = false;
    els.empty.hidden = true;

    var inp = state.inputs;
    els.title.textContent = inp.surname
      ? t('res.names')
      : t('res.givennames');
    els.sub.textContent = t('res.sub', { n: data.names.length });

    renderChart(data.chart);
    els.cards.innerHTML = '';
    data.names.forEach(function (nm) {
      els.cards.appendChild(buildCard(nm, data.chart));
    });

    els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var ELEM_EN = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };

  /* Element names are translated in the bundle; ELEM_EN stays as the fallback
     for the five keys the ui files use (el.wood, el.fire, ...). */
  function elemName(e) { return t('el.' + (ELEM_EN[e] || e)); }

  function renderChart(c) {
    var s = els.strip;
    if (!c || !c.ok) {
      /* No birthday: say something true instead of showing an empty bar. */
      s.hidden = false;
      s.innerHTML = '<span class="chip">' + esc(t('chart.nodate')) + '</span>' +
        '<span class="chip">' + esc(t('chart.desconly')) + '</span>' +
        '<span style="color:var(--ink-mute);font-size:12.5px">' + esc(t('chart.adddate')) + '</span>';
      return;
    }
    s.hidden = false;
    var parts = [];
    parts.push('<span class="chip">' + esc(t('chart.zodiac', {
      zodiac: c.zodiac, en: c.zodiacEn ? t('zodiac.' + c.zodiac) : ''
    })) + '</span>');
    if (c.lunarText) {
      parts.push('<span class="chip">' + esc(t('chart.lunar', { date: c.lunarText })) + '</span>');
    }

    var total = 0;
    E.ALL_ELEMENTS.forEach(function (e) { total += (c.elementCount[e] || 0); });
    E.ALL_ELEMENTS.forEach(function (e) {
      var v = c.elementCount[e] || 0;
      var cls = c.weak.indexOf(e) >= 0 ? 'chip hot' : (v >= 3 ? 'chip jade' : 'chip');
      parts.push('<span class="' + cls + '">' + esc(t('chart.elem', { cn: e, en: elemName(e) })) +
        ' <b>' + v + '</b></span>');
    });
    if (c.weak && c.weak.length) {
      parts.push('<span style="color:var(--ink-mute);font-size:12.5px">' +
        esc(t('chart.thinnest', {
          list: c.weak.map(function (e) { return elemName(e) + ' (' + e + ')'; }).join(', ')
        })) + '</span>');
    }
    s.innerHTML = parts.join('');
  }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* The given-name characters are links, not decoration. This is the loop the
     site is built around: a visitor who just got a name can learn the two
     characters they were given, which is the reason a naming tool and a
     character-learning tool belong on the same site. */
  /* One anchor per character, each its own practice square. The square *is*
     the link, so the row of squares lands on the character pages without a
     second row of controls underneath. */
  function charLinks(nm) {
    return Array.from(nm.full).map(function (ch) {
      return '<a class="hz-cell" href="' + href('/character/' + encodeURIComponent(ch) + '/') +
        '" title="' + esc(t('card.charlink', { ch: ch })) + '">' + esc(ch) + '</a>';
    }).join('');
  }

  /* The character record carries the English gloss from the data file. On /pt/
     and /ko/ the bundle has a rewritten one, and the card must show that one. */
  function gloss(c, field) {
    var g = GLOSS[c.c];
    if (g && g[field]) return g[field];
    return field === 'm' ? c.meaning : field === 'w' ? c.west : c.note;
  }

  function buildCard(nm, chart) {
    var card = document.createElement('article');
    card.className = 'name-card';
    card.dataset.full = nm.full;

    var elems = nm.chars.map(function (c) {
      return '<span class="chip">' + c.c + ' · ' + esc(elemName(c.element)) + ' ' + c.element + '</span>';
    }).join('');

    card.innerHTML =
      '<div class="nc-main" role="button" tabindex="0" aria-expanded="false">' +
        '<div class="nc-glyph" data-n="' + Array.from(nm.full).length + '">' +
          '<span class="rk">' + String(nm.rank).padStart(2, '0') + '</span>' +
          '<span class="hz">' + charLinks(nm) + '</span>' +
        '</div>' +
        '<div class="nc-body">' +
          '<div class="nc-pinyin">' + esc(nm.pinyin) + '</div>' +
          '<div class="nc-why">' + esc(whyText(nm)) + '</div>' +
          '<div class="nc-mean">' + nm.chars.map(function (c) { return esc(gloss(c, 'm')); }).join(' · ') + '</div>' +
          '<div class="nc-elems">' + elems + '</div>' +
        '</div>' +
        '<div class="nc-side">' +
          '<div class="score-ring" style="--v:' + nm.fit + '" title="' + esc(t('res.score', { v: nm.fit })) + '">' +
            '<span>' + nm.fit + '</span>' +
          '</div>' +
          '<span class="nc-expand">' + esc(t('res.details')) + ' <span class="arw">▾</span></span>' +
        '</div>' +
      '</div>' +
      '<div class="nc-detail"><div class="detail-grid">' + buildDetail(nm) + '</div>' +
        buildSignaturePanel(nm) +
        buildStrokeBox(nm) +
        '<div class="tool-row">' +
          '<button class="btn-ghost btn-sm" data-act="card">' + esc(t('card.cardbtn')) + '</button>' +
          '<button class="btn-ghost btn-sm" data-act="copy">' + esc(t('card.copybtn')) + '</button>' +
          '<span class="sep"></span>' +
          nm.chars.map(function (c) {
            return '<a class="btn-ghost btn-sm" href="' + href('/character/' + encodeURIComponent(c.c) + '/') +
              '" style="text-decoration:none">' + esc(t('card.learn', { ch: c.c })) + '</a>';
          }).join('') +
        '</div>' +
      '</div>';

    var main = $('.nc-main', card);
    var toggle = function () {
      var open = card.classList.toggle('open');
      main.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) initCardTools(card, nm);
    };
    main.addEventListener('click', toggle);
    /* A click on a character inside the header means "tell me about this
       character", not "expand the card" — the link wins. */
    $$('.hz-cell', card).forEach(function (a) {
      a.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    main.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    $('[data-act="card"]', card).addEventListener('click', function () {
      downloadNameCard(nm, chart);
    });
    $('[data-act="copy"]', card).addEventListener('click', function () {
      copyText(nm.full, t('res.copied', { name: nm.full }));
    });

    return card;
  }

  /* The engine returns which signals fired; the sentence is assembled here from
     the locale's own strings. Ordering matches the old English wording: element
     reason first, then the description match, then the sound. */
  function whyText(nm) {
    var w = nm.why || {};
    var bits = [];
    var names = function (list) { return list.map(elemName).join(', '); };
    if (w.weak && w.weak.length) bits.push(t('why.weak', { elems: names(w.weak) }));
    else if (w.support && w.support.length) bits.push(t('why.support', { elems: names(w.support) }));
    if (w.tags && w.tags.length) bits.push(t('why.meaning', { tags: w.tags.join(', ') }));
    if (w.tonesDiffer) bits.push(t('why.tone'));
    return bits.length ? bits.join('; ') + '.' : t('why.none');
  }

  function buildDetail(nm) {
    return nm.chars.map(function (c) {
      return '<div class="detail-col">' +
        '<h4><span class="han">' + c.c + '</span> ' + c.p + ' · ' +
          esc(t('card.strokes', { n: c.strokes })) + '</h4>' +
        '<div class="src-block">' +
          '<p class="src-cite">' + esc(c.book) + '</p>' +
          '<p class="src-quote">' + esc(c.line) + '</p>' +
          '<p class="src-en">' + esc(c.lineEn) + '</p>' +
          '<p class="src-west">' + esc(gloss(c, 'w')) + '</p>' +
          '<p class="src-note">' + esc(gloss(c, 'n')) + '</p>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function buildSignaturePanel(nm) {
    return '<div class="signature-panel">' +
      '<h4>' + esc(t('card.sigtitle')) + '</h4>' +
      '<p class="sub">' + esc(t('card.sigsub')) + '</p>' +
      '<div class="sig-styles" role="group" aria-label="' + esc(t('card.sigstyle')) + '">' +
        '<button class="sig-style" data-style="running" aria-pressed="true">' + esc(t('card.running')) + '</button>' +
        '<button class="sig-style" data-style="neat" aria-pressed="false">' + esc(t('card.neat')) + '</button>' +
        '<button class="sig-style" data-style="seal" aria-pressed="false">' + esc(t('card.seal')) + '</button>' +
        '<button class="sig-style" data-style="wild" aria-pressed="false">' + esc(t('card.wild')) + '</button>' +
      '</div>' +
      '<div class="sig-stage"><canvas width="560" height="190" data-sig></canvas></div>' +
      '<div class="sig-actions">' +
        '<button class="btn-ghost btn-sm" data-act="sig-png">' + esc(t('card.sigpng')) + '</button>' +
        '<button class="btn-ghost btn-sm" data-act="sig-copy">' + esc(t('card.sigcopy')) + '</button>' +
      '</div>' +
    '</div>';
  }

  function buildStrokeBox(nm) {
    var cells = nm.chars.map(function (c) {
      return '<div class="stroke-cell" data-hz="' + c.c + '"><span class="lbl">' + c.c + '</span></div>';
    }).join('');
    return '<div class="stroke-box">' +
      '<div class="stroke-canvas-wrap">' + cells + '</div>' +
      '<div class="stroke-meta">' +
        '<b>' + esc(t('card.strokeorder')) + '</b><br>' +
        nm.chars.map(function (c) {
          return '<b>' + c.c + '</b> ' + esc(t('card.strokes', { n: c.strokes }));
        }).join(' · ') +
        '<br>' + esc(t('card.replayhint')) +
      '</div>' +
    '</div>';
  }

  /* ---------------- lazily initialised per-card tools ---------------- */
  var cardInit = new WeakSet();

  function initCardTools(card, nm) {
    if (cardInit.has(card)) return;
    cardInit.add(card);

    /* signature */
    var canvas = $('[data-sig]', card);
    var current = 'running';
    var draw = function (style) {
      current = style;
      S.render(canvas, { text: nm.full, style: style, sealText: nm.chars[0].c });
    };
    draw('running');

    $$('.sig-style', card).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.sig-style', card).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        draw(btn.dataset.style);
      });
    });

    $('[data-act="sig-png"]', card).addEventListener('click', function () {
      S.download(canvas, nm.full + '-' + current + '.png');
      toast(t('card.sigsaved'));
    });

    $('[data-act="sig-copy"]', card).addEventListener('click', function () {
      if (!navigator.clipboard || !window.ClipboardItem) { toast(t('card.sigrightclick')); return; }
      canvas.toBlob(function (blob) {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          .then(function () { toast(t('card.sigcopied')); })
          .catch(function () { toast(t('card.sigcopyuse')); });
      });
    });

    /* stroke animations */
    initStrokes(card, nm);
  }

  function initStrokes(card, nm) {
    if (!window.HanziWriter) return;
    $$('.stroke-cell', card).forEach(function (cell) {
      var ch = cell.dataset.hz;
      var w = cell.clientWidth || 96;
      var h = cell.clientHeight || 96;
      var target = document.createElement('div');
      target.style.cssText = 'position:absolute;inset:0';
      cell.appendChild(target);

      var writer = window.HanziWriter.create(target, ch, {
        width: w, height: h, padding: 5,
        strokeColor: '#17241f',
        radicalColor: '#b23a2a',
        strokeAnimationSpeed: 1.3,
        delayBetweenStrokes: 90,
        showOutline: true,
        outlineColor: '#bccfc2'
      });

      var data = { strokes: [], medians: [] };
      window.HanziWriter.loadCharacterData(ch).then(function (d) {
        data = d;
        if (cell.querySelector('.lbl')) {
          cell.querySelector('.lbl').textContent = ch + ' · ' + d.strokes.length;
        }
      }).catch(function () { /* offline: the outline still renders */ });

      cell.addEventListener('click', function () { writer.animateCharacter(); });
      /* animate once when the card first opens, with a short stagger */
      setTimeout(function () { writer.animateCharacter(); }, 220 + Math.random() * 180);
    });
  }

  /* ---------------- name card export ---------------- */
  function downloadNameCard(nm, chart) {
    var W = 1080, H = 1350;
    var c = document.createElement('canvas');
    var dpr = 1;
    c.width = W * dpr; c.height = H * dpr;
    var ctx = c.getContext('2d');

    /* paper — the exported card is the one artifact that leaves the site, so it
       carries the same celadon, 黛 ink and double frame the page does rather
       than a warm cream. A saved card that does not match the page it came from
       undoes the page's colours in the only place a stranger sees them. */
    ctx.fillStyle = '#e0eae2';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#bccfc2';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.lineWidth = 1;
    ctx.strokeRect(42, 42, W - 84, H - 84);

    /* header */
    ctx.fillStyle = '#b23a2a';
    ctx.font = '600 26px Georgia, serif';
    ctx.fillText(SITE_NAME, 72, 100);
    ctx.fillStyle = '#52645b';
    ctx.font = '400 22px Georgia, serif';
    ctx.fillText(SITE_HOST, 72, 134);

    /* the name, large */
    ctx.fillStyle = '#17241f';
    ctx.font = '600 190px "Songti SC","STSong",Georgia,serif';
    ctx.textBaseline = 'alphabetic';
    var nameY = 400;
    var mx = ctx.measureText(nm.full).width;
    ctx.fillText(nm.full, (W - mx) / 2, nameY);

    /* pinyin */
    ctx.fillStyle = '#b23a2a';
    ctx.font = '400 40px Georgia, serif';
    var pw = ctx.measureText(nm.pinyin).width;
    ctx.fillText(nm.pinyin, (W - pw) / 2, nameY + 70);

    /* divider */
    ctx.strokeStyle = '#bccfc2';
    ctx.beginPath();
    ctx.moveTo(140, nameY + 120);
    ctx.lineTo(W - 140, nameY + 120);
    ctx.stroke();

    /* meanings, one per character */
    var y = nameY + 200;
    nm.chars.forEach(function (ch) {
      ctx.fillStyle = '#17241f';
      ctx.font = '600 52px "Songti SC","STSong",Georgia,serif';
      ctx.fillText(ch.c, 140, y);

      ctx.fillStyle = '#3c4d46';
      ctx.font = '400 26px -apple-system,Segoe UI,Arial,sans-serif';
      wrapText(ctx, ch.meaning, 240, y - 10, W - 380, 34);

      ctx.fillStyle = '#b23a2a';
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillText(ch.book, 240, y + 32);

      ctx.fillStyle = '#52645b';
      ctx.font = '400 21px -apple-system,Segoe UI,Arial,sans-serif';
      wrapText(ctx, ch.lineEn, 240, y + 62, W - 380, 30);

      y += 150;
    });

    /* chart line */
    if (chart && chart.ok) {
      ctx.fillStyle = '#2f6d59';
      ctx.font = '400 24px -apple-system,Segoe UI,Arial,sans-serif';
      ctx.fillText(chart.zodiac + ' · ' + (chart.zodiacEn ? t('zodiac.' + chart.zodiac) : '') +
        '  ·  ' + chart.lunarText, 140, y + 20);
    }

    /* signature strip */
    var sc = document.createElement('canvas');
    S.render(sc, { text: nm.full, style: 'running', width: 900, height: 220, sealText: nm.chars[0].c });
    ctx.drawImage(sc, (W - 900) / 2, H - 330);

    /* footer */
    ctx.fillStyle = '#52645b';
    ctx.font = '400 20px -apple-system,Segoe UI,Arial,sans-serif';
    ctx.fillText(t('cardexport.footer'), 72, H - 56);

    var a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = t('cardexport.download', { name: nm.full });
    a.click();
    toast(t('card.cardsaved'));
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    var words = String(text).split(' ');
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        line = words[i];
        y += lh;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
  }

  function copyText(text, okMsg) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); })
        .catch(function () { toast(t('res.copyfail')); });
    } else {
      toast(text);
    }
  }

  /* ---------------- form submit ---------------- */
  if (els.form) {
    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = readInputs();
      /* Every field on this form is optional, including the description. An
         empty form used to be blocked with a toast, which turned a suggestion
         into a requirement — the message listed a birthday and a description
         together, so it read as a condition. Now an empty form simply draws
         from the whole library, and the hint under the box says so once. */
      state.inputs = inputs;
      state.seed = 1;
      /* A new subject deserves a fresh pool of candidates. */
      state.avoid = [];
      els.go.disabled = true;
      els.go.textContent = t('form.submitting');
      setTimeout(function () {
        var data = generate(1);
        els.go.disabled = false;
        els.go.textContent = t('form.submit');
        if (!data.names.length) { toast(t('res.err')); return; }
        render(data);
        writeURL(1);
      }, 60);
    });
  }

  if (els.regen) {
    els.regen.addEventListener('click', function () {
      /* The pool widens as names are used up, so a long session keeps
         producing new names. Only clear the history once it is genuinely
         large — otherwise the visitor sees old favourites again. */
      if (state.avoid.length >= 50) state.avoid = [];
      state.seed += 1;
      var data = generate(state.seed);
      render(data);
      writeURL(state.seed);
    });
  }

  if (els.print) {
    els.print.addEventListener('click', function () { window.print(); });
  }

  if (els.share) {
    els.share.addEventListener('click', function () {
      var url = location.href;
      if (navigator.share) {
        navigator.share({ title: t('res.sharetitle'), url: url }).catch(function () { });
      } else {
        copyText(url, t('res.linkcopied'));
      }
    });
  }

  /* ---------------- boot ---------------- */
  (function boot() {
    var yr = $('#yr');
    if (yr) yr.textContent = new Date().getFullYear();

    var had = readURL();
    if (had && (els.desc.value || els.by.value)) {
      state.inputs = readInputs();
      var data = generate(state.seed);
      if (data.names.length) render(data);
    } else {
      els.empty.hidden = false;
    }
  })();
})();
