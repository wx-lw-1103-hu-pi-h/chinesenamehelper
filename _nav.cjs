/* The nav and footer link block, in one place.

   Every generated page used to build its own anchors. That was harmless while
   all of them were plain links, but the EN treatment — hreflang="en" plus a
   visible marker on the entries whose target is still English — has to be
   identical everywhere it appears, or a reader who lands on /ja/character/明/
   from search sees bare Japanese anchors and gets the same surprise the marker
   exists to prevent. _gen_home.cjs had grown its own private copy, the section
   generators had none, so 396 pages lacked the marker.

   link() already routes an untranslated path to the English page, so the href
   is correct without help here. What this adds is the two signals:

     hreflang="en"  — states the target's language. Deliberately not lang="en":
                      lang describes the anchor text, which is Japanese, and
                      would make a screen reader pronounce it as English.
     a trailing EN  — visible before the click, so the switch is expected.

   Nothing is added on the English pages: there the target is in the reader's
   own language, and a badge would be noise.
 */
'use strict';
const i18n = require('./_i18n/index.cjs');
const { link, isTranslated } = i18n;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* One anchor, already indented for the templates that interpolate the block. */
function anchor(code, p, label, isCurrent) {
  /* isTranslated() takes the English path, which is what these entries are. */
  const fellBack = code !== 'en' && !isTranslated(p);

  /* link() is the one place that knows whether to prefix the locale; calling
     href() here would hand-build a path that can drift from it. */
  const href = link(code, p);
  const cur = isCurrent ? ' aria-current="true"' : '';

  if (!fellBack) {
    return '      <a href="' + href + '"' + cur + '>' + esc(label) + '</a>';
  }
  return '      <a href="' + href + '" hreflang="en"' + cur + '>' + esc(label) +
    '<span class="nav-en" aria-hidden="true">EN</span></a>';
}

/**
 * The six header entries.
 *
 * @param {string} code        locale code of the page being built
 * @param {object} t           the locale's ui bundle (must carry nav.*)
 * @param {string} [current]   optional path to mark with aria-current
 * @param {string} [giftsLabel] the gift section keeps its own label, which
 *                              lives in the gift bundle rather than the ui one
 */
function navFor(code, t, current, giftsLabel) {
  const items = [
    ['/', t['nav.generator']],
    ['/my-name-in-chinese/', t['nav.myname']],
    ['/hanzi-to-pinyin/', t['nav.pinyin']],
    ['/stroke-order/', t['nav.stroke']],
    ['/characters/', t['nav.characters']],
    ['/gifts/', giftsLabel || t['nav.gifts']]
  ];
  return items.map(function (e) {
    return anchor(code, e[0], e[1], current === e[0]);
  }).join('\n');
}

/**
 * The footer's tools column. Same four tool links as the head of the header
 * nav, same treatment — the footer is a second path to the same English pages,
 * so leaving it bare would reintroduce the surprise on every page that has one.
 */
function footTools(code, t) {
  const items = [
    ['/', t['nav.generator']],
    ['/my-name-in-chinese/', t['nav.myname']],
    ['/hanzi-to-pinyin/', t['nav.pinyin']],
    ['/stroke-order/', t['nav.stroke']]
  ];
  return items.map(function (e) {
    return anchor(code, e[0], e[1], false);
  }).join('\n');
}

module.exports = { navFor, footTools };
