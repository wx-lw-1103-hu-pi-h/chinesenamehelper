/* Find user-facing English still hard-coded in the runtime scripts. A sentence
   that stays here will show up verbatim on /pt/ and /ko/ after a click, which
   is exactly the bug the runtime bundle exists to prevent. */
const fs = require('fs');

const FILES = [
  'site/assets/js/app.js',
  'site/assets/js/engine.js',
  'site/assets/js/stroke.js',
  'site/assets/js/signature.js',
  'site/assets/js/app-foot.js'
];

/* Quoted strings that read like prose: three or more words, starting with a
   capital or lowercase word followed by a space. Paths, keys, CSS and selector
   strings are excluded by requiring a lowercase letter after a space. */
const PROSE = /(['"])([A-Za-z][^'"]{10,}?)\1/g;

let bad = 0;
FILES.forEach(function (f) {
  if (!fs.existsSync(f)) { console.log('skip  ' + f + ' (missing)'); return; }
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const hits = [];
  lines.forEach(function (line, i) {
    if (/^\s*\*/.test(line) || /^\s*\/\//.test(line)) return;  /* comments */
    let m;
    PROSE.lastIndex = 0;
    while ((m = PROSE.exec(line))) {
      const v = m[2];
      if (!/\s/.test(v)) continue;
      /* Skip things that are clearly not sentences. */
      if (/^[\w./#:%,-]+$/.test(v)) continue;
      if (/^[a-z-]+\s*[:=]/.test(v)) continue;
      if (/^(GET|POST|application|image|text|utf)/.test(v)) continue;
      if (/[{};]/.test(v)) continue;
      if (/var\(--/.test(v)) continue;
      if (/\d+px/.test(v)) continue;
      if (/^-?\d/.test(v)) continue;
      /* A sentence normally contains a lowercase word after a space. */
      if (!/[a-z]{2,}\s+[a-z]{2,}/.test(v)) continue;
      hits.push((i + 1) + ': ' + v);
    }
  });
  console.log((hits.length ? 'CHECK ' : 'ok    ') + f + ' (' + hits.length + ')');
  hits.slice(0, 25).forEach(function (h) { console.log('        ' + h); });
  bad += hits.length;
});

console.log(bad ? 'RESULT: ' + bad + ' candidate string(s) need review' : 'RESULT: no hard-coded prose found');
