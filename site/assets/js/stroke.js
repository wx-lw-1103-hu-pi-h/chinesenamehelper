/**
 * Stroke order page.
 *
 * hanzi-writer supplies the stroke paths and medians from Make Me a Hanzi,
 * so the animation is the real writing order rather than an approximation.
 * The printable sheet is built as a separate window so it can be laid out
 * independently of the screen styling.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var grid = $('#so-grid');
  if (!grid) return;

  /* Host printed on the practice sheet — keep in sync with _i18n/index.cjs. */
  var SITE_HOST = 'chinesenamehelper.com';

  var PY = window.HANZI_PINYIN || {};
  var REC = {};
  (function () {
    var all = [].concat(window.HANZI || [], window.HANZI2 || []);
    all.forEach(function (c) { if (c && c.c) REC[c.c] = c; });
  })();

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isHanzi(ch) {
    var cp = ch.codePointAt(0);
    return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF) ||
           (cp >= 0x20000 && cp <= 0x2A6DF) || (cp >= 0xF900 && cp <= 0xFAFF);
  }

  var writers = [];

  /* Characters outside the shipped set cannot be animated without a network
     call, so report that honestly instead of silently fetching from a CDN. */
  function loadLocalData(c) {
    return fetch('/assets/hanzi-data/' + encodeURIComponent(c) + '.json')
      .then(function (r) { if (!r.ok) throw new Error('not in the local dataset'); return r.json(); });
  }

  function build(ch) {
    var cell = document.createElement('div');
    cell.className = 'so-cell';
    cell.dataset.ch = ch;

    var stage = document.createElement('div');
    stage.className = 'stage';

    var meta = document.createElement('div');
    meta.className = 'meta';
    var py = (REC[ch] && REC[ch].p) || PY[ch] || '';
    /* ch is filtered through isHanzi before we get here, but the pinyin comes
       from a table — escape both rather than trust either. */
    meta.innerHTML = '<b>' + esc(ch) + '</b>' + (py ? ' <span class="py">' + esc(py) + '</span>' : '') +
      '<br><span class="cnt">loading…</span>';

    var acts = document.createElement('div');
    acts.className = 'acts';
    acts.innerHTML = '<button data-a="play">Play</button><button data-a="quiz">Quiz</button>' +
      '<button data-a="print">Sheet</button>';

    cell.appendChild(stage);
    cell.appendChild(meta);
    cell.appendChild(acts);
    grid.appendChild(cell);

    if (!window.HanziWriter) {
      $('.cnt', meta).textContent = 'animation unavailable offline';
      stage.textContent = ch;
      stage.style.cssText += ';display:grid;place-items:center;font-family:var(--serif);font-size:64px';
      return;
    }

    var size = stage.clientWidth || 148;
    var writer = window.HanziWriter.create(stage, ch, {
      width: size, height: size, padding: 6,
      strokeColor: '#17241f',
      radicalColor: '#b23a2a',
      strokeAnimationSpeed: 1.2,
      delayBetweenStrokes: 110,
      showOutline: true,
      outlineColor: '#bccfc2',
      charDataLoader: function (c, onComplete, onError) {
        /* The dataset for every character the site knows about is shipped with
           the project, so the page works offline and makes no third-party
           request at runtime. */
        fetch('/assets/hanzi-data/' + encodeURIComponent(c) + '.json')
          .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
          .then(onComplete)
          .catch(onError);
      }
    });
    writers.push(writer);

    window.HanziWriter.loadCharacterData(ch, { charDataLoader: loadLocalData }).then(function (d) {
      $('.cnt', meta).textContent = d.strokes.length + ' strokes';
    }).catch(function () { $('.cnt', meta).textContent = 'stroke data unavailable'; });

    acts.addEventListener('click', function (e) {
      var a = e.target.dataset.a;
      if (!a) return;
      if (a === 'play') writer.animateCharacter();
      if (a === 'quiz') {
        writer.quiz({
          onMistake: function () { /* keep going; correction is the lesson */ },
          onComplete: function (summary) {
            $('.cnt', meta).textContent = 'quiz: ' + summary.totalMistakes + ' corrections';
          }
        });
      }
      if (a === 'print') printSheet([ch]);
    });

    stage.style.cursor = 'pointer';
    stage.addEventListener('click', function () { writer.animateCharacter(); });
  }

  function render(text) {
    grid.innerHTML = '';
    writers = [];
    var chars = Array.from(text).filter(isHanzi);
    if (!chars.length) {
      grid.innerHTML = '<p style="color:var(--ink-mute);font-size:14px">Type a Chinese character above.</p>';
      return;
    }
    chars.slice(0, 8).forEach(build);
  }

  /* Printable worksheet: one row of pale targets, then empty cells.

     The cells are 米字格, not bare squares. A practice sheet that omits the
     diagonals is a grid you cannot align a 欍 or a 点 against, and this is the
     one artifact on the site a learner actually puts a pen into — so the guides
     have to be the real ones. The gradient is drawn in the print stylesheet
     because it has to print: background images are off by default in some
     browsers, so the rule is set with `-webkit-print-color-adjust: exact` too. */
  function printSheet(chars) {
    var w = window.open('', '_blank');
    if (!w) return;
    var cellsPerChar = 6;
    var rows = chars.map(function (ch) {
      var row = '';
      for (var i = 0; i < cellsPerChar; i++) {
        row += '<div class="c">' + (i === 0
          ? '<span class="t" style="color:#a3bbaa">' + esc(ch) + '</span>'
          : (i === 1 ? '<span class="t" style="color:#bccfc2;opacity:.55">' + esc(ch) + '</span>' : '')) + '</div>';
      }
      return '<div class="row"><div class="lbl"><b>' + esc(ch) + '</b><i>' + esc(PY[ch] || '') + '</i></div>' + row + '</div>';
    }).join('');

    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Stroke practice — ' +
      esc(chars.join('')) + '</title>' +
      '<style>' +
      '@page{margin:14mm}' +
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'body{font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#17241f;margin:0}' +
      'h1{font-size:16px;font-weight:600;margin:0 0 2px}' +
      'p.sub{font-size:11px;color:#52645b;margin:0 0 16px}' +
      '.row{display:flex;gap:8px;align-items:center;margin-bottom:12px;page-break-inside:avoid}' +
      '.lbl{width:66px;flex:none;text-align:center}.lbl b{display:block;font-size:26px;font-family:serif}' +
      '.lbl i{font-size:10px;color:#b23a2a;font-style:normal}' +
      '.c{width:64px;height:64px;border:1px solid #a3bbaa;position:relative;flex:none;' +
      'background-image:' +
      'linear-gradient(to right,#bccfc2 1px,transparent 1px),' +
      'linear-gradient(to bottom,#bccfc2 1px,transparent 1px),' +
      'linear-gradient(to bottom right,transparent calc(50% - .5px),#bccfc2 calc(50% - .5px),#bccfc2 calc(50% + .5px),transparent calc(50% + .5px)),' +
      'linear-gradient(to bottom left,transparent calc(50% - .5px),#bccfc2 calc(50% - .5px),#bccfc2 calc(50% + .5px),transparent calc(50% + .5px));' +
      'background-size:50% 100%,100% 50%,100% 100%,100% 100%}' +
      '.t{position:absolute;inset:0;display:grid;place-items:center;font-size:46px;font-family:serif}' +
      'footer{margin-top:14px;font-size:10px;color:#52645b;border-top:1px solid #bccfc2;padding-top:6px}' +
      '</style></head><body>' +
      '<h1>Hanzi practice sheet</h1>' +
      '<p class="sub">Trace the faded characters, then write your own. ' + SITE_HOST + '</p>' +
      rows +
      '<footer>Generated at ' + SITE_HOST + ' — free, no sign-up.</footer>' +
      '</body></html>'
    );
    w.document.close();
    setTimeout(function () { w.print(); }, 350);
  }

  var input = $('#so-in');
  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { render(input.value); }, 220);
  });

  $('#so-anim').addEventListener('click', function () {
    writers.forEach(function (wr, i) {
      setTimeout(function () { wr.animateCharacter(); }, i * 550);
    });
  });

  $('#so-print').addEventListener('click', function () {
    var chars = Array.from(input.value).filter(isHanzi);
    if (chars.length) printSheet(chars.slice(0, 10));
  });

  render(input.value);
})();
