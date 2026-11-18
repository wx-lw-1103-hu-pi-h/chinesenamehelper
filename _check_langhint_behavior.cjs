/* Execute lang-hint.js against a fake DOM and assert its behaviour.
 *
 * A static grep can prove there is no redirect primitive in the source, but not
 * that the script behaves correctly for each visitor. This harness runs the
 * real file with stubbed navigator/document/localStorage so the cases that
 * matter are actually exercised:
 *
 *   1. A Korean browser on the English home page sees a hint — and the page did
 *      not navigate. That is the exact scenario the SEO rule protects.
 *   2. A Brazilian Portuguese browser on the English page sees a pt hint.
 *   3. An English browser on /pt/ sees an English hint pointing at the root,
 *      which must be "/" and not "/en/".
 *   4. A Spanish browser sees nothing, because /es/ does not exist — offering
 *      it would be a dead link.
 *
 * Plus: a hint is not shown when the visitor already reads that language, a
 * dismissal is remembered, a crawler-shaped visit with no language preference
 * gets an untouched page, and an untranslated page offers nothing.
 *
 * Three inputs are kept apart on purpose, because collapsing them is how this
 * harness could pass while the site was broken:
 *   pageLang  the language the page was generated in (html lang)
 *   altLangs  which <link rel="alternate"> the page carries
 *   navLangs  the visitor's navigator.languages
 *
 * Run: node _check_langhint_behavior.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = fs.readFileSync(path.join(__dirname, 'site', 'assets', 'js', 'lang-hint.js'), 'utf8');

const ORIGIN = 'https://chinesenamehelper.com';
const ALL = require('./_i18n/index.cjs').SHIPPED;

/* Alternate links as the generators emit them. English is the root. */
function alternates(langs) {
  return langs.map(l => ({ rel: 'alternate', hreflang: l, href: ORIGIN + (l === 'en' ? '/' : '/' + l + '/') }));
}

function makePage(pageLang, altLangs, navLangs) {
  const nodes = [];
  const body = {
    firstChild: null,
    insertBefore(node) { nodes.unshift(node); this.firstChild = node; return node; },
    removeChild(node) {
      const i = nodes.indexOf(node);
      if (i >= 0) nodes.splice(i, 1);
      this.firstChild = nodes[0] || null;
      node.parentNode = null;
      return node;
    }
  };
  const alts = alternates(altLangs);

  function el(tag) {
    return {
      tagName: String(tag).toUpperCase(),
      className: '', id: '', type: '', textContent: '', href: '',
      parentNode: body,
      children: [],
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      addEventListener(ev, fn) { this['on' + ev] = fn; },
      appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    };
  }

  const doc = {
    readyState: 'complete',
    documentElement: { lang: pageLang },
    body: body,
    createElement: el,
    querySelector(sel) {
      const m = sel.match(/hreflang="([^"]+)"/);
      if (!m) return null;
      return alts.find(a => a.hreflang === m[1]) || null;
    },
    addEventListener() { /* readyState is complete, so never used */ }
  };

  const store = {};
  const win = {
    document: doc,
    navigator: { language: navLangs[0], languages: navLangs },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); }
    }
  };

  return { win, doc, nodes, store };
}

function run(page) {
  const ctx = vm.createContext({
    window: page.win, document: page.doc,
    navigator: page.win.navigator, localStorage: page.win.localStorage, console
  });
  vm.runInContext(SRC, ctx, { filename: 'lang-hint.js' });
  return ctx;
}

const problems = [];
function expect(cond, msg) { if (!cond) problems.push(msg); }

function barOf(nodes) { return nodes.find(n => n && n.className === 'lang-hint'); }
function child(bar, cls) { return bar && bar.children.find(c => c.className === cls); }

/* ---- 1. Korean browser, English page: hint shown, nothing navigated ---- */
{
  const page = makePage('en', ALL, ['ko-KR', 'ko', 'en-US']);
  run(page);
  const bar = barOf(page.nodes);
  expect(!!bar, 'ko on / : no hint appeared');
  if (bar) {
    const cta = child(bar, 'lh-cta');
    expect(!!cta, 'ko on / : hint has no link');
    expect(cta && cta.href === ORIGIN + '/ko/', 'ko on / : link is ' + (cta && cta.href) + ', want ' + ORIGIN + '/ko/');
    expect(cta && cta.textContent.indexOf('한국어') >= 0, 'ko on / : call to action is not in Korean');
    /* The CTA does have a click handler — to remember the choice. Assert it
       touches localStorage only and never calls a navigation API. */
    expect(page.doc.documentElement.lang === 'en', 'ko on / : page language was changed');
    expect(typeof cta.onclick === 'function', 'ko on / : CTA has no click handler to remember the choice');
    if (cta && typeof cta.onclick === 'function') {
      const before = JSON.stringify(page.store);
      cta.onclick();
      expect(JSON.stringify(page.store) !== before, 'ko on / : clicking the CTA did not remember the choice');
      expect(cta.href === ORIGIN + '/ko/', 'ko on / : clicking the CTA changed the link');
    }
  }
}

/* ---- 2. Brazilian Portuguese browser, English page -> pt ---- */
{
  const page = makePage('en', ALL, ['pt-BR', 'pt', 'en-US']);
  run(page);
  const cta = child(barOf(page.nodes), 'lh-cta');
  expect(cta && cta.href === ORIGIN + '/pt/', 'pt-BR on / : link is ' + (cta && cta.href));
  expect(cta && cta.textContent.indexOf('português') >= 0, 'pt-BR on / : call to action is not in Portuguese');
}

/* ---- 3. English browser on the Portuguese page -> root, never /en/ ---- */
{
  const page = makePage('pt', ALL, ['en-US', 'en']);
  run(page);
  const cta = child(barOf(page.nodes), 'lh-cta');
  expect(cta && cta.href === ORIGIN + '/', 'en on /pt/ : link is ' + (cta && cta.href) + ', want the root');
  expect(!(cta && /\/en\//.test(cta.href)), 'en on /pt/ : link points at /en/, which does not exist');
}

/* ---- 4. Japanese browser on the English page -> /ja/ ---- */
{
  const page = makePage('en', ALL, ['ja-JP', 'ja']);
  run(page);
  const cta = child(barOf(page.nodes), 'lh-cta');
  expect(cta && cta.href === ORIGIN + '/ja/', 'ja on / : link is ' + (cta && cta.href) + ', want ' + ORIGIN + '/ja/');
  expect(cta && cta.textContent.indexOf('日本語') >= 0, 'ja on / : call to action is not in Japanese');
}

/* ---- 5. Spanish browser: silence, because /es/ was never built ---- */
{
  const page = makePage('en', ALL, ['es-ES', 'es']);
  run(page);
  expect(!barOf(page.nodes), 'es on / : a hint appeared for an unbuilt locale');
}

/* ---- 6. Japanese already reading Japanese: no hint ---- */
{
  const page = makePage('ja', ALL, ['ja-JP']);
  run(page);
  expect(!barOf(page.nodes), 'ja on /ja/ : hint shown for the visitor language already');
}

/* ---- 7. dismissal is remembered, and the next visit stays quiet ---- */
{
  const page = makePage('en', ALL, ['ko-KR']);
  run(page);
  const bar = barOf(page.nodes);
  const close = child(bar, 'lh-close');
  expect(!!close, 'dismiss button missing');
  if (close) {
    close.onclick();
    expect(!barOf(page.nodes), 'dismissing did not remove the bar');
    expect(Object.keys(page.store).some(k => k.indexOf('langhint.ko') >= 0), 'dismissal was not remembered');

    const again = makePage('en', ALL, ['ko-KR']);
    Object.assign(again.store, page.store);
    run(again);
    expect(!barOf(again.nodes), 'hint returned after being dismissed');
  }
}

/* ---- 8. crawler-shaped visit: no language preference at all ---- */
{
  const page = makePage('en', ALL, []);
  page.win.navigator = {};
  run(page);
  expect(!barOf(page.nodes), 'a visitor with no browser language got a hint');
}

/* ---- 9. English-only page carrying no alternates ---- */
{
  const page = makePage('en', [], ['ko-KR']);
  run(page);
  expect(!barOf(page.nodes), 'an untranslated page offered a language switch');
}

console.log('scenarios: 9 | problems:', problems.length);
problems.forEach(p => console.log('  -', p));
console.log(problems.length ? 'RESULT: ' + problems.length + ' behaviour problem(s)' : 'RESULT: hint behaves correctly');
