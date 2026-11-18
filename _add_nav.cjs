/* Add the character library to every page's navigation and footer. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'site');
const files = [
  'index.html',
  'my-name-in-chinese/index.html',
  'hanzi-to-pinyin/index.html',
  'stroke-order/index.html',
  'characters/index.html'
];

/* The pages are saved with CRLF, so match on the real line endings rather
   than assuming LF. */
const EOL = '\r\n';

const NAV_FROM = '<a href="/stroke-order/">Stroke order</a>' + EOL + '    </nav>';
const NAV_TO = '<a href="/stroke-order/">Stroke order</a>' + EOL +
  '      <a href="/characters/">Characters</a>' + EOL + '    </nav>';

const FOOT_FROM = '<a href="/stroke-order/">Stroke order</a>' + EOL + '    </div>';
const FOOT_TO = '<a href="/stroke-order/">Stroke order</a>' + EOL +
  '      <a href="/characters/">Character library</a>' + EOL + '    </div>';

for (const rel of files) {
  const file = path.join(ROOT, rel);
  let s = fs.readFileSync(file, 'utf8');
  const before = s;
  if (s.includes(NAV_FROM) && !s.includes('/characters/">Characters')) {
    s = s.replace(NAV_FROM, NAV_TO);
  }
  if (s.includes(FOOT_FROM) && !s.includes('/characters/">Character library')) {
    s = s.replace(FOOT_FROM, FOOT_TO);
  }
  if (s !== before) {
    fs.writeFileSync(file, s, 'utf8');
    console.log('updated  ' + rel);
  } else {
    console.log('no change ' + rel);
  }
}
