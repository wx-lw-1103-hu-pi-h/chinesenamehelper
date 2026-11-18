/**
 * Hanzi → pinyin page.
 *
 * Delegates the actual conversion to pinyin-pro, which ships the full
 * Unicode CJK dictionary (~50k characters) plus context-aware polyphone
 * resolution — 银行 → yínháng, 音乐 → yīnyuè. Reimplementing that with a
 * hand-written table was the previous version's mistake: it covered 69% of
 * common characters and silently returned "?" for the rest.
 *
 * This file keeps the parts pinyin-pro does not do: the ruby layout, the
 * per-character meaning tooltips from the site's curated library, and the
 * copyable plain output.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* Curated records for the characters this site actually names people with. */
  var REC = {};
  (function () {
    var all = [].concat(window.HANZI || [], window.HANZI2 || []);
    all.forEach(function (c) { if (c && c.c) REC[c.c] = c; });
  })();

  function isHanzi(ch) {
    var cp = ch.codePointAt(0);
    return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF) ||
           (cp >= 0x20000 && cp <= 0x2A6DF) || (cp >= 0xF900 && cp <= 0xFAFF);
  }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var PP = window.pinyinPro;

  /* Character-level readings, used when pinyin-pro is unavailable. */
  var FALLBACK = window.HANZI_PINYIN || {};

  /**
   * Returns one entry per character, keeping punctuation as its own item.
   * pinyin-pro resolves polyphones from the surrounding word before it splits
   * the result, so 银行 is read as a unit.
   */
  function convert(text) {
    var chars = Array.from(text);
    var out = [];
    var hanziIndexes = [];

    chars.forEach(function (ch, i) {
      if (isHanzi(ch)) hanziIndexes.push(i);
    });

    var pyList = null;
    if (PP && PP.pinyin && hanziIndexes.length) {
      try {
        var only = hanziIndexes.map(function (i) { return chars[i]; }).join('');
        pyList = PP.pinyin(only, { type: 'array', toneType: 'symbol' });
        if (!Array.isArray(pyList)) pyList = null;
      } catch (e) { pyList = null; }
    }

    var hIdx = 0;
    chars.forEach(function (ch, i) {
      if (!isHanzi(ch)) {
        out.push({ ch: ch, py: '', isHanzi: false });
        return;
      }
      var py = pyList && pyList[hIdx] ? pyList[hIdx] : (FALLBACK[ch] || '');
      hIdx++;
      out.push({ ch: ch, py: py, isHanzi: true });
    });

    return out;
  }

  function render() {
    var src = $('#pinyin-in').value;
    var box = $('#pinyin-out');
    var stats = $('#pinyin-stats');

    if (!src.trim()) {
      box.innerHTML = '<div class="empty-state" style="padding:36px 16px"><div class="big">拼音</div><p>Type or paste Chinese text above.</p></div>';
      stats.textContent = '';
      $('#pinyin-plain').value = '';
      return;
    }

    var items = convert(src);
    var html = '';
    var chars = 0, unknown = [];
    var plain = [];

    items.forEach(function (it) {
      if (!it.isHanzi) {
        html += '<span class="py-punct">' + esc(it.ch) + '</span>';
        if (it.ch.trim()) plain.push(it.ch);
        return;
      }
      chars++;
      if (!it.py) unknown.push(it.ch);
      var rec = REC[it.ch];
      /* Only build a tooltip when the record actually has a meaning — the
         previous version produced "hé — undefined" for records missing it. */
      var tip = rec && rec.meaning ? (it.py + ' — ' + rec.meaning) : it.py;
      html += '<ruby title="' + esc(tip) + '">' + esc(it.ch) +
        '<rt>' + esc(it.py || '?') + '</rt></ruby>';
      plain.push(it.py || '?');
    });

    box.innerHTML = html;
    stats.innerHTML = chars + ' characters' +
      (unknown.length ? ' · <span style="color:var(--cinnabar)">' + unknown.length +
        ' without a reading: ' + esc(unknown.slice(0, 8).join(' ')) + '</span>' : ' · all readings found');
    $('#pinyin-plain').value = plain.join(' ');
  }

  function init() {
    var input = $('#pinyin-in');
    if (!input) return;

    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(render, 130);
    });

    $('#pinyin-sample').addEventListener('click', function () {
      input.value = '重庆的银行行长说，音乐和快乐不一样，重要的事情要重复做。';
      render();
    });

    $('#pinyin-clear').addEventListener('click', function () {
      input.value = '';
      render();
      input.focus();
    });

    $('#pinyin-copy').addEventListener('click', function () {
      var t = $('#pinyin-plain').value;
      if (!t) return;
      navigator.clipboard.writeText(t).then(function () {
        var b = $('#pinyin-copy');
        var old = b.textContent;
        b.textContent = 'Copied';
        setTimeout(function () { b.textContent = old; }, 1500);
      });
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
