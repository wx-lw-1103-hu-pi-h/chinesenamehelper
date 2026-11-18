/**
 * Language suggestion bar — a hint, never a redirect.
 *
 * The rule this file is built around: automatic detection may decide what to
 * *suggest*, but only a click may change the page. Crawlers arrive without a
 * browser language and usually from a US IP, so any redirect based on either
 * signal would send every crawler to the English page and leave /pt/ and /ko/
 * unindexed. There is deliberately no location.href, no replace, no 302 here —
 * the only navigation is the <a> the visitor chooses to click.
 *
 * The target URL is taken from the page's own <link rel="alternate">, which is
 * generated from the same source as the canonical and the switcher menu. A
 * hint can therefore never point at a locale that was not built.
 *
 * Only SHIPPED locales are suggested. A browser set to Spanish gets no hint,
 * because /es/ does not exist and offering it would be a broken promise.
 */
(function () {
  'use strict';

  /* Browser language -> shipped locale. Regional variants collapse to the base
     tag: pt-BR and pt-PT both map to pt, which is the only Portuguese build. */
  var BROWSER_TO_LOCALE = { en: 'en', ja: 'ja', pt: 'pt', ko: 'ko' };

  /* HTML lang values used in this site's hreflang links. */
  var LOCALE_TO_HREFLANG = { en: 'en', ja: 'ja', pt: 'pt', ko: 'ko' };

  /* The copy is written in the TARGET language, not the current page's, so the
     reader can actually understand the suggestion before deciding. */
  var COPY = {
    en: { text: 'This page is also available in English.', cta: 'View in English', close: 'Dismiss' },
    ja: { text: 'このページは日本語でも読めます。', cta: '日本語で見る', close: '閉じる' },
    pt: { text: 'Esta página também está disponível em português.', cta: 'Ver em português', close: 'Fechar' },
    ko: { text: '이 페이지는 한국어로도 제공됩니다.', cta: '한국어로 보기', close: '닫기' }
  };

  var STORE_KEY = 'cnh.langhint.';

  function store(key) {
    try { return window.localStorage.getItem(STORE_KEY + key); } catch (e) { return null; }
  }
  function remember(key) {
    try { window.localStorage.setItem(STORE_KEY + key, '1'); } catch (e) { /* private mode: hint simply returns next visit */ }
  }

  function suggestedLocale() {
    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : (navigator.language ? [navigator.language] : []);
    for (var i = 0; i < langs.length; i++) {
      var base = String(langs[i]).toLowerCase().split('-')[0];
      if (BROWSER_TO_LOCALE[base]) return BROWSER_TO_LOCALE[base];
    }
    return null;
  }

  function currentLocale() {
    return String(document.documentElement.lang || '').toLowerCase().split('-')[0];
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var target = suggestedLocale();
    if (!target || target === currentLocale()) return;
    if (store(target)) return;

    /* No alternate link means this page is English-only (a tool page that has
       not been translated). Nothing to suggest, so stay silent. */
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + LOCALE_TO_HREFLANG[target] + '"]');
    if (!alt || !alt.href) return;

    var c = COPY[target];
    if (!c) return;

    var bar = document.createElement('div');
    bar.id = 'lang-hint';
    bar.className = 'lang-hint';
    bar.setAttribute('role', 'status');

    var text = document.createElement('span');
    text.className = 'lh-text';
    text.textContent = c.text;

    /* The href is assigned as a DOM property, never interpolated into HTML:
       the value comes from the page itself, but keeping it out of a string
       makes that guarantee structural rather than something to re-check. */
    var link = document.createElement('a');
    link.className = 'lh-cta';
    link.href = alt.href;
    link.textContent = c.cta + ' \u2192';
    link.addEventListener('click', function () { remember(target); });

    var close = document.createElement('button');
    close.className = 'lh-close';
    close.type = 'button';
    close.setAttribute('aria-label', c.close);
    close.textContent = '\u00d7';
    close.addEventListener('click', function () {
      remember(target);
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    });

    bar.appendChild(text);
    bar.appendChild(link);
    bar.appendChild(close);

    /* Insert as the very first element in the body. A normal-flow bar (not
       fixed) pushes the header down instead of covering the name input, so
       the first screen stays usable exactly as it is. */
    var body = document.body;
    if (!body) return;
    body.insertBefore(bar, body.firstChild);
  });
})();
